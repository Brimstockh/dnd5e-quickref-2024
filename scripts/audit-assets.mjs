import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const assetRoots = ["assets", "img"];
const sourceExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".webmanifest"]);
const supportedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const modernExtensions = new Set([".avif", ".webp"]);
const reportPath = resolve(root, "data/assets-report.json");

function compareStrings(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}

function firstDifference(left, right, path = "") {
    if (Object.is(left, right)) return null;
    if (typeof left !== typeof right || left === null || right === null) return { path: path || "(root)", left, right };

    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right)) return { path: path || "(root)", left, right };
        const length = Math.min(left.length, right.length);
        for (let index = 0; index < length; index += 1) {
            const difference = firstDifference(left[index], right[index], `${path}[${index}]`);
            if (difference) return difference;
        }
        return left.length === right.length
            ? null
            : { path: `${path || "(root)"}.length`, left: left.length, right: right.length };
    }

    if (typeof left === "object") {
        const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort(compareStrings);
        for (const key of keys) {
            const difference = firstDifference(left[key], right[key], path ? `${path}.${key}` : key);
            if (difference) return difference;
        }
        return null;
    }
    return { path: path || "(root)", left, right };
}

function formatDifferenceValue(value) {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
}

function formatReportMismatch(committed, generated) {
    const difference = firstDifference(committed, generated);
    if (!difference) return "Asset report mismatch";
    return [
        "Asset report mismatch",
        "---------------------",
        "First difference:",
        difference.path,
        `Committed: ${formatDifferenceValue(difference.left)}`,
        `Generated: ${formatDifferenceValue(difference.right)}`,
    ].join("\n");
}

async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((a, b) => compareStrings(a.name, b.name))) {
        if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "playwright-report" || entry.name === "test-results") continue;
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) files.push(...await walk(path));
        else if (entry.isFile()) files.push(path);
    }
    return files;
}

function relativePath(path) {
    return relative(root, path).replaceAll("\\", "/");
}

function pngDimensions(buffer) {
    if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47) return null;
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
    let offset = 2;
    while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        offset += 2;
        if (marker === 0xd8 || marker === 0xd9) continue;
        if (offset + 2 > buffer.length) break;
        const length = buffer.readUInt16BE(offset);
        if (length < 2 || offset + length > buffer.length) break;
        const isFrame = (marker >= 0xc0 && marker <= 0xc3)
            || (marker >= 0xc5 && marker <= 0xc7)
            || (marker >= 0xc9 && marker <= 0xcb)
            || (marker >= 0xcd && marker <= 0xcf);
        if (isFrame && offset + 7 < buffer.length) {
            return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
        }
        offset += length;
    }
    return null;
}

function webpDimensions(buffer) {
    if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
        return {
            width: 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16),
            height: 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16),
        };
    }
    if (chunk === "VP8 " && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    return null;
}

function svgDimensions(buffer) {
    const source = buffer.toString("utf8", 0, Math.min(buffer.length, 16_384));
    const viewBox = source.match(/viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
    if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
    const width = source.match(/\bwidth=["']([\d.]+)/i);
    const height = source.match(/\bheight=["']([\d.]+)/i);
    return width && height ? { width: Number(width[1]), height: Number(height[1]) } : null;
}

function dimensionsFor(extension, buffer) {
    if (extension === ".png") return pngDimensions(buffer);
    if (extension === ".jpg" || extension === ".jpeg") return jpegDimensions(buffer);
    if (extension === ".webp") return webpDimensions(buffer);
    if (extension === ".svg") return svgDimensions(buffer);
    return null;
}

function assetRecommendation(asset) {
    if (!asset.referenced) return "review-unreferenced";
    if (asset.extension === ".png" && asset.variants.some((variant) => modernExtensions.has(variant.extension))) {
        if (asset.path.startsWith("assets/icons/pwa-")) return "keep-pwa-icon";
        return "review-png-variant";
    }
    if (asset.bytes >= 500_000) return "review-large-asset";
    return "keep";
}

export async function buildAssetReport(projectRoot = root) {
    const files = [];
    for (const directory of assetRoots) {
        const absolute = resolve(projectRoot, directory);
        for (const file of await walk(absolute)) {
            const extension = extname(file).toLowerCase();
            if (supportedExtensions.has(extension)) files.push({ path: relative(projectRoot, file).replaceAll("\\", "/"), absolute: file, extension });
        }
    }
    files.sort((a, b) => compareStrings(a.path, b.path));

    const sourceFiles = (await walk(projectRoot)).filter((file) => {
        if (!sourceExtensions.has(extname(file).toLowerCase())) return false;
        return relative(projectRoot, file).replaceAll("\\", "/") !== "data/assets-report.json";
    }).sort((left, right) => compareStrings(relativePath(left), relativePath(right)));
    const sourceTexts = await Promise.all(sourceFiles.map(async (file) => [relativePath(file), await readFile(file, "utf8")]));
    const byStem = new Map();
    for (const file of files) {
        const stem = file.path.slice(0, -file.extension.length);
        if (!byStem.has(stem)) byStem.set(stem, []);
        byStem.get(stem).push(file);
    }

    const assets = [];
    for (const file of files) {
        const buffer = await readFile(file.absolute);
        const references = sourceTexts.filter(([, source]) => source.includes(file.path)).map(([path]) => path);
        const inferredReferences = [];
        if (file.path.startsWith("img/characters/")) {
            const key = file.path.split("/").pop().replace(/\.(?:png|webp)$/i, "").replace(/-full$/, "");
            const index = sourceTexts.find(([path]) => path === "data/characters/index.json");
            if (index && index[1].includes(`"${key}"`)) inferredReferences.push(index[0]);
        }
        if (file.path.startsWith("img/enemies/")) {
            const name = file.path.split("/").pop().replace(/\.webp$/i, "").toLowerCase();
            const monsterData = sourceTexts.find(([path]) => path === "data/monsters_2024.json");
            if (monsterData && monsterData[1].toLowerCase().includes(name)) inferredReferences.push(monsterData[0]);
        }
        const allReferences = [...new Set([...references, ...inferredReferences])].sort(compareStrings);
        const variants = (byStem.get(file.path.slice(0, -file.extension.length)) || [])
            .filter((variant) => variant.path !== file.path)
            .map((variant) => ({ extension: variant.extension, path: variant.path }))
            .sort((left, right) => compareStrings(left.path, right.path));
        const asset = {
            path: file.path,
            extension: file.extension,
            bytes: buffer.length,
            dimensions: dimensionsFor(file.extension, buffer),
            variants,
            referenced: allReferences.length > 0,
            references: allReferences,
            referenceMode: references.length && inferredReferences.length ? "exact+inferred" : inferredReferences.length ? "inferred" : references.length ? "exact" : "none",
        };
        asset.recommendation = assetRecommendation(asset);
        assets.push(asset);
    }

    const byFormat = {};
    for (const asset of assets) {
        const format = asset.extension.slice(1);
        byFormat[format] = byFormat[format] || { files: 0, bytes: 0 };
        byFormat[format].files += 1;
        byFormat[format].bytes += asset.bytes;
    }
    const referenced = assets.filter((asset) => asset.referenced);
    const report = {
        schemaVersion: 1,
        roots: assetRoots,
        summary: {
            files: assets.length,
            bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
            referenced: referenced.length,
            unreferenced: assets.length - referenced.length,
            pngWithModernVariant: assets.filter((asset) => asset.extension === ".png" && asset.variants.some((variant) => modernExtensions.has(variant.extension))).length,
            largePngWithoutModernVariant: assets.filter((asset) => asset.extension === ".png" && asset.bytes >= 500_000 && !asset.variants.some((variant) => modernExtensions.has(variant.extension))).length,
            largeAssets: assets.filter((asset) => asset.bytes >= 500_000).length,
            byFormat,
        },
        largest: [...assets].sort((a, b) => b.bytes - a.bytes || compareStrings(a.path, b.path)).slice(0, 25).map((asset) => ({ path: asset.path, bytes: asset.bytes, extension: asset.extension })),
        assets,
    };
    return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const report = await buildAssetReport();
    if (process.argv.includes("--check")) {
        const current = JSON.parse(await readFile(reportPath, "utf8"));
        if (JSON.stringify(current) !== JSON.stringify(report)) {
            console.error(formatReportMismatch(current, report));
            process.exitCode = 1;
        } else if (report.summary.largePngWithoutModernVariant > 0) {
            console.error("Asset policy failed: a large PNG has no WebP or AVIF variant.");
            process.exitCode = 1;
        }
    } else {
        await mkdir(resolve(root, "data"), { recursive: true });
        await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
        console.log(`Asset audit: ${report.summary.files} fichiers, ${report.summary.bytes} octets, ${report.summary.unreferenced} non référencés.`);
    }
}

export { firstDifference, formatReportMismatch };

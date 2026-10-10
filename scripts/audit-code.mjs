import { readdir, readFile, stat } from "node:fs/promises";
import { posix } from "node:path";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if ([".git", "node_modules", "_site"].includes(entry.name)) continue;
        const absolutePath = resolve(directory, entry.name);
        const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
        if (entry.isDirectory()) files.push(...await walk(absolutePath, relativePath));
        else if (entry.isFile()) files.push({ absolutePath, relativePath });
    }
    return files;
}

function localReference(reference, sourcePath) {
    if (!reference || /^(?:#|data:|https?:|mailto:|javascript:)/i.test(reference)) return null;
    const clean = reference.split(/[?#]/, 1)[0].replaceAll("\\", "/");
    if (!clean) return null;
    return posix.normalize(posix.join(posix.dirname(sourcePath), clean)).replace(/^\.\//, "");
}

async function buildCodeAudit(projectRoot = root) {
    const files = await walk(projectRoot);
    const javascript = files.filter(({ relativePath }) => relativePath.startsWith("js/") && relativePath.endsWith(".js"));
    const stylesheets = files.filter(({ relativePath }) => relativePath.startsWith("css/") && relativePath.endsWith(".css"));
    const html = files.filter(({ relativePath }) => relativePath.endsWith(".html"));
    const htmlSources = await Promise.all(html.map(async ({ absolutePath, relativePath }) => ({ path: relativePath, source: await readFile(absolutePath, "utf8") })));
    const javascriptSources = await Promise.all(javascript.map(async ({ absolutePath, relativePath }) => ({ path: relativePath, source: await readFile(absolutePath, "utf8") })));
    const loadedJavascript = new Set();
    const loadedStylesheets = new Set();

    for (const { path, source } of htmlSources) {
        for (const match of source.matchAll(/<script\b[^>]*\bsrc=(['"])(.*?)\1/gi)) {
            const reference = localReference(match[2], path);
            if (reference) loadedJavascript.add(reference);
        }
        for (const match of source.matchAll(/<link\b[^>]*\bhref=(['"])(.*?)\1/gi)) {
            const reference = localReference(match[2], path);
            if (reference?.endsWith(".css")) loadedStylesheets.add(reference);
        }
    }
    for (const { path, source } of javascriptSources) {
        for (const match of source.matchAll(/(?:import\s+(?:[^"']+\s+from\s+)?|import\s*\(|fetch\s*\()\s*["']([^"']+)["']/g)) {
            const reference = localReference(match[1], path);
            if (reference?.endsWith(".js")) loadedJavascript.add(reference);
        }
    }

    const emptyFiles = [];
    for (const file of [...javascript, ...stylesheets]) if ((await stat(file.absolutePath)).size === 0) emptyFiles.push(file.relativePath);
    const stylesheetLines = await Promise.all(stylesheets.map(async ({ absolutePath }) => (await readFile(absolutePath, "utf8")).split(/\r?\n/).length - 1));
    return {
        javascriptFiles: javascript.length,
        javascriptLines: javascriptSources.reduce((total, { source }) => total + source.split(/\r?\n/).length - 1, 0),
        stylesheetFiles: stylesheets.length,
        stylesheetLines: stylesheetLines.reduce((total, lines) => total + lines, 0),
        unreferencedJavascript: javascript.map(({ relativePath }) => relativePath).filter((path) => !loadedJavascript.has(path)).sort(),
        unreferencedStylesheets: stylesheets.map(({ relativePath }) => relativePath).filter((path) => !loadedStylesheets.has(path)).sort(),
        emptyFiles,
        vipConversionWrapper: (await readFile(resolve(projectRoot, "scripts/convert-vip-images.mjs"), "utf8")).includes("./convert-images.mjs"),
    };
}

function checkCodeAudit(report) {
    if (report.emptyFiles.length) throw new Error(`Fichiers JS/CSS vides : ${report.emptyFiles.join(", ")}`);
    if (!report.vipConversionWrapper) throw new Error("Le wrapper convert-vip-images.mjs doit rester compatible.");
}

const report = await buildCodeAudit();
console.log(`JavaScript : ${report.javascriptFiles} fichiers, ${report.javascriptLines} lignes`);
console.log(`CSS : ${report.stylesheetFiles} fichiers, ${report.stylesheetLines} lignes`);
console.log(`JS non référencés directement : ${report.unreferencedJavascript.length}`);
console.log(`CSS non référencés directement : ${report.unreferencedStylesheets.length}`);
if (report.unreferencedJavascript.length) console.log(`À classifier manuellement : ${report.unreferencedJavascript.join(", ")}`);
if (report.unreferencedStylesheets.length) console.log(`À classifier manuellement : ${report.unreferencedStylesheets.join(", ")}`);
if (process.argv.includes("--check")) checkCodeAudit(report);

export { buildCodeAudit };

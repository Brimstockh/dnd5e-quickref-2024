import { readFile, readdir, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const errors = [];

async function htmlFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) files.push(...await htmlFiles(path));
        else if (entry.isFile() && extname(entry.name).toLowerCase() === ".html") files.push(path);
    }
    return files;
}

function decodeHtml(value) {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function localReference(value) {
    const decoded = decodeHtml(value.trim());
    if (!decoded || decoded === "#" || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(decoded)) return null;
    const hashIndex = decoded.indexOf("#");
    const withoutHash = hashIndex === -1 ? decoded : decoded.slice(0, hashIndex);
    const queryIndex = withoutHash.indexOf("?");
    return {
        hash: hashIndex === -1 ? "" : decoded.slice(hashIndex + 1),
        path: queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex),
    };
}

function lineNumber(source, index) {
    return source.slice(0, index).split("\n").length;
}

function report(file, line, message) {
    errors.push(`${relative(root, file)}:${line}: ${message}`);
}

async function exists(file) {
    try {
        return (await stat(file)).isFile();
    } catch {
        return false;
    }
}

async function validatePage(file) {
    const source = await readFile(file, "utf8");
    const ids = new Map();
    const idPattern = /\bid\s*=\s*(["'])(.*?)\1/gi;
    for (const match of source.matchAll(idPattern)) {
        const id = match[2];
        if (ids.has(id)) report(file, lineNumber(source, match.index), `ID dupliqué : #${id}`);
        ids.set(id, match.index);
    }

    const tagPattern = /<(a|area|img|link|script|source)\b[^>]*>/gis;
    for (const tagMatch of source.matchAll(tagPattern)) {
        const tag = tagMatch[0];
        const tagName = tagMatch[1].toLowerCase();
        const attributeName = tagName === "script" || tagName === "img" || tagName === "source" ? "src" : "href";
        const attributePattern = new RegExp(`\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`, "i");
        const attribute = tag.match(attributePattern);
        if (!attribute) continue;
        const url = localReference(attribute[2]);
        if (!url) continue;

        const path = decodeURIComponent(url.path);
        const target = path
            ? resolve(file, "..", path.startsWith("/") ? `.${path}` : path)
            : file;
        if (!(await exists(target))) {
            report(file, lineNumber(source, tagMatch.index), `ressource locale absente : ${attribute[2]}`);
            continue;
        }
        if (tagName !== "a" && tagName !== "area" || !url.hash) continue;
        const targetSource = target === file ? source : await readFile(target, "utf8");
        const anchor = decodeURIComponent(url.hash);
        if (!new RegExp(`\\bid\\s*=\\s*(["'])${anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1`, "i").test(targetSource)) {
            report(file, lineNumber(source, tagMatch.index), `ancre locale absente : ${attribute[2]}`);
        }
    }
}

for (const file of await htmlFiles(root)) await validatePage(file);

if (errors.length) {
    console.error(`Validation du contenu échouée (${errors.length} problème${errors.length > 1 ? "s" : ""}) :`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
} else {
    console.log(`Validation du contenu réussie (${(await htmlFiles(root)).length} pages HTML).`);
}

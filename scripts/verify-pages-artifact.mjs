import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { resolve as posixResolve } from "node:path/posix";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenPaths = [
    ".github",
    ".gitignore",
    ".gitattributes",
    ".node-version",
    "package.json",
    "package-lock.json",
    "playwright.config.mjs",
    "scripts",
    "tests",
    "reports",
    "schemas",
    "data/assets-report.json",
    "data/monster-translations-summary.json",
    "data/content-id-aliases.json",
    "data/content-relations.source.json",
    "data/glossary-aliases.source.json",
    "data/search-aliases.source.json",
];

async function filesIn(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
        const absolutePath = resolve(directory, entry.name);
        if (entry.isDirectory()) files.push(...await filesIn(absolutePath, relativePath));
        else if (entry.isFile()) files.push({ absolutePath, relativePath });
    }
    return files;
}

function ignoredReference(value) {
    return !value || /^(?:#|data:|https?:|mailto:|javascript:)/i.test(value) || value.includes("${");
}

function targetForReference(page, reference, artifactDirectory) {
    const cleanReference = reference.split(/[?#]/, 1)[0];
    if (!cleanReference) return null;
    const pageDirectory = page.includes("/") ? page.slice(0, page.lastIndexOf("/") + 1) : "";
    const normalized = posixResolve("/", pageDirectory, cleanReference).replace(/^\/+/, "");
    const target = resolve(artifactDirectory, ...normalized.split("/"));
    if (target !== artifactDirectory && !target.startsWith(`${artifactDirectory}${sep}`)) throw new Error(`${page} référence un chemin hors artefact : ${reference}`);
    return target;
}

function referencesFromJavaScript(source) {
    const references = [];
    const pattern = /(["'`])((?:\.\.\/|\.\/)?(?:assets|data|img|css|js)\/[^"'`]+?)\1/g;
    for (const match of source.matchAll(pattern)) references.push(match[2]);
    return references;
}

function targetReferences(page, references, artifactDirectory, brokenReferences, alternatePages = []) {
    for (const reference of references) {
        if (ignoredReference(reference)) continue;
        const dynamicMarker = reference.indexOf("${");
        const staticPrefix = dynamicMarker >= 0 ? reference.slice(0, dynamicMarker) : reference;
        const targets = [page, ...alternatePages].map((basePage) => targetForReference(basePage, staticPrefix, artifactDirectory));
        if (targets.every((target) => target && !existsSync(target))) brokenReferences.push(`${page} -> ${reference}`);
    }
}

async function verifyPagesArtifact(artifactDirectory = resolve(root, "_site"), projectRoot = root) {
    const artifactFiles = await filesIn(artifactDirectory);
    const artifactPaths = new Set(artifactFiles.map(({ relativePath }) => relativePath.replaceAll("\\", "/")));
    const forbidden = artifactFiles.filter(({ relativePath }) => forbiddenPaths.some((prefix) => relativePath === prefix || relativePath.startsWith(`${prefix}/`))).map(({ relativePath }) => relativePath);
    if (forbidden.length) throw new Error(`Fichiers internes publiés : ${forbidden.join(", ")}`);

    const inventory = JSON.parse(await readFile(resolve(projectRoot, "data/content-inventory.json"), "utf8"));
    const missingPages = (inventory.pages || []).filter((page) => !artifactPaths.has(page));
    if (missingPages.length) throw new Error(`Pages attendues absentes : ${missingPages.join(", ")}`);

    for (const required of ["index.html", "offline.html", "manifest.webmanifest", "service-worker.js", "sw.js", "data/search-index.json", "data/source-metadata.json"]) {
        if (!artifactPaths.has(required)) throw new Error(`Fichier runtime absent : ${required}`);
    }

    const manifest = JSON.parse(await readFile(resolve(artifactDirectory, "manifest.webmanifest"), "utf8"));
    if (manifest.scope !== "./" || manifest.start_url !== "./index.html" || manifest.display !== "standalone") {
        throw new Error("Manifest PWA incohérent avec le site publié");
    }
    const manifestReferences = [manifest.start_url, ...(manifest.icons || []).map(({ src }) => src)];
    const manifestErrors = manifestReferences.filter((reference) => {
        const target = targetForReference("manifest.webmanifest", reference, artifactDirectory);
        return target && !existsSync(target);
    });
    if (manifestErrors.length) throw new Error(`Ressources manifest absentes : ${manifestErrors.join(", ")}`);

    const brokenReferences = [];
    for (const file of artifactFiles.filter(({ relativePath }) => relativePath.endsWith(".html"))) {
        const source = await readFile(file.absolutePath, "utf8");
        const references = [
            ...[...source.matchAll(/(?:href|src|poster)=(['"])(.*?)\1/gi)].map((match) => match[2]),
            ...[...source.matchAll(/\bsrcset=(['"])(.*?)\1/gi)].flatMap((match) => match[2].split(",").map((value) => value.trim().split(/\s+/, 1)[0])),
        ];
        for (const reference of references) {
            if (ignoredReference(reference)) continue;
            const target = targetForReference(file.relativePath, reference, artifactDirectory);
            if (target && !existsSync(target)) brokenReferences.push(`${file.relativePath} -> ${reference}`);
        }
    }

    for (const file of artifactFiles.filter(({ relativePath }) => relativePath.endsWith(".css"))) {
        const source = await readFile(file.absolutePath, "utf8");
        for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
            const reference = match[1].trim();
            if (ignoredReference(reference)) continue;
            const target = targetForReference(file.relativePath, reference, artifactDirectory);
            if (target && !existsSync(target)) brokenReferences.push(`${file.relativePath} -> ${reference}`);
        }
    }
    for (const file of artifactFiles.filter(({ relativePath }) => relativePath.endsWith(".js"))) {
        const source = await readFile(file.absolutePath, "utf8");
        targetReferences(file.relativePath, referencesFromJavaScript(source), artifactDirectory, brokenReferences, [""]);
    }
    const serviceWorker = await readFile(resolve(artifactDirectory, "service-worker.js"), "utf8");
    const coreReferences = [...serviceWorker.matchAll(/(["'])(\.\/[^"']+)\1/g)].map((match) => match[2]);
    if (!coreReferences.includes("./index.html")) throw new Error("Précache PWA introuvable dans service-worker.js");
    targetReferences("service-worker.js", coreReferences, artifactDirectory, brokenReferences);
    if (brokenReferences.length) throw new Error(`Références locales brisées : ${brokenReferences.join(", ")}`);

    const bytes = (await Promise.all(artifactFiles.map(async ({ absolutePath }) => (await stat(absolutePath)).size))).reduce((total, size) => total + size, 0);
    return { files: artifactFiles.length, bytes, html: artifactFiles.filter(({ relativePath }) => relativePath.endsWith(".html")).length, missingPages, brokenReferences };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
    const result = await verifyPagesArtifact(resolve(root, process.argv[2] || "_site"));
    console.log(`Artefact Pages vérifié : ${result.html} pages HTML, ${result.files} fichiers, ${result.bytes} octets.`);
}

export { verifyPagesArtifact };

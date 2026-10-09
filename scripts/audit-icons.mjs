import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const iconCssPath = resolve(root, "css/icons.css");
const iconDirectory = resolve(root, "img");
const fallbackIcon = "perspective-dice-six-faces-one";
const dataFiles = [
    "js/data_action.js",
    "js/data_bonusaction.js",
    "js/data_condition.js",
    "js/data_environment.js",
    "js/data_movement.js",
    "js/data_reaction.js",
];

async function htmlFiles(directory = root, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "_site") continue;
        const absolutePath = resolve(directory, entry.name);
        const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
        if (entry.isDirectory()) files.push(...await htmlFiles(absolutePath, relativePath));
        else if (entry.isFile() && entry.name.endsWith(".html")) files.push({ absolutePath, relativePath });
    }
    return files;
}

function iconNamesFromCss(source) {
    return [...source.matchAll(/^\.icon-([a-z0-9-]+)\s*\{\s*background-image:\s*url\(\.\.\/img\/([a-z0-9-]+)\.png\);\s*\}/gm)]
        .map((match) => ({ name: match[1], file: `${match[2]}.png` }));
}

async function buildIconReport() {
    const cssSource = await readFile(iconCssPath, "utf8");
    const cssEntries = iconNamesFromCss(cssSource);
    const cssNames = new Set(cssEntries.map(({ name }) => name));
    const pngFiles = (await readdir(iconDirectory)).filter((name) => name.endsWith(".png"));
    const pngNames = new Set(pngFiles.map((name) => name.slice(0, -4)));
    const runtimeNames = new Set([fallbackIcon]);

    for (const relativePath of dataFiles) {
        const source = await readFile(resolve(root, relativePath), "utf8");
        for (const match of source.matchAll(/icon:\s*["']([^"']+)["']/g)) runtimeNames.add(match[1]);
    }

    const pages = await Promise.all((await htmlFiles()).map(async ({ absolutePath, relativePath }) => ({
        path: relativePath,
        source: await readFile(absolutePath, "utf8"),
    })));
    const stylesheetPages = pages.filter(({ source }) => source.includes("css/icons.css")).map(({ path }) => path).sort();
    const runtimePages = pages.filter(({ source }) => source.includes("js/quickref.js")).map(({ path }) => path).sort();
    const serviceWorker = await readFile(resolve(root, "service-worker.js"), "utf8");
    const pngStats = await Promise.all(pngFiles.map(async (name) => ({ name, size: (await stat(resolve(iconDirectory, name))).size })));
    const runtimePngFiles = [...runtimeNames].map((name) => `${name}.png`);

    return {
        cssRules: cssEntries.length,
        cssBytes: Buffer.byteLength(cssSource),
        rootPng: pngFiles.length,
        rootPngBytes: pngStats.reduce((total, { size }) => total + size, 0),
        pngStats,
        runtimeIcons: [...runtimeNames].sort(),
        runtimeIconCount: runtimeNames.size,
        missingCss: [...runtimeNames].filter((name) => !cssNames.has(name)).sort(),
        missingPng: [...runtimeNames].filter((name) => !pngNames.has(name)).sort(),
        unusedCss: [...cssNames].filter((name) => !runtimeNames.has(name)).sort(),
        unusedPng: [...pngNames].filter((name) => !runtimeNames.has(name)).sort(),
        stylesheetPages,
        runtimePages,
        serviceWorkerPrecacheIncludesIcons: serviceWorker.includes('"./css/icons.css"'),
        cssSource,
        cssEntries,
        runtimePngFiles,
    };
}

function printReport(report) {
    const unusedBytes = report.unusedPng.reduce((total, name) => {
        const entry = report.pngStats?.find(({ name: fileName }) => fileName === `${name}.png`);
        return total + (entry?.size || 0);
    }, 0);
    console.log(`Icônes CSS : ${report.cssRules} règles, ${report.cssBytes} octets`);
    console.log(`PNG racine : ${report.rootPng} fichiers, ${report.rootPngBytes} octets`);
    console.log(`Icônes runtime : ${report.runtimeIconCount}`);
    console.log(`Inutilisées : ${report.unusedCss.length} règles CSS, ${report.unusedPng.length} PNG`);
    console.log(`Pages chargeant icons.css : ${report.stylesheetPages.join(", ") || "aucune"}`);
    console.log(`Pages produisant des icônes : ${report.runtimePages.join(", ") || "aucune"}`);
    if (unusedBytes) console.log(`Poids PNG récupérable : ${unusedBytes} octets`);
}

function checkReport(report) {
    const problems = [];
    if (report.missingCss.length) problems.push(`règles CSS manquantes : ${report.missingCss.join(", ")}`);
    if (report.missingPng.length) problems.push(`PNG manquants : ${report.missingPng.join(", ")}`);
    if (report.unusedCss.length) problems.push(`${report.unusedCss.length} règles CSS inutilisées`);
    if (report.unusedPng.length) problems.push(`${report.unusedPng.length} PNG inutilisés`);
    if (JSON.stringify(report.stylesheetPages) !== JSON.stringify(report.runtimePages)) {
        problems.push("les pages chargeant icons.css ne correspondent pas aux pages runtime");
    }
    if (report.serviceWorkerPrecacheIncludesIcons) problems.push("icons.css ne doit pas être dans CORE_ASSETS");
    if (problems.length) throw new Error(problems.join("; "));
}

async function prune(report) {
    if (report.missingCss.length || report.missingPng.length) throw new Error("Refus de supprimer les icônes : référence runtime incomplète.");
    const retainedEntries = report.cssEntries.filter(({ name }) => report.runtimeIcons.includes(name));
    await writeFile(iconCssPath, `${retainedEntries.map(({ name, file }) => `.icon-${name} { background-image: url(../img/${file});}`).join("\n")}\n`, "utf8");
    await Promise.all(report.unusedPng.map((name) => unlink(resolve(iconDirectory, `${name}.png`))));
    console.log(`Supprimé : ${report.unusedCss.length} règles CSS et ${report.unusedPng.length} PNG.`);
}

const report = await buildIconReport();
if (process.argv.includes("--prune")) await prune(report);
const finalReport = process.argv.includes("--prune") ? await buildIconReport() : report;
printReport(finalReport);
if (process.argv.includes("--check")) checkReport(finalReport);

export { buildIconReport };

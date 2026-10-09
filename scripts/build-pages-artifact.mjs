import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, stat, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const excludedPatterns = [
    /^\.github(?:\/|$)/,
    /^\.gitignore$/,
    /^\.gitattributes$/,
    /^\.node-version$/,
    /^package(?:-lock)?\.json$/,
    /^playwright\.config\.mjs$/,
    /^scripts(?:\/|$)/,
    /^tests(?:\/|$)/,
    /^reports(?:\/|$)/,
    /^schemas(?:\/|$)/,
];

function isPublishedPath(relativePath) {
    return !excludedPatterns.some((pattern) => pattern.test(relativePath));
}

async function trackedFiles(projectRoot = root) {
    const { stdout } = await execFileAsync("git", ["ls-files", "-z"], { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024 });
    return stdout.split("\0").filter(Boolean);
}

async function copyTrackedFile(projectRoot, targetDirectory, relativePath) {
    const sourcePath = resolve(projectRoot, relativePath);
    const targetPath = resolve(targetDirectory, relativePath);
    await mkdir(dirname(targetPath), { recursive: true });
    const sourceStat = await stat(sourcePath);
    if (sourceStat.isSymbolicLink()) {
        await symlink(await readFile(sourcePath, "utf8"), targetPath);
    } else {
        await cp(sourcePath, targetPath);
    }
    return sourceStat.size;
}

async function buildPagesArtifact(targetDirectory = resolve(root, "_site"), projectRoot = root) {
    await rm(targetDirectory, { recursive: true, force: true });
    await mkdir(targetDirectory, { recursive: true });
    const allFiles = await trackedFiles(projectRoot);
    const missing = allFiles.filter((relativePath) => !existsSync(resolve(projectRoot, relativePath)));
    const files = allFiles.filter((relativePath) => isPublishedPath(relativePath) && !missing.includes(relativePath));
    let bytes = 0;
    for (const relativePath of files) bytes += await copyTrackedFile(projectRoot, targetDirectory, relativePath);
    return { directory: targetDirectory, files: files.length, bytes, excluded: allFiles.filter((path) => !isPublishedPath(path)), missing };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
    const targetDirectory = resolve(root, process.argv[2] || "_site");
    const result = await buildPagesArtifact(targetDirectory);
    console.log(`Artefact Pages généré : ${result.files} fichiers, ${result.bytes} octets (${result.excluded.length} fichiers internes exclus).`);
}

export { buildPagesArtifact, isPublishedPath };

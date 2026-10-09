import { cp, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const monsterDirectory = resolve(root, "img/enemies");
const qualityArgument = process.argv.find((argument) => argument.startsWith("--quality="));
const quality = Number(qualityArgument?.slice("--quality=".length) || 80);
const dryRun = process.argv.includes("--dry-run");

if (!Number.isInteger(quality) || quality < 1 || quality > 100) throw new Error("--quality doit être un entier entre 1 et 100.");

async function webpFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const absolutePath = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await webpFiles(absolutePath));
        else if (entry.isFile() && entry.name.toLowerCase().endsWith(".webp")) files.push(absolutePath);
    }
    return files.sort();
}

function encode(inputPath, outputPath) {
    return new Promise((resolveProcess, rejectProcess) => {
        const process = spawn("ffmpeg", [
            "-hide_banner", "-loglevel", "error", "-y", "-i", inputPath,
            "-c:v", "libwebp", "-lossless", "0", "-quality", String(quality),
            "-compression_level", "6", "-preset", "picture", outputPath,
        ], { windowsHide: true });
        let errorOutput = "";
        process.stderr.setEncoding("utf8");
        process.stderr.on("data", (chunk) => { errorOutput += chunk; });
        process.on("error", rejectProcess);
        process.on("close", (code) => code === 0
            ? resolveProcess()
            : rejectProcess(new Error(errorOutput.trim() || `ffmpeg exited with code ${code}`)));
    });
}

const files = await webpFiles(monsterDirectory);
const temporaryDirectory = await mkdtemp(join(tmpdir(), "dnd-monster-images-"));
let originalBytes = 0;
let optimizedBytes = 0;
let optimizedCount = 0;
try {
    for (const [index, inputPath] of files.entries()) {
        const sourceSize = await stat(inputPath);
        const outputPath = join(temporaryDirectory, `${index}.webp`);
        await encode(inputPath, outputPath);
        const outputSize = await stat(outputPath);
        originalBytes += sourceSize.size;
        if (!dryRun && outputSize.size < sourceSize.size) await cp(outputPath, inputPath, { force: true });
        if (outputSize.size < sourceSize.size) {
            optimizedCount += 1;
            optimizedBytes += outputSize.size;
        } else {
            optimizedBytes += sourceSize.size;
        }
    }
} finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Monstres WebP : ${files.length} fichiers, qualité cible ${quality}${dryRun ? " (simulation)" : ""}`);
console.log(`Optimisables : ${optimizedCount} fichiers`);
console.log(`Poids : ${originalBytes} -> ${optimizedBytes} octets (${originalBytes - optimizedBytes} octets économisés)`);

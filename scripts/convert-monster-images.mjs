import { access, mkdtemp, readdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const imageRoot = resolve(root, "img/enemies");
const qualityArgument = process.argv.find((argument) => argument.startsWith("--quality="));
const quality = Number(qualityArgument?.slice("--quality=".length) || 82);
const dryRun = process.argv.includes("--dry-run");
const keepPng = process.argv.includes("--keep-png");

if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
  throw new Error("--quality doit être un entier entre 1 et 100.");
}

const sourceAliases = new Map([
  ["Celestial/Empyrean Ioata.png", "Celestial/Empyrean Iota.webp"],
]);

function relativePath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

async function pngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await pngFiles(absolutePath));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) files.push(absolutePath);
  }
  return files.sort();
}

function probe(inputPath) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height,pix_fmt",
      "-of", "json",
      inputPath,
    ], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectProcess);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectProcess(new Error(stderr.trim() || `ffprobe exited with code ${code}`));
        return;
      }
      try {
        const stream = JSON.parse(stdout).streams?.[0];
        if (!stream) throw new Error("Aucun flux vidéo détecté");
        resolveProcess(stream);
      } catch (error) {
        rejectProcess(error);
      }
    });
  });
}

function encode(inputPath, outputPath) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-y", "-i", inputPath,
      "-map", "0:v:0", "-frames:v", "1",
      "-c:v", "libwebp", "-lossless", "0",
      "-quality", String(quality),
      "-compression_level", "6", "-preset", "picture",
      "-pix_fmt", "yuva420p",
      outputPath,
    ], { windowsHide: true });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectProcess);
    child.on("close", (code) => code === 0
      ? resolveProcess()
      : rejectProcess(new Error(stderr.trim() || `ffmpeg exited with code ${code}`)));
  });
}

async function outputPathFor(inputPath) {
  const relativeInput = relative(imageRoot, inputPath).replaceAll("\\", "/");
  const aliased = sourceAliases.get(relativeInput);
  return resolve(imageRoot, aliased || relativeInput.replace(/\.png$/i, ".webp"));
}

const files = await pngFiles(imageRoot);
const temporaryDirectory = await mkdtemp(join(tmpdir(), "dnd-monster-images-"));
let converted = 0;
let skipped = 0;
let failed = 0;
let sourceBytes = 0;
let outputBytes = 0;
try {
  for (const inputPath of files) {
    const outputPath = await outputPathFor(inputPath);
    const source = await stat(inputPath);
    sourceBytes += source.size;
    try {
      await access(outputPath);
      skipped += 1;
      outputBytes += (await stat(outputPath)).size;
      console.warn(`Conflit conservé sans écrasement : ${relativePath(outputPath)} (source ${relativePath(inputPath)})`);
      continue;
    } catch {
      // Le WebP cible n'existe pas encore.
    }

    const temporaryOutput = join(temporaryDirectory, `${converted}.webp`);
    try {
      const inputInfo = await probe(inputPath);
      await encode(inputPath, temporaryOutput);
      const outputInfo = await probe(temporaryOutput);
      if (inputInfo.width !== outputInfo.width || inputInfo.height !== outputInfo.height) {
        throw new Error(`Résolution modifiée (${inputInfo.width}x${inputInfo.height} -> ${outputInfo.width}x${outputInfo.height})`);
      }
      const result = await stat(temporaryOutput);
      outputBytes += result.size;
      if (!dryRun) {
        const outputData = await readFile(temporaryOutput);
        await writeFile(outputPath, outputData, { flag: "wx" });
        if (!keepPng) await unlink(inputPath);
      }
      converted += 1;
      console.log(`${dryRun ? "Simulation" : "Converti"} : ${relativePath(inputPath)} -> ${relativePath(outputPath)} (${source.size} -> ${result.size} octets)`);
    } catch (error) {
      failed += 1;
      console.error(`Échec : ${relativePath(inputPath)} — ${error.message}`);
    }
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(`PNG traités : ${files.length}`);
console.log(`Conversions ${dryRun ? "simulées" : "effectuées"} : ${converted}`);
console.log(`Conflits ignorés : ${skipped}`);
console.log(`Échecs : ${failed}`);
console.log(`Poids PNG : ${sourceBytes} octets`);
console.log(`Poids WebP produits ou conservés : ${outputBytes} octets`);
if (failed) process.exitCode = 1;

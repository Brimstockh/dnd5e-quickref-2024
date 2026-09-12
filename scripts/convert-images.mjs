import { readdir, rename, stat, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const imageRoot = join(root, "img");
const quality = 85;
const argumentsList = process.argv.slice(2);
const includeJpeg = argumentsList.includes("--include-jpeg");
const skippedFiles = new Set(
  argumentsList
    .filter((argument) => argument.startsWith("--skip-file="))
    .map((argument) => argument.slice("--skip-file=".length).replaceAll("\\", "/")),
);
const requestedDirectories = argumentsList.filter((argument) => !argument.startsWith("--"));
const directories = requestedDirectories.length ? requestedDirectories : ["vip"];

const illustrationFamilies = new Map([
  ["history", {
    sourceExtensions: new Set([".png", ".jpg", ".jpeg", ".webp"]),
    normalizeExistingWebp: true,
    filters: [
      "scale=w='min(iw,1600)':h='min(ih,900)':force_original_aspect_ratio=decrease",
      "crop=w='if(gt(iw/ih,16/9),trunc(ih/18)*32,trunc(iw/32)*32)':h='if(gt(iw/ih,16/9),trunc(ih/18)*18,trunc(iw/32)*18)':x='(iw-ow)/2':y='(ih-oh)/2'",
      "setsar=1",
    ],
  }],
  ["emblems", {
    sourceExtensions: new Set([".png", ".jpg", ".jpeg", ".webp"]),
    normalizeExistingWebp: false,
    filters: [
      "scale=w='min(iw,1024)':h='min(ih,1024)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      "setsar=1",
    ],
  }],
  ["divines", {
    sourceExtensions: new Set([".png", ".jpg", ".jpeg", ".webp"]),
    normalizeExistingWebp: false,
    filters: [
      "scale=w='min(iw,1024)':h='min(ih,1024)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      "setsar=1",
    ],
  }],
]);

function getFamilyConfig(directory) {
  const configuredFamily = illustrationFamilies.get(directory);
  if (configuredFamily) return configuredFamily;

  const sourceExtensions = new Set([".png"]);
  if (includeJpeg) {
    sourceExtensions.add(".jpg");
    sourceExtensions.add(".jpeg");
  }

  return {
    sourceExtensions,
    normalizeExistingWebp: false,
    filters: [],
  };
}

function runFfmpeg(inputPath, outputPath, filters) {
  return new Promise((resolveProcess, rejectProcess) => {
    const ffmpegArguments = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
    ];
    if (filters.length) ffmpegArguments.push("-vf", filters.join(","));
    ffmpegArguments.push(
      "-frames:v",
      "1",
      "-c:v",
      "libwebp",
      "-lossless",
      "0",
      "-quality",
      String(quality),
      "-compression_level",
      "6",
      "-preset",
      "picture",
      outputPath,
    );

    const process = spawn("ffmpeg", [
      ...ffmpegArguments,
    ], { windowsHide: true });

    let errorOutput = "";
    process.stderr.setEncoding("utf8");
    process.stderr.on("data", (chunk) => { errorOutput += chunk; });
    process.on("error", rejectProcess);
    process.on("close", (code) => {
      if (code === 0) {
        resolveProcess();
        return;
      }
      rejectProcess(new Error(errorOutput.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

const converted = [];
const skipped = [];
let pngCount = 0;

for (const directory of directories) {
  const directoryPath = resolve(imageRoot, directory);
  if (directoryPath !== imageRoot && !directoryPath.startsWith(`${imageRoot}${sep}`)) {
    throw new Error(`Image directory must stay under img/: ${directory}`);
  }

  const familyConfig = getFamilyConfig(directory);
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const sourceFiles = entries
    .filter((entry) => {
      if (!entry.isFile() || !familyConfig.sourceExtensions.has(extname(entry.name).toLowerCase())) return false;
      const relativePath = relative(imageRoot, join(directoryPath, entry.name)).replaceAll("\\", "/");
      return !skippedFiles.has(relativePath);
    })
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  pngCount += sourceFiles.length;

  for (const sourceFile of sourceFiles) {
    const inputPath = join(directoryPath, sourceFile);
    const sourceExtension = extname(sourceFile).toLowerCase();
    const webpFile = `${sourceFile.slice(0, -extname(sourceFile).length)}.webp`;
    const outputPath = join(directoryPath, webpFile);
    const sourceStats = await stat(inputPath);
    const label = relative(imageRoot, inputPath).replaceAll("\\", "/");
    const outputLabel = relative(imageRoot, outputPath).replaceAll("\\", "/");

    if (sourceExtension === ".webp" && !familyConfig.normalizeExistingWebp) {
      skipped.push(`${label} -> ${outputLabel} (WebP déjà normalisé)`);
      continue;
    }

    let outputStats;
    if (sourceExtension !== ".webp") {
      try {
        outputStats = await stat(outputPath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }

    if (outputStats && outputStats.mtimeMs >= sourceStats.mtimeMs) {
      skipped.push(`${label} -> ${outputLabel}`);
      continue;
    }

    const temporaryOutputPath = sourceExtension === ".webp"
      ? join(directoryPath, `.${webpFile}.tmp.webp`)
      : outputPath;
    await runFfmpeg(inputPath, temporaryOutputPath, familyConfig.filters);
    if (temporaryOutputPath !== outputPath) {
      await unlink(inputPath);
      await rename(temporaryOutputPath, outputPath);
    }
    converted.push(`${label} -> ${outputLabel}`);
  }
}

console.log(`Images: ${pngCount} source files found across ${directories.join(", ")}, quality ${quality}`);
console.log("Converted:");
console.log(converted.length ? converted.map((entry) => `- ${entry}`).join("\n") : "- none");
console.log("Skipped:");
console.log(skipped.length ? skipped.map((entry) => `- ${entry}`).join("\n") : "- none");

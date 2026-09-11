import { readdir, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const imageRoot = join(root, "img");
const quality = 85;
const requestedDirectories = process.argv.slice(2);
const directories = requestedDirectories.length ? requestedDirectories : ["vip"];

function runFfmpeg(inputPath, outputPath) {
  return new Promise((resolveProcess, rejectProcess) => {
    const process = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
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

  const entries = await readdir(directoryPath, { withFileTypes: true });
  const pngFiles = entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".png")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  pngCount += pngFiles.length;

  for (const pngFile of pngFiles) {
    const inputPath = join(directoryPath, pngFile);
    const webpFile = `${pngFile.slice(0, -extname(pngFile).length)}.webp`;
    const outputPath = join(directoryPath, webpFile);
    const sourceStats = await stat(inputPath);
    const label = relative(imageRoot, inputPath).replaceAll("\\", "/");
    const outputLabel = relative(imageRoot, outputPath).replaceAll("\\", "/");

    let outputStats;
    try {
      outputStats = await stat(outputPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    if (outputStats && outputStats.mtimeMs >= sourceStats.mtimeMs) {
      skipped.push(`${label} -> ${outputLabel}`);
      continue;
    }

    await runFfmpeg(inputPath, outputPath);
    converted.push(`${label} -> ${outputLabel}`);
  }
}

console.log(`Images: ${pngCount} PNG found across ${directories.join(", ")}, quality ${quality}`);
console.log("Converted:");
console.log(converted.length ? converted.map((entry) => `- ${entry}`).join("\n") : "- none");
console.log("Skipped:");
console.log(skipped.length ? skipped.map((entry) => `- ${entry}`).join("\n") : "- none");

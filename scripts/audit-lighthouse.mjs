import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse, { desktopConfig } from "lighthouse";
import { launch as launchChrome } from "chrome-launcher";
import { chromium } from "@playwright/test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.LIGHTHOUSE_PORT || 4174);
const baseUrl = `http://127.0.0.1:${port}`;
const outputPath = resolve(root, "reports/lighthouse/baseline.json");
const pages = [
    "index.html",
    "regles.html",
    "spells.html",
    "combat-2024.html",
    "faerun.html",
    "html/characters.html",
];

function score(category) {
    return category?.score == null ? null : Math.round(category.score * 100);
}

function metric(audits, id) {
    const value = audits[id]?.numericValue;
    return Number.isFinite(value) ? Math.round(value) : null;
}

async function waitForServer(url) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {
            // The server may still be starting.
        }
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    }
    throw new Error(`Static server did not become ready at ${url}`);
}

function commit() {
    try {
        return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    } catch {
        return null;
    }
}

const server = spawn(process.execPath, ["scripts/serve-static.mjs"], {
    cwd: root,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: "ignore",
});
let chrome;
let completed = false;

try {
    await waitForServer(`${baseUrl}/index.html`);
    chrome = await launchChrome({
        chromePath: chromium.executablePath(),
        chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });

    const results = [];
    for (const page of pages) {
        const result = await lighthouse(`${baseUrl}/${page}`, {
            port: chrome.port,
            output: "json",
            logLevel: "error",
            formFactor: "desktop",
            screenEmulation: {
                mobile: false,
                width: 1440,
                height: 900,
                deviceScaleFactor: 1,
                disabled: false,
            },
        }, desktopConfig);
        if (!result?.lhr) throw new Error(`Lighthouse returned no report for ${page}`);
        const { audits, categories } = result.lhr;
        results.push({
            page,
            performance: score(categories.performance),
            accessibility: score(categories.accessibility),
            bestPractices: score(categories["best-practices"]),
            seo: score(categories.seo),
            metrics: {
                fcpMs: metric(audits, "first-contentful-paint"),
                lcpMs: metric(audits, "largest-contentful-paint"),
                cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
                speedIndexMs: metric(audits, "speed-index"),
                tbtMs: metric(audits, "total-blocking-time"),
                totalByteWeightBytes: metric(audits, "total-byte-weight"),
            },
        });
        console.log(`Lighthouse ${page}: ${results.at(-1).performance}/100 performance`);
    }

    await mkdir(resolve(root, "reports/lighthouse"), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify({
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        commit: commit(),
        tool: { name: "lighthouse", version: "12.8.2" },
        environment: {
            preset: "desktop",
            viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
            baseUrl,
        },
        pages: results,
    }, null, 2)}\n`, "utf8");
    console.log(`Lighthouse baseline written to ${outputPath}`);
    completed = true;
} finally {
    if (chrome) {
        try {
            await Promise.race([
                chrome.kill(),
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
        } catch (error) {
            if (error?.code !== "EPERM") throw error;
        }
    }
    if (!server.killed) server.kill();
    if (completed) process.exit(0);
}

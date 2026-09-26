import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const contentTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".svg", "image/svg+xml"],
    [".webmanifest", "application/manifest+json; charset=utf-8"],
    [".webp", "image/webp"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".woff2", "font/woff2"],
]);

function safePath(urlPath) {
    const pathname = decodeURIComponent(new URL(urlPath, "http://localhost").pathname);
    const requested = resolve(root, `.${pathname}`);
    if (requested !== root && !requested.startsWith(`${root}${sep}`)) return null;
    return requested;
}

async function resolveFile(urlPath) {
    const requested = safePath(urlPath);
    if (!requested) return null;
    const candidates = [requested];
    if (requested.endsWith(sep)) candidates.push(resolve(requested, "index.html"));
    for (const candidate of candidates) {
        try {
            if ((await stat(candidate)).isFile()) return candidate;
        } catch {
            // Continue to the next candidate.
        }
    }
    return null;
}

const server = createServer(async (request, response) => {
    try {
        const file = await resolveFile(request.url || "/");
        if (!file) {
            response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
            response.end("Not found");
            return;
        }
        response.writeHead(200, {
            "cache-control": "no-store",
            "content-type": contentTypes.get(extname(file).toLowerCase()) || "application/octet-stream",
        });
        if (request.method === "HEAD") {
            response.end();
            return;
        }
        createReadStream(file).pipe(response);
    } catch {
        response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
        response.end("Bad request");
    }
});

server.listen(port, host, () => {
    console.log(`Static server listening on http://${host}:${port}`);
});

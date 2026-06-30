// Node.js entry point for Render deployment
// Render runs: node --experimental-strip-types server-node.ts
// This file imports the compiled server output after `bun run build`
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const port = Number(process.env.PORT) || 3000;

// MIME types for common file extensions
const mimeTypes: Record<string, string> = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

function serveStaticFile(filePath: string): { status: number; headers: Record<string, string>; body: Buffer } {
  try {
    const normalizedPath = resolve(filePath);
    // Security: ensure the path is within dist/client
    if (!normalizedPath.startsWith(resolve(__dirname, "dist/client"))) {
      return { status: 403, headers: { "Content-Type": "text/plain" }, body: Buffer.from("Forbidden") };
    }
    if (!existsSync(normalizedPath)) {
      return { status: 404, headers: { "Content-Type": "text/plain" }, body: Buffer.from("Not Found") };
    }
    const content = readFileSync(normalizedPath);
    return {
      status: 200,
      headers: {
        "Content-Type": getMimeType(normalizedPath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: content,
    };
  } catch (error) {
    console.error("Error serving static file:", error);
    return { status: 500, headers: { "Content-Type": "text/plain" }, body: Buffer.from("Internal Server Error") };
  }
}

async function startServer() {
  // Import the compiled server handler from the build output
  const mod = await import("./dist/server/server.js");
  const handler = mod.default ?? mod;

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const pathname = url.pathname;
      
      // Serve static assets from dist/client (extension-based only).
      // IMPORTANT: do NOT intercept /_server or other /_* paths here —
      // those are TanStack Start server-function endpoints handled by the SSR handler.
      if (/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|json|ico|txt|xml|map)$/.test(pathname)) {
        const filePath = resolve(__dirname, "dist/client", pathname.replace(/^\//, ""));
        const staticResponse = serveStaticFile(filePath);
        res.writeHead(staticResponse.status, staticResponse.headers);
        res.end(staticResponse.body);
        return;
      }
      
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") headers.set(key, value);
        else if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        }
      }
      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : req,
      });
      const response = await handler.fetch(request, process.env, {});
      const resHeaders: Record<string, string> = {};
      response.headers.forEach((value: string, key: string) => {
        resHeaders[key] = value;
      });
      res.writeHead(response.status, resHeaders);
      const body = await response.arrayBuffer();
      res.end(Buffer.from(body));
    } catch (error) {
      console.error("Request handling error:", error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  });

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

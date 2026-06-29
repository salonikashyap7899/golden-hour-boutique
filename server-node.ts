// Node.js entry point for Render deployment
// Render runs: node --experimental-strip-types server-node.ts
// This file imports the compiled server output after `bun run build`
import { createServer } from "node:http";

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  // Import the compiled server handler from the build output
  const mod = await import("./dist/server/server.js");
  const handler = mod.default ?? mod;

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
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

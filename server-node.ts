// Node.js entry point for Render deployment
// This file is used by Render's start command with --experimental-strip-types
import { createServer } from "node:http";
import handler from "./src/server";

const port = Number(process.env.PORT) || 3000;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
  });
  const response = await handler.fetch(request, process.env, {});
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

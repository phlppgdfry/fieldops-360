import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve("dist-pages"),
  prefix = "/fieldops-360",
  port = Number(process.env.PAGES_PORT || 3604);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".css": "text/css",
  ".png": "image/png",
  ".webm": "video/webm",
  ".vtt": "text/vtt",
  ".gz": "application/gzip",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === prefix) {
        res.writeHead(302, { Location: prefix + "/" });
        return res.end();
      }
      if (!url.pathname.startsWith(prefix + "/")) {
        res.writeHead(404);
        return res.end();
      }
      let relative = decodeURIComponent(url.pathname.slice(prefix.length + 1));
      if (!relative || relative.endsWith("/")) relative += "index.html";
      const file = resolve(root, relative);
      if (!file.startsWith(root + "/")) throw Error("path");
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Pages preview http://127.0.0.1:${port}${prefix}/`),
  );

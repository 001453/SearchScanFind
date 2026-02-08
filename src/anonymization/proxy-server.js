#!/usr/bin/env node
/**
 * Search Scan Find - Anonymization Proxy Server
 *
 * HTTP/HTTPS isteklerini alır, header'ları temizler,
 * User-Agent rotasyonu uygular ve upstream proxy (Tor) üzerinden iletir.
 *
 * Kullanım: SOCKS_PROXY=socks5://127.0.0.1:9050 node src/anonymization/proxy-server.js
 * veya: npm run anon-proxy
 *
 * Shannon/Docker için: HTTP_PROXY=http://host.docker.internal:3128
 */

import http from "http";
import httpProxy from "http-proxy";
import { SocksProxyAgent } from "socks-proxy-agent";
import { getRandomUserAgent } from "./user-agents.js";

const PORT = parseInt(process.env.ANON_PROXY_PORT || "3128", 10);
const UPSTREAM = process.env.SOCKS_PROXY || process.env.HTTP_PROXY || "socks5://127.0.0.1:9050";

const STRIP_HEADERS = [
  "x-forwarded-for", "x-real-ip", "x-client-ip", "via", "forwarded",
  "cf-connecting-ip", "true-client-ip", "x-originating-ip",
];

let agent = null;
if (UPSTREAM.startsWith("socks")) {
  agent = new SocksProxyAgent(UPSTREAM);
}

const proxy = httpProxy.createProxyServer({ agent });

proxy.on("proxyReq", (proxyReq, req) => {
  STRIP_HEADERS.forEach((h) => proxyReq.removeHeader(h));
  proxyReq.setHeader("User-Agent", getRandomUserAgent());
});

proxy.on("error", (err, req, res) => {
  console.error("[Proxy Error]", err.message);
  if (res && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Proxy error: " + err.message);
  }
});

const server = http.createServer((req, res) => {
  const target = req.url;
  if (!target || target.startsWith("/")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Absolute URL required. Use as HTTP proxy.");
    return;
  }
  try {
    const url = new URL(target);
    proxy.web(req, res, {
      target: url.origin,
      changeOrigin: true,
      agent,
    });
  } catch (e) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Invalid URL");
  }
});

server.on("upgrade", (req, socket, head) => {
  const target = req.url;
  if (target && !target.startsWith("/")) {
    try {
      const url = new URL(target);
      proxy.ws(req, socket, head, {
        target: url.origin,
        agent,
      });
    } catch {
      socket.destroy();
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n[Search Scan Find] Anonymization Proxy`);
  console.log(`  Listening: http://0.0.0.0:${PORT}`);
  console.log(`  Upstream:  ${UPSTREAM}`);
  console.log(`\n  Use: set HTTP_PROXY=http://127.0.0.1:${PORT}`);
  console.log(`       set HTTPS_PROXY=http://127.0.0.1:${PORT}\n`);
});

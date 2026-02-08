#!/usr/bin/env node
/**
 * Search Scan Find - Ana CLI
 *
 * Kullanım:
 *   node src/cli/ssf.js start --url https://app.com --repo C:\path
 *   node src/cli/ssf.js start --config config/my-config.yaml --anonymous
 */

import "dotenv/config";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { loadConfig, getProxyEnv } from "../config/loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SHANNON_DIR = path.join(ROOT, "shannon");

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";
  const opts = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2).replace(/-/g, "_");
      opts[key] = args[i + 1]?.startsWith("--") ? true : args[++i] ?? true;
    }
  }
  // Konumsal: start <url> <repo> (npm ile -- flag'ler bazen gelmeyebiliyor)
  if (cmd === "start" && args[1] && args[2] && !opts.url && !opts.repo) {
    if (args[1].startsWith("http")) opts.url = args[1];
    if (args[2]) opts.repo = args[2];
  }
  return { cmd, opts };
}

function ensureShannon() {
  if (!fs.existsSync(path.join(SHANNON_DIR, "shannon"))) {
    console.error("\n[Search Scan Find] Shannon henüz kurulmamış.");
    console.error("Önce şunu çalıştırın: npm run setup");
    console.error("veya: node scripts/setup.js\n");
    process.exit(1);
  }
  // Shannon Docker Compose .env dosyasını shannon/ dizininde arar - root .env'i kopyala
  const rootEnv = path.join(ROOT, ".env");
  const shannonEnv = path.join(SHANNON_DIR, ".env");
  if (fs.existsSync(rootEnv)) {
    fs.copyFileSync(rootEnv, shannonEnv);
  }
}

function getGitBashPath() {
  const candidates = [
    path.join(process.env.ProgramFiles || "C:\\Program Files", "Git", "bin", "bash.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Git", "bin", "bash.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Git", "bin", "bash.exe"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return "bash"; // fallback
}

function runShannon(env, args) {
  const shannonScript = path.join(SHANNON_DIR, "shannon");
  const isWin = process.platform === "win32";

  // Docker içinden host proxy'ye erişim (Windows/Mac)
  if (env.HTTP_PROXY && env.HTTP_PROXY.includes("127.0.0.1")) {
    env.HTTP_PROXY = env.HTTP_PROXY.replace("127.0.0.1", "host.docker.internal");
    env.HTTPS_PROXY = env.HTTPS_PROXY?.replace("127.0.0.1", "host.docker.internal");
    env.http_proxy = env.http_proxy?.replace("127.0.0.1", "host.docker.internal");
    env.https_proxy = env.https_proxy?.replace("127.0.0.1", "host.docker.internal");
  }

  const runEnv = { ...process.env, ...env };
  const bashPath = isWin ? getGitBashPath() : "bash";
  const bashArgs = [shannonScript, ...args];

  return spawn(bashPath, bashArgs, {
    stdio: "inherit",
    env: runEnv,
    cwd: SHANNON_DIR,
    shell: false,
  });
}

async function main() {
  const { cmd, opts } = parseArgs();

  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    console.log(`
Search Scan Find - Kimlik Gizlemeli AI Pentest Platformu

Kullanım:
  npx ssf start --url <URL> --repo <PATH> [--anonymous] [--config <FILE>]
  npx ssf proxy                    # Anonymization proxy'yi başlat
  npx ssf config-validate          # Config doğrula

Örnek:
  npx ssf start --url https://staging.app.com --repo C:\\Projects\\myapp --anonymous
  npx ssf start --config config/my-config.yaml

Anonim mod:
  --anonymous  Tor/proxy üzerinden trafik yönlendirir.
               Önce "npx ssf proxy" ile proxy'yi başlatın (Tor 9050'de çalışıyor olmalı).
`);
    return;
  }

  if (cmd === "proxy") {
    console.log("\n[Search Scan Find] Anonymization proxy başlatılıyor...");
    console.log("Tor'un 127.0.0.1:9050'de çalıştığından emin olun.\n");
    const { spawn } = await import("child_process");
    const proxyPath = path.join(ROOT, "src/anonymization/proxy-server.js");
    const child = spawn("node", [proxyPath], {
      stdio: "inherit",
      env: { ...process.env, SOCKS_PROXY: process.env.SOCKS_PROXY || "socks5://127.0.0.1:9050" },
    });
    child.on("exit", (code) => process.exit(code || 0));
    return;
  }

  if (cmd === "config-validate" || cmd === "config_validate") {
    process.env.SSF_CONFIG = opts.config || "config/my-config.yaml";
    await import("../config/validator.js");
    return;
  }

  if (cmd === "start") {
    ensureShannon();
    const configPath = opts.config || opts.config_path;
    const config = configPath ? loadConfig(configPath) : null;

    const url = opts.url || config?.target?.url;
    const repo = opts.repo || opts.repo_path || config?.target?.repo_path;

    if (!url || !repo) {
      console.error("\n[Search Scan Find] --url ve --repo gereklidir.");
      console.error("Örnek: npx ssf start --url https://app.com --repo C:\\path\\to\\repo\n");
      process.exit(1);
    }

    const shannonArgs = ["start", `URL=${url}`, `REPO=${repo}`];
    if (configPath) shannonArgs.push(`CONFIG=${path.resolve(ROOT, configPath)}`);

    let env = {};
    if (opts.anonymous || config?.anonymization?.enabled) {
      const proxyEnv = getProxyEnv(config);
      const proxyUrl = process.env.HTTP_PROXY || proxyEnv.HTTP_PROXY || "http://127.0.0.1:3128";
      env = {
        HTTP_PROXY: proxyUrl,
        HTTPS_PROXY: proxyUrl,
        http_proxy: proxyUrl,
        https_proxy: proxyUrl,
      };
      console.log("\n[Search Scan Find] Anonim mod: Trafik proxy üzerinden yönlendirilecek.");
      console.log("Proxy:", proxyUrl);
      console.log("Proxy çalışmıyorsa önce: npx ssf proxy\n");
    }

    console.log("\n[Search Scan Find] Shannon başlatılıyor...\n");
    const child = runShannon(env, shannonArgs);
    child.on("exit", (code) => process.exit(code ?? 0));
    return;
  }

  console.error(`Bilinmeyen komut: ${cmd}. 'npx ssf help' yazın.`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

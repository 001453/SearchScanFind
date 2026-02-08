#!/usr/bin/env node
/**
 * Search Scan Find - Kurulum Script'i
 * Shannon'ı klonlar ve gerekli yapılandırmayı yapar.
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SHANNON_DIR = path.join(ROOT, "shannon");
const SHANNON_REPO = "https://github.com/KeygraphHQ/shannon.git";

function exec(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: "inherit",
      cwd: opts.cwd || ROOT,
      shell: opts.shell || false,
      ...opts,
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
  });
}

async function main() {
  console.log("\n=== Search Scan Find - Kurulum ===\n");

  if (fs.existsSync(SHANNON_DIR)) {
    console.log("Shannon zaten mevcut. Güncelleniyor...");
    try {
      await exec("git", ["pull"], { cwd: SHANNON_DIR });
    } catch (e) {
      console.warn("Git pull atlandı:", e.message);
    }
  } else {
    console.log("Shannon klonlanıyor...");
    await exec("git", ["clone", "--depth", "1", SHANNON_REPO, SHANNON_DIR]);
  }

  if (!fs.existsSync(path.join(ROOT, "config", "my-config.yaml"))) {
    if (fs.existsSync(path.join(ROOT, "config", "example.config.yaml"))) {
      fs.copyFileSync(
        path.join(ROOT, "config", "example.config.yaml"),
        path.join(ROOT, "config", "my-config.yaml")
      );
      console.log("\nconfig/my-config.yaml oluşturuldu. Lütfen düzenleyin.");
    }
  }

  if (!fs.existsSync(path.join(ROOT, ".env")) && fs.existsSync(path.join(SHANNON_DIR, ".env.example"))) {
    fs.copyFileSync(path.join(SHANNON_DIR, ".env.example"), path.join(ROOT, ".env"));
    console.log("\n.env oluşturuldu. ANTHROPIC_API_KEY ekleyin.");
  }

  console.log("\n✓ Kurulum tamamlandı.");
  console.log("\nSonraki adımlar:");
  console.log("  1. config/my-config.yaml dosyasını düzenleyin");
  console.log("  2. .env dosyasına ANTHROPIC_API_KEY ekleyin");
  console.log("  3. (Opsiyonel) Tor kurun - anonim mod için");
  console.log("  4. npx ssf start --url <URL> --repo <PATH> --anonymous\n");
}

main().catch((e) => {
  console.error("Kurulum hatası:", e.message);
  process.exit(1);
});

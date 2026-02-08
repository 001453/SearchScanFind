#!/usr/bin/env node
/**
 * Search Scan Find - Config Validator
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const configPath = process.env.SSF_CONFIG || "config/my-config.yaml";

function validate() {
  const fullPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Config bulunamadı: ${fullPath}`);
    console.log("Örnek: copy config\\example.config.yaml config\\my-config.yaml");
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(fullPath, "utf8");
    const config = yaml.load(content);
    console.log("✓ Config geçerli:", fullPath);
    if (config.anonymization?.enabled) {
      console.log("  Anonymization: AKTIF");
      console.log("  Mod:", config.anonymization.mode || "proxy");
    }
    return config;
  } catch (e) {
    console.error("Config hatası:", e.message);
    process.exit(1);
  }
}

validate();

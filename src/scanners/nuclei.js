/**
 * Search Scan Find - Nuclei URL Scanner
 * Sadece URL ile black-box tarama yapar (repo gerekmez).
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const URL_SCANS_DIR = path.join(ROOT, "scans", "url-scans");

export function runNucleiScan(url) {
  if (!url || !url.startsWith("http")) {
    throw new Error("Geçerli bir URL girin (https://...)");
  }

  if (!fs.existsSync(URL_SCANS_DIR)) {
    fs.mkdirSync(URL_SCANS_DIR, { recursive: true });
  }

  const hostname = new URL(url).hostname.replace(/\./g, "_");
  const sessionId = `url_${hostname}_${Date.now()}`;
  const sessionDir = path.join(URL_SCANS_DIR, sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const outputFile = path.join(sessionDir, "results.json");
  const metaFile = path.join(sessionDir, "meta.json");

  const meta = {
    id: sessionId,
    url,
    hostname,
    target: hostname,
    startTime: Date.now(),
    type: "url-only",
  };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

  const args = [
    "run",
    "--rm",
    "projectdiscovery/nuclei",
    "-u", url,
    "-json",
    "-silent",
    "-nc",
  ];

  const child = spawn("docker", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  child.stdout.on("data", (d) => { stdout += d.toString(); });
  child.stderr.on("data", () => {});

  child.on("close", () => {
    meta.endTime = Date.now();
    const results = [];
    for (const line of stdout.trim().split("\n")) {
      if (!line.trim()) continue;
      try {
        results.push(JSON.parse(line));
      } catch (_) {}
    }
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  });

  return { id: sessionId, url };
}

export function getUrlScanSessions() {
  if (!fs.existsSync(URL_SCANS_DIR)) return [];
  const sessions = [];
  for (const name of fs.readdirSync(URL_SCANS_DIR)) {
    const dir = path.join(URL_SCANS_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const metaPath = path.join(dir, "meta.json");
    const resultsPath = path.join(dir, "results.json");
    let meta = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      } catch (_) {}
    }
    sessions.push({
      ...meta,
      id: name,
      hasReport: fs.existsSync(resultsPath),
      reportPath: fs.existsSync(resultsPath) ? resultsPath : null,
    });
  }
  sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  return sessions;
}

export function getUrlScanReport(sessionId) {
  const sessions = getUrlScanSessions();
  const s = sessions.find((x) => x.id === sessionId);
  if (!s || !s.reportPath) return null;

  const results = JSON.parse(fs.readFileSync(s.reportPath, "utf8"));

  // Markdown rapor oluştur
  let content = `# URL Tarama Raporu\n\n`;
  content += `- **Hedef:** ${s.url}\n`;
  content += `- **Tarih:** ${new Date(s.startTime).toISOString()}\n`;
  content += `- **Bulgu Sayısı:** ${results.length}\n\n`;
  content += `## Zafiyetler\n\n`;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const sev = r.info?.severity || "info";
    content += `### ${i + 1}. ${r.info?.name || r.templateID}\n\n`;
    content += `- **Şablon:** ${r.templateID}\n`;
    content += `- **Önem:** ${sev}\n`;
    content += `- **Konum:** ${r.matchedAt || r["matched-at"] || s.url}\n`;
    if (r.info?.description) content += `- **Açıklama:** ${r.info.description}\n`;
    content += `\n`;
  }

  const vulnerabilities = results.map((r) => ({
    id: r.templateID,
    title: r.info?.name || r.templateID,
    summary: r.info?.description || "",
    severity: (r.info?.severity || "info").charAt(0).toUpperCase() + (r.info?.severity || "info").slice(1),
    location: r.matchedAt || r["matched-at"] || s.url,
  }));

  return { content, vulnerabilities };
}

/**
 * Search Scan Find - Backend API
 * Taramaları yönetir, raporları okur, yeni tarama başlatır.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIT_LOGS = path.join(ROOT, "shannon", "audit-logs");

const app = express();
app.use(cors());
app.use(express.json());

// Frontend static (build sonrası)
const FRONTEND_DIST = path.join(ROOT, "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
}

// Scan session listesini tara
function getScanSessions() {
  if (!fs.existsSync(AUDIT_LOGS)) return [];
  const entries = fs.readdirSync(AUDIT_LOGS, { withFileTypes: true });
  const sessions = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const sessionPath = path.join(AUDIT_LOGS, e.name);
    const sessionJson = path.join(sessionPath, "session.json");
    const reportPath = path.join(sessionPath, "deliverables", "comprehensive_security_assessment_report.md");
    let meta = {};
    if (fs.existsSync(sessionJson)) {
      try {
        meta = JSON.parse(fs.readFileSync(sessionJson, "utf8"));
      } catch {}
    }
    sessions.push({
      id: e.name,
      path: sessionPath,
      hasReport: fs.existsSync(reportPath),
      reportPath: fs.existsSync(reportPath) ? reportPath : null,
      ...meta,
    });
  }
  sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  return sessions;
}

// Rapor içinden zafiyetleri parse et
function parseVulnerabilities(mdContent) {
  const vulns = [];
  const lines = mdContent.split("\n");
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const vulnMatch = line.match(/^### (INJ-VULN|ATH-VULN|XSS-VULN|SSRF-VULN|AUTHZ-VULN)-\d+/);
    if (vulnMatch) {
      if (current) vulns.push(current);
      current = { id: vulnMatch[1], title: line.replace(/^###\s*/, ""), summary: "", severity: "High", steps: [] };
      continue;
    }
    if (current) {
      if (line.startsWith("**Summary:**")) {
        current.summary = lines[++i]?.replace(/^-\s*\*\*/, "").trim() || "";
      } else if (line.match(/^\*\*Severity:\*\*/)) {
        current.severity = line.split(":").pop()?.trim() || "High";
      } else if (line.startsWith("**Vulnerable location:**")) {
        current.location = line.split(":").pop()?.trim() || "";
      } else if (line.startsWith("```")) {
        const code = [];
        while (lines[++i] && !lines[i].startsWith("```")) code.push(lines[i]);
        if (code.length) current.steps.push(code.join("\n"));
      }
    }
  }
  if (current) vulns.push(current);
  return vulns;
}

// --- API ROUTES ---

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.get("/api/scans", (_, res) => {
  try {
    const sessions = getScanSessions();
    res.json(sessions.map(({ id, hasReport, startTime, endTime, ...m }) => ({
      id,
      hasReport,
      startTime: m.startTime || startTime,
      endTime: m.endTime || endTime,
      target: m.target || m.hostname || id.split("_")[0],
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/scans/:id", (req, res) => {
  try {
    const sessions = getScanSessions();
    const s = sessions.find((x) => x.id === req.params.id);
    if (!s) return res.status(404).json({ error: "Scan not found" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/scans/:id/report", (req, res) => {
  try {
    const sessions = getScanSessions();
    const s = sessions.find((x) => x.id === req.params.id);
    if (!s || !s.reportPath) return res.status(404).json({ error: "Report not found" });
    const content = fs.readFileSync(s.reportPath, "utf8");
    res.json({ content, vulnerabilities: parseVulnerabilities(content) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/vulnerabilities", (req, res) => {
  try {
    const sessions = getScanSessions();
    const all = [];
    for (const s of sessions) {
      if (!s.reportPath) continue;
      const content = fs.readFileSync(s.reportPath, "utf8");
      const vulns = parseVulnerabilities(content).map((v) => ({ ...v, scanId: s.id, target: s.target || s.id }));
      all.push(...vulns);
    }
    all.sort((a, b) => (b.severity === "Critical" ? 1 : 0) - (a.severity === "Critical" ? 1 : 0));
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/scans", async (req, res) => {
  const { url, repo, anonymous } = req.body || {};
  if (!url || !repo) {
    return res.status(400).json({ error: "url and repo required" });
  }

  const shannonDir = path.join(ROOT, "shannon");
  const shannonScript = path.join(shannonDir, "shannon");
  const isWin = process.platform === "win32";
  const args = ["start", `URL=${url}`, `REPO=${repo}`];
  const env = { ...process.env };
  if (anonymous) {
    env.HTTP_PROXY = env.HTTP_PROXY || "http://host.docker.internal:3128";
    env.HTTPS_PROXY = env.HTTP_PROXY;
  }

  try {
    const child = spawn(isWin ? "bash" : "bash", [shannonScript, ...args], {
      cwd: shannonDir,
      env,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => { stdout += d.toString(); });
    child.stderr?.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (code) => {
      // Async olarak bitti, client zaten 202 almış olacak
    });

    res.status(202).json({
      message: "Scan started",
      url,
      repo,
      pid: child.pid,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  if (fs.existsSync(path.join(FRONTEND_DIST, "index.html"))) {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  } else {
    res.status(404).send("Frontend build gerekli: npm run frontend:build");
  }
});

const PORT = process.env.DASHBOARD_PORT || 3500;
app.listen(PORT, () => {
  console.log(`\n[Search Scan Find] Dashboard: http://localhost:${PORT}\n`);
});

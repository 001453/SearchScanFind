const API = "/api";

async function fetchAPI(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- State ---
let currentView = "dashboard";

function render() {
  const app = document.getElementById("app")!;
  if (currentView === "dashboard") app.innerHTML = dashboardHTML();
  else if (currentView === "scans") app.innerHTML = scansHTML();
  else if (currentView === "vulnerabilities") app.innerHTML = vulnsHTML();
  else if (currentView === "new-scan") app.innerHTML = newScanHTML();
  else if (currentView.startsWith("report:")) {
    const id = currentView.split(":")[1];
    app.innerHTML = reportHTML(id);
  }
  bindEvents();
}

function nav(view: string) {
  currentView = view;
  render();
}

// --- Dashboard ---
function dashboardHTML() {
  return `
    <div class="min-h-screen p-8">
      <header class="flex items-center justify-between mb-12">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-[#22c55e]">Search Scan Find</h1>
          <p class="text-zinc-500 mt-1">Kimlik Gizlemeli AI Pentest Platformu</p>
        </div>
        <nav class="flex gap-4">
          <button data-nav="dashboard" class="px-4 py-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e] font-medium">Dashboard</button>
          <button data-nav="scans" class="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-300">Taramalar</button>
          <button data-nav="vulnerabilities" class="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-300">Zafiyetler</button>
          <button data-nav="new-scan" class="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-semibold hover:bg-[#16a34a]">+ Yeni Tarama</button>
        </nav>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-[#18181c] border border-zinc-800 rounded-xl p-6">
          <h3 class="text-zinc-500 text-sm uppercase tracking-wider">Toplam Tarama</h3>
          <p id="stat-scans" class="text-4xl font-bold mt-2 text-white">-</p>
        </div>
        <div class="bg-[#18181c] border border-zinc-800 rounded-xl p-6">
          <h3 class="text-zinc-500 text-sm uppercase tracking-wider">Toplam Zafiyet</h3>
          <p id="stat-vulns" class="text-4xl font-bold mt-2 text-[#ef4444]">-</p>
        </div>
        <div class="bg-[#18181c] border border-zinc-800 rounded-xl p-6">
          <h3 class="text-zinc-500 text-sm uppercase tracking-wider">Kritik Zafiyet</h3>
          <p id="stat-critical" class="text-4xl font-bold mt-2 text-[#ef4444]">-</p>
        </div>
      </div>

      <div class="bg-[#18181c] border border-zinc-800 rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">Son Taramalar</h2>
        <div id="recent-scans" class="space-y-3 text-zinc-400">Yükleniyor...</div>
      </div>
    </div>
  `;
}

async function loadDashboard() {
  try {
    const [scans, vulns] = await Promise.all([fetchAPI("/scans"), fetchAPI("/vulnerabilities")]);
    const elScans = document.getElementById("stat-scans");
    const elVulns = document.getElementById("stat-vulns");
    const elCrit = document.getElementById("stat-critical");
    const elRecent = document.getElementById("recent-scans");
    if (elScans) elScans.textContent = String(scans.length);
    if (elVulns) elVulns.textContent = String(vulns.length);
    if (elCrit) elCrit.textContent = String(vulns.filter((v: any) => v.severity === "Critical").length);
    if (elRecent) {
      elRecent.innerHTML = scans.slice(0, 5).map((s: any) => `
        <div class="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
          <span class="font-mono">${s.target || s.id}</span>
          <div class="flex gap-2">
            ${s.hasReport ? '<span class="text-[#22c55e] text-sm">Rapor var</span>' : '<span class="text-zinc-600 text-sm">Bekliyor</span>'}
            <button data-report="${s.id}" class="text-[#22c55e] hover:underline text-sm">Görüntüle</button>
          </div>
        </div>
      `).join("") || "<p class=\"text-zinc-600\">Henüz tarama yok</p>";
    }
  } catch (e) {
    const el = document.getElementById("recent-scans");
    if (el) el.innerHTML = `<p class="text-red-500">API hatası: ${(e as Error).message}</p>`;
  }
}

// --- Scans list ---
function scansHTML() {
  return `
    <div class="min-h-screen p-8">
      <header class="flex items-center justify-between mb-12">
        <h1 class="text-3xl font-bold text-[#22c55e]">Taramalar</h1>
        <nav class="flex gap-4">
          <button data-nav="dashboard" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Dashboard</button>
          <button data-nav="scans" class="px-4 py-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e]">Taramalar</button>
          <button data-nav="vulnerabilities" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Zafiyetler</button>
          <button data-nav="new-scan" class="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-semibold">+ Yeni Tarama</button>
        </nav>
      </header>
      <div id="scans-list" class="space-y-4">Yükleniyor...</div>
    </div>
  `;
}

async function loadScans() {
  const el = document.getElementById("scans-list");
  if (!el) return;
  try {
    const scans = await fetchAPI("/scans");
    el.innerHTML = scans.map((s: any) => `
      <div class="scan-card bg-[#18181c] border border-zinc-800 rounded-xl p-6 flex items-center justify-between cursor-pointer transition-colors" data-report="${s.id}">
        <div>
          <h3 class="font-mono text-lg">${s.target || s.id}</h3>
          <p class="text-zinc-500 text-sm mt-1">${s.id}</p>
        </div>
        <div class="flex items-center gap-4">
          ${s.hasReport ? '<span class="px-3 py-1 rounded-full text-xs bg-[#22c55e]/20 text-[#22c55e]">Rapor hazır</span>' : '<span class="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-500">Devam ediyor</span>'}
          <button class="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Raporu Aç</button>
        </div>
      </div>
    `).join("") || "<p class=\"text-zinc-600\">Henüz tarama yok</p>";
  } catch (e) {
    el.innerHTML = `<p class="text-red-500">Hata: ${(e as Error).message}</p>`;
  }
}

// --- Vulnerabilities ---
function vulnsHTML() {
  return `
    <div class="min-h-screen p-8">
      <header class="flex items-center justify-between mb-12">
        <h1 class="text-3xl font-bold text-[#22c55e]">Zafiyetler</h1>
        <nav class="flex gap-4">
          <button data-nav="dashboard" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Dashboard</button>
          <button data-nav="scans" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Taramalar</button>
          <button data-nav="vulnerabilities" class="px-4 py-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e]">Zafiyetler</button>
          <button data-nav="new-scan" class="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-semibold">+ Yeni Tarama</button>
        </nav>
      </header>
      <div id="vulns-list" class="space-y-4">Yükleniyor...</div>
    </div>
  `;
}

async function loadVulns() {
  const el = document.getElementById("vulns-list");
  if (!el) return;
  try {
    const vulns = await fetchAPI("/vulnerabilities");
    el.innerHTML = vulns.map((v: any) => `
      <div class="bg-[#18181c] border border-zinc-800 rounded-xl p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-mono text-sm text-zinc-500">${v.id}</span>
              <span class="severity-${(v.severity || "high").toLowerCase()} px-2 py-0.5 rounded text-xs font-semibold">${v.severity || "High"}</span>
              <span class="text-zinc-600 text-sm">${v.target || ""}</span>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">${v.title || v.summary || "Zafiyet"}</h3>
            ${v.location ? `<p class="text-zinc-500 text-sm font-mono mb-2">📍 ${v.location}</p>` : ""}
            <p class="text-zinc-400 text-sm">${(v.summary || "").slice(0, 200)}...</p>
          </div>
          <button data-report="${v.scanId}" class="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm shrink-0">Rapor</button>
        </div>
      </div>
    `).join("") || "<p class=\"text-zinc-600\">Henüz zafiyet bulunamadı</p>";
  } catch (e) {
    el.innerHTML = `<p class="text-red-500">Hata: ${(e as Error).message}</p>`;
  }
}

// --- New Scan ---
function newScanHTML() {
  return `
    <div class="min-h-screen p-8">
      <header class="flex items-center justify-between mb-12">
        <h1 class="text-3xl font-bold text-[#22c55e]">Yeni Tarama</h1>
        <nav class="flex gap-4">
          <button data-nav="dashboard" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Dashboard</button>
          <button data-nav="scans" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Taramalar</button>
          <button data-nav="vulnerabilities" class="px-4 py-2 rounded-lg hover:bg-zinc-800">Zafiyetler</button>
          <button data-nav="new-scan" class="px-4 py-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e]">+ Yeni Tarama</button>
        </nav>
      </header>

      <div class="max-w-2xl">
        <form id="new-scan-form" class="bg-[#18181c] border border-zinc-800 rounded-xl p-8 space-y-6">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Hedef URL</label>
            <input type="url" name="url" required placeholder="https://hedef-uygulama.com" class="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22c55e]">
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Kaynak Kod Dizini (Repo Path)</label>
            <input type="text" name="repo" required placeholder="C:\Projects\myapp veya /path/to/repo" class="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#22c55e]">
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" name="anonymous" id="anon" class="rounded bg-zinc-800 border-zinc-600 text-[#22c55e] focus:ring-[#22c55e]">
            <label for="anon" class="text-sm text-zinc-400">Anonim mod (Tor/Proxy üzerinden)</label>
          </div>
          <button type="submit" class="w-full py-3 rounded-lg bg-[#22c55e] text-black font-semibold hover:bg-[#16a34a] transition-colors">Tarama Başlat</button>
        </form>
        <p id="scan-result" class="mt-4 text-sm text-zinc-500 hidden"></p>
      </div>
    </div>
  `;
}

function bindNewScanForm() {
  const form = document.getElementById("new-scan-form");
  const result = document.getElementById("scan-result");
  if (!form || !result) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form as HTMLFormElement);
    const url = fd.get("url") as string;
    const repo = fd.get("repo") as string;
    const anonymous = !!fd.get("anonymous");
    result.classList.remove("hidden");
    result.className = "mt-4 text-sm text-amber-500";
    result.textContent = "Tarama başlatılıyor...";
    try {
      await fetchAPI("/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, repo, anonymous }),
      });
      result.className = "mt-4 text-sm text-[#22c55e]";
      result.textContent = "Tarama başlatıldı! Shannon arka planda çalışıyor. Taramalar sayfasından takip edebilirsiniz.";
      (form as HTMLFormElement).reset();
    } catch (err) {
      result.className = "mt-4 text-sm text-red-500";
      result.textContent = "Hata: " + (err as Error).message;
    }
  };
}

// --- Report viewer ---
function reportHTML(scanId: string) {
  return `
    <div class="min-h-screen p-8">
      <header class="flex items-center justify-between mb-6">
        <button data-nav="scans" class="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400">← Taramalara Dön</button>
        <h1 class="text-xl font-bold text-[#22c55e]">Rapor: ${scanId}</h1>
      </header>
      <div class="bg-[#18181c] border border-zinc-800 rounded-xl p-6 overflow-auto">
        <div id="report-content" class="prose prose-invert max-w-none text-zinc-300 font-mono text-sm">Yükleniyor...</div>
        <div id="report-vulns" class="mt-8"></div>
      </div>
    </div>
  `;
}

async function loadReport(scanId: string) {
  const el = document.getElementById("report-content");
  const vulnEl = document.getElementById("report-vulns");
  if (!el) return;
  try {
    const { content, vulnerabilities } = await fetchAPI(`/scans/${scanId}/report`);
    const lines = content.split("\n");
    let inCode = false;
    let html = "";
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.startsWith("```")) {
        if (inCode) html += "</code></pre>";
        else html += '<pre class="bg-zinc-900 p-4 rounded-lg overflow-x-auto my-2 text-xs"><code>';
        inCode = !inCode;
      } else if (inCode) {
        html += escapeHtml(l) + "\n";
      } else if (l.startsWith("### ")) {
        html += `<h3 class="text-lg font-semibold mt-4 mb-1 text-[#22c55e]">${escapeHtml(l.slice(4))}</h3>`;
      } else if (l.startsWith("## ")) {
        html += `<h2 class="text-xl font-bold mt-6 mb-2 text-white">${escapeHtml(l.slice(3))}</h2>`;
      } else if (l.startsWith("# ")) {
        html += `<h1 class="text-2xl font-bold mt-4 mb-2 text-white">${escapeHtml(l.slice(2))}</h1>`;
      } else if (l.trim()) {
        html += `<p class="my-1">${escapeHtml(l)}</p>`;
      }
    }
    if (inCode) html += "</code></pre>";
    el.innerHTML = html;
    if (vulnEl && vulnerabilities?.length) {
      vulnEl.innerHTML = `<h3 class="text-lg font-semibold mb-4 text-white">Özet: ${vulnerabilities.length} Zafiyet</h3>` +
        vulnerabilities.map((v: any) => `<div class="mb-2 p-3 bg-zinc-900 rounded"><span class="text-[#22c55e] font-mono">${v.id}</span> <span class="severity-${(v.severity||"").toLowerCase()}">${v.severity}</span> ${v.title || ""}</div>`).join("");
    }
  } catch (e) {
    el.innerHTML = `<p class="text-red-500">Hata: ${(e as Error).message}</p>`;
  }
}

function escapeHtml(s: string) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// --- Events ---
function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => nav((btn as HTMLElement).dataset.nav!));
  });
  document.querySelectorAll("[data-report]").forEach((btn) => {
    btn.addEventListener("click", () => nav("report:" + (btn as HTMLElement).dataset.report!));
  });

  if (currentView === "dashboard") loadDashboard();
  if (currentView === "scans") loadScans();
  if (currentView === "vulnerabilities") loadVulns();
  if (currentView === "new-scan") bindNewScanForm();
  if (currentView.startsWith("report:")) loadReport(currentView.split(":")[1]);
}

// --- Init ---
render();

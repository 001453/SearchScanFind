# Search Scan Find

**Tam otonom, kimlik gizlemeli AI penetrasyon test platformu.**

Shannon tabanlı, anonimlik katmanı ile güçlendirilmiş web uygulama güvenlik test sistemi.

---

## 🎯 Özellikler

- **Search** — Kaynak kodu ve hedef analizi (Reconnaissance)
- **Scan** — Zafiyet tespiti (Vulnerability Analysis)  
- **Find** — Doğrulanmış exploit kanıtları (Proof-by-Exploitation)

- **Anonymization Layer** — Proxy, Tor, VPN ve header gizleme desteği
- **Custom User-Agent** — Fingerprint karıştırma
- **Request Timing Jitter** — Pattern analizi zorlaştırma

---

## 📋 Gereksinimler

- Docker Desktop
- Git (bash için — Windows’ta)
- Node.js 18+
- Anthropic API Key (veya Claude Code OAuth)
- (Opsiyonel) Tor — anonim mod için, bkz. [docs/TOR-KURULUM.md](docs/TOR-KURULUM.md)

---

## 🚀 Hızlı Başlangıç

```powershell
# 1. Bağımlılıkları yükle
npm install

# 2. Shannon'ı klonla (ilk kez)
npm run setup
# veya: .\scripts\setup.ps1

# 3. Yapılandır
copy config\example.config.yaml config\my-config.yaml
# .env dosyasında ANTHROPIC_API_KEY ayarla

# 4. Test çalıştır
npm start -- start --url https://your-app.com --repo C:\path\to\repo

# 5. Anonim modda (Tor gerekli)
npm run anon-proxy   # Terminal 1 - proxy başlat
npm start -- start --url https://your-app.com --repo C:\path\to\repo --anonymous  # Terminal 2
```

Detaylı kullanım: [docs/KULLANIM.md](docs/KULLANIM.md)

---

## 🖥️ Web Dashboard

Taramaları görüntüleme, zafiyetleri listeleme ve yeni tarama başlatma:

```powershell
npm run frontend:build   # İlk kez
npm run dashboard       # http://localhost:3500
```

Detay: [docs/DASHBOARD.md](docs/DASHBOARD.md)

---

## 📜 Lisans

AGPL-3.0 (Shannon uyumlu)

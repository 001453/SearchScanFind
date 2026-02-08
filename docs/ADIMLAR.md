# Search Scan Find - Adım Adım Kurulum

Bu belge, projeyi sıfırdan çalıştırmak için izlemeniz gereken adımları listeler.

---

## Adım 1: Ön Gereksinimler

| Araç | Kontrol | İndirme |
|------|---------|---------|
| Docker Desktop | `docker --version` | https://docker.com/products/docker-desktop |
| Git | `git --version` | https://git-scm.com |
| Node.js 18+ | `node --version` | https://nodejs.org |

---

## Adım 2: API Anahtarı

1. https://console.anthropic.com adresine gidin
2. API Key oluşturun
3. `C:\Users\nihat\SearchScanFind\.env` dosyası oluşturun:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000
```

Shannon dizinindeki `.env.example`'ı da kopyalayabilirsiniz.

---

## Adım 3: Config Düzenleme

1. `config\my-config.yaml` dosyasını açın
2. `target.url` → Test edeceğiniz uygulama (örn. https://staging.myapp.com)
3. `target.repo_path` → Uygulamanın kaynak kodu (örn. C:\Projects\myapp)

---

## Adım 4: İlk Test (Anonim Olmadan)

```powershell
cd C:\Users\nihat\SearchScanFind

npm start -- start --url https://hedef-uygulama.com --repo C:\path\to\kaynak
```

Not: `repo` yolu hedef uygulamanın tüm kaynak kodunu içeren dizin olmalı (monorepo veya birleştirilmiş repo).

---

## Adım 5: Anonim Mod (Tor ile)

### 5a. Tor Kurulumu

- [Tor Expert Bundle](https://www.torproject.org/download/tor/) indirin
- Zip'i açıp `tor.exe` çalıştırın
- SOCKS5 proxy: 127.0.0.1:9050

Detay: [TOR-KURULUM.md](TOR-KURULUM.md)

### 5b. İki Terminal Açın

**Terminal 1 — Anonymization proxy:**
```powershell
cd C:\Users\nihat\SearchScanFind
npm run anon-proxy
```

**Terminal 2 — Test:**
```powershell
cd C:\Users\nihat\SearchScanFind
npm start -- start --url https://hedef.com --repo C:\path\to\repo --anonymous
```

---

## Adım 6: Raporlar

Test tamamlandığında raporlar şurada:

```
SearchScanFind\shannon\audit-logs\{hostname}_{sessionId}\deliverables\
└── comprehensive_security_assessment_report.md
```

---

## Sorun Giderme

- **"bash: command not found"** → Git for Windows kurun (bash dahil gelir)
- **Docker hatası** → Docker Desktop çalışıyor mu?
- **API hatası** → .env içinde ANTHROPIC_API_KEY doğru mu?
- **Proxy bağlanamıyor** → Tor 9050 portunda çalışıyor mu?

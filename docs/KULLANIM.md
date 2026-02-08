# Search Scan Find - Kullanım Kılavuzu

## 1. İlk Kurulum

### Gereksinimler
- **Docker Desktop** — [İndir](https://www.docker.com/products/docker-desktop/)
- **Git** — [İndir](https://git-scm.com/)
- **Node.js 18+** — [İndir](https://nodejs.org/)
- **Anthropic API Key** — [Console](https://console.anthropic.com/)

### Adımlar

```powershell
# 1. Projeye git
cd C:\Users\nihat\SearchScanFind

# 2. Bağımlılıkları yükle
npm install

# 3. Shannon'ı klonla (ilk kez)
npm run setup
# veya: .\scripts\setup.ps1

# 4. API anahtarını ayarla
# .env dosyasını aç ve ANTHROPIC_API_KEY=sk-ant-... ekle

# 5. Config'i düzenle
copy config\example.config.yaml config\my-config.yaml
# config\my-config.yaml içinde url ve repo_path güncelle
```

---

## 2. Temel Kullanım

### Anonim Olmadan (Standart)

```powershell
npm start -- start --url https://staging.uygulama.com --repo C:\Projects\myapp
```

### Anonim Modda (Kimlik Gizli)

**Önce Tor'u başlat:**
- [Tor Expert Bundle](https://www.torproject.org/download/tor/) indir
- Veya Tor Browser açık kalsın (9050 portunda SOCKS proxy)

**Terminal 1 — Proxy'yi başlat:**
```powershell
npm run anon-proxy
# veya: node src/anonymization/proxy-server.js
# Tor 127.0.0.1:9050'de çalışıyor olmalı
```

**Terminal 2 — Testi başlat:**
```powershell
npm start -- start --url https://hedef.com --repo C:\path\to\repo --anonymous
```

### Config Dosyası ile

```powershell
npm start -- start --config config/my-config.yaml --anonymous
```

---

## 3. Anonimlik Katmanı

| Bileşen | Açıklama |
|---------|----------|
| **Proxy Server** | HTTP isteklerini alır, Tor/SOCKS üzerinden iletir |
| **User-Agent Rotasyonu** | Her istekte farklı tarayıcı UA'sı |
| **Header Temizleme** | X-Forwarded-For, X-Real-IP vb. kaldırılır |

### Tor Kurulumu (Windows)

1. [Tor Expert Bundle](https://www.torproject.org/download/tor/) indir
2. Zip'i aç, `tor.exe` çalıştır
3. Varsayılan SOCKS5: `127.0.0.1:9050`

### Alternatif: VPN

VPN kullanıyorsanız proxy'ye gerek yok. Tüm trafik VPN üzerinden gider.  
`--anonymous` kullanmadan, sadece VPN aktifken test yapın.

---

## 4. Çıktı ve Raporlar

Raporlar Shannon dizininde:
```
shannon/audit-logs/{hostname}_{sessionId}/
└── deliverables/
    └── comprehensive_security_assessment_report.md
```

---

## 5. Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|-------|-------|
| "Shannon henüz kurulmamış" | `npm run setup` çalıştır |
| "bash: command not found" | Git for Windows kur (bash dahil) |
| Docker hatası | Docker Desktop çalışıyor mu kontrol et |
| Proxy bağlanamıyor | Tor 9050'de çalışıyor mu kontrol et |
| API limit | Anthropic kullanım limitlerini kontrol et |

---

## 6. Yasal Uyarı

⚠️ **Sadece yetkili sistemlerde test yapın.**

- Yazılı pentest sözleşmesi olmalı
- Hedef sistemin sahibinden açık izin alın
- İzinsiz tarama/test yasadışıdır

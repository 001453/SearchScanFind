# Search Scan Find - Dashboard Kullanımı

## Başlatma

### Yöntem 1: Build + Dashboard (Production)

```powershell
cd C:\Users\nihat\SearchScanFind

# İlk kez frontend build
npm run frontend:build

# Dashboard'u başlat
npm run dashboard
```

Tarayıcıda açın: **http://localhost:3500**

---

### Yöntem 2: Geliştirme Modu

**Terminal 1 — Backend:**
```powershell
npm run dashboard
```

**Terminal 2 — Frontend (hot reload):**
```powershell
npm run frontend:dev
```

Frontend: **http://localhost:5173** (API proxy otomatik 3500'e yönlendirilir)

---

## Özellikler

| Sayfa | Açıklama |
|-------|----------|
| **Dashboard** | Özet istatistikler, son taramalar |
| **Taramalar** | Tüm tarama listesi, raporlara erişim |
| **Zafiyetler** | Tüm tespit edilen zafiyetler (severity, location) |
| **Yeni Tarama** | URL + Repo path ile tarama başlat |
| **Rapor** | Markdown rapor görüntüleyici |

---

## Yeni Tarama Başlatma

1. **Yeni Tarama** butonuna tıklayın
2. **Hedef URL** girin (örn. https://staging.myapp.com)
3. **Kaynak Kod Dizini** girin (örn. C:\Projects\myapp)
4. İsteğe bağlı: **Anonim mod** işaretleyin
5. **Tarama Başlat** butonuna tıklayın

Tarama arka planda Shannon ile çalışır. Tamamlanması 1-1.5 saat sürebilir. Raporlar hazır olduğunda **Taramalar** sayfasında görünür.

---

## Port Değiştirme

`.env` dosyasında:
```
DASHBOARD_PORT=4000
```

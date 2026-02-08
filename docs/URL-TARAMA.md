# Sadece URL ile Tarama (Nuclei)

Search Scan Find artık **repo olmadan** sadece URL ile tarama yapabilir. Bu mod **Nuclei** kullanır ve Docker gerektirir.

---

## Nasıl Kullanılır?

### Dashboard üzerinden

1. **Yeni Tarama** sayfasına gidin
2. **Hedef URL** girin (örn. https://example.com)
3. **"Sadece URL ile tarama (repo gerekmez - Nuclei)"** kutusunu işaretleyin
4. **Tarama Başlat** butonuna tıklayın
5. Kaynak Kod Dizini alanını boş bırakın

### API üzerinden

```bash
curl -X POST http://localhost:3500/api/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "urlOnly": true}'
```

---

## Gereksinimler

- **Docker** — Nuclei Docker image ile çalışır
- İlk çalıştırmada `projectdiscovery/nuclei` image otomatik indirilir

---

## Sonuçlar

- Tarama **arkaplanda** çalışır (birkaç dakika sürebilir)
- **Taramalar** sayfasından ilerlemeyi kontrol edin
- Rapor hazır olduğunda **Raporu Aç** ile görüntüleyin
- **Zafiyetler** sayfasında tüm bulgular listelenir

---

## Shannon vs Nuclei (URL-only)

| Özellik | Shannon (White-box) | Nuclei (URL-only) |
|---------|---------------------|-------------------|
| Kaynak kod | Zorunlu | Gerekmez |
| Tarama tipi | AI + Exploit | Template tabanlı |
| Süre | 1-1.5 saat | Birkaç dakika |
| Gereksinim | Docker, Anthropic API | Sadece Docker |

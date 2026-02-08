# Tor Kurulumu - Anonim Mod İçin

Search Scan Find'ın anonim modunda trafik Tor ağı üzerinden yönlendirilir. Bu sayede hedef sistemler sizin gerçek IP'nizi görmez.

---

## Windows - Tor Expert Bundle

1. **İndir:** https://www.torproject.org/download/tor/
   - "Expert Bundle" (tor-expert-bundle-windows-...zip) seçin

2. **Kur:**
   - Zip'i bir klasöre aç (örn. `C:\Tor`)
   - `tor.exe` dosyası hazır

3. **Çalıştır:**
   ```powershell
   cd C:\Tor
   .\tor.exe
   ```
   - Varsayılan SOCKS5 proxy: `127.0.0.1:9050`

4. **Arka planda çalıştırmak için:**
   - Bir kısayol oluşturun
   - Hedef: `C:\Tor\tor.exe`
   - Başlangıçta minimize için `tor.exe -nt` kullanabilirsiniz

---

## Alternatif: Tor Browser

1. [Tor Browser](https://www.torproject.org/download/) indir ve kur
2. Tor Browser'ı açın ve bağlantıyı bekleyin
3. Tarayıcı açık kaldığı sürece SOCKS5 proxy `127.0.0.1:9150` (Tor Browser farklı port kullanır!)
4. Search Scan Find config'inde veya ortam değişkeninde:
   ```
   SOCKS_PROXY=socks5://127.0.0.1:9150
   ```

---

## Doğrulama

Tor çalışıyor mu test edin:
```powershell
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
```
Çıktıda `"IsTor": true` görünmeli.

---

## Dikkat

- Tor ağı trafiği yavaşlatabilir; test süresi uzayabilir
- Bazı hedefler Tor exit node'larını engelleyebilir
- Sadece yasal, yetkili testlerde kullanın

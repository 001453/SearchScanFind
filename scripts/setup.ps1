# Search Scan Find - Windows Kurulum Script'i
# PowerShell'de çalıştırın: .\scripts\setup.ps1

Write-Host "`n=== Search Scan Find - Kurulum ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ShannonDir = Join-Path $Root "shannon"

if (Test-Path $ShannonDir) {
    Write-Host "`nShannon zaten mevcut. Güncelleniyor..." -ForegroundColor Yellow
    Set-Location $ShannonDir
    git pull 2>$null
    Set-Location $Root
} else {
    Write-Host "`nShannon klonlanıyor..." -ForegroundColor Yellow
    git clone --depth 1 https://github.com/KeygraphHQ/shannon.git $ShannonDir
}

$ConfigExample = Join-Path $Root "config\example.config.yaml"
$ConfigMy = Join-Path $Root "config\my-config.yaml"
if (-not (Test-Path $ConfigMy) -and (Test-Path $ConfigExample)) {
    Copy-Item $ConfigExample $ConfigMy
    Write-Host "`nconfig\my-config.yaml oluşturuldu. Lütfen düzenleyin." -ForegroundColor Green
}

$EnvExample = Join-Path $ShannonDir ".env.example"
$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path $EnvFile) -and (Test-Path $EnvExample)) {
    Copy-Item $EnvExample $EnvFile
    Write-Host ".env oluşturuldu. ANTHROPIC_API_KEY ekleyin." -ForegroundColor Green
}

Write-Host "`nKurulum tamamlandı." -ForegroundColor Green
Write-Host "`nSonraki adımlar:"
Write-Host "  1. config\my-config.yaml dosyasını düzenleyin"
Write-Host "  2. .env dosyasına ANTHROPIC_API_KEY ekleyin"
Write-Host "  3. (Opsiyonel) Tor kurun - anonim mod için"
Write-Host "  4. npx ssf start --url <URL> --repo <PATH> --anonymous`n"

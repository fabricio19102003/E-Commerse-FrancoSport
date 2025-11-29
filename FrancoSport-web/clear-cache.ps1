# Script para limpiar caché y reconstruir
# Franco Sport E-Commerce

Write-Host "🧹 Limpiando caché de Vite y Node..." -ForegroundColor Yellow

# Detener el servidor si está corriendo
Write-Host "`n1. Deteniendo procesos de Node..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Limpiar caché de Vite
Write-Host "`n2. Limpiando caché de Vite..." -ForegroundColor Cyan
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "   ✅ Caché de Vite eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay caché de Vite" -ForegroundColor Gray
}

# Limpiar dist
Write-Host "`n3. Limpiando carpeta dist..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ Carpeta dist eliminada" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay carpeta dist" -ForegroundColor Gray
}

Write-Host "`n✅ Limpieza completada!" -ForegroundColor Green
Write-Host "`n🚀 Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`nY en el navegador presiona:" -ForegroundColor Yellow
Write-Host "   Ctrl + Shift + R (para limpiar caché del navegador)" -ForegroundColor White

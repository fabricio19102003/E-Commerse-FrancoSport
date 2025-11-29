# Script de limpieza COMPLETA
# Franco Sport E-Commerce

Write-Host "🧹 LIMPIEZA COMPLETA - Franco Sport" -ForegroundColor Yellow
Write-Host "====================================`n" -ForegroundColor Yellow

# 1. Detener procesos
Write-Host "1. Deteniendo procesos de Node..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✅ Procesos detenidos`n" -ForegroundColor Green

# 2. Limpiar caché de Vite
Write-Host "2. Limpiando caché de Vite..." -ForegroundColor Cyan
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "   ✅ node_modules/.vite eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay caché de Vite" -ForegroundColor Gray
}

# 3. Limpiar dist
Write-Host "`n3. Limpiando carpeta dist..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ dist eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay carpeta dist" -ForegroundColor Gray
}

# 4. Limpiar .vite (si existe en raíz)
Write-Host "`n4. Limpiando .vite en raíz..." -ForegroundColor Cyan
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "   ✅ .vite eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay .vite en raíz" -ForegroundColor Gray
}

# 5. Limpiar TypeScript cache
Write-Host "`n5. Limpiando caché de TypeScript..." -ForegroundColor Cyan
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "   ✅ tsconfig.tsbuildinfo eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay tsconfig.tsbuildinfo" -ForegroundColor Gray
}

Write-Host "`n====================================`n" -ForegroundColor Yellow
Write-Host "✅ LIMPIEZA COMPLETADA!`n" -ForegroundColor Green

Write-Host "🚀 Siguiente paso:" -ForegroundColor Yellow
Write-Host "   npm run dev`n" -ForegroundColor White

Write-Host "📱 En el navegador:" -ForegroundColor Yellow
Write-Host "   1. Abre DevTools (F12)" -ForegroundColor White
Write-Host "   2. Click derecho en el botón Refresh" -ForegroundColor White
Write-Host "   3. Selecciona 'Empty Cache and Hard Reload'`n" -ForegroundColor White
Write-Host "   O simplemente: Ctrl + Shift + R`n" -ForegroundColor White

# Script para limpiar caché del frontend
# Franco Sport E-Commerce

Write-Host "🧹 Limpiando caché del frontend..." -ForegroundColor Yellow

# Detener procesos de Node
Write-Host "`n1. Deteniendo procesos de Node..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✅ Procesos detenidos" -ForegroundColor Green

# Limpiar caché de Vite
Write-Host "`n2. Limpiando caché de Vite..." -ForegroundColor Cyan
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "   ✅ node_modules/.vite eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay caché de Vite" -ForegroundColor Gray
}

# Limpiar dist
Write-Host "`n3. Limpiando carpeta dist..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ dist eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay carpeta dist" -ForegroundColor Gray
}

# Limpiar .vite en raíz
Write-Host "`n4. Limpiando .vite en raíz..." -ForegroundColor Cyan
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "   ✅ .vite eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay .vite en raíz" -ForegroundColor Gray
}

# Limpiar tsconfig cache
Write-Host "`n5. Limpiando caché de TypeScript..." -ForegroundColor Cyan
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "   ✅ tsconfig.tsbuildinfo eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay tsconfig.tsbuildinfo" -ForegroundColor Gray
}

Write-Host "`n====================================`n" -ForegroundColor Yellow
Write-Host "✅ LIMPIEZA COMPLETADA!`n" -ForegroundColor Green

Write-Host "🚀 Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "   npm run dev`n" -ForegroundColor White

Write-Host "📱 Y en el navegador:" -ForegroundColor Yellow
Write-Host "   Ctrl + Shift + R (Hard Reload)`n" -ForegroundColor White

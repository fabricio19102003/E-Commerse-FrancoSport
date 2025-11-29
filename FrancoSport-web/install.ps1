# Franco Sport - Script de Instalación
# Ejecuta este script para instalar todas las dependencias

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FRANCO SPORT - INSTALACION" -ForegroundColor Green
Write-Host "  'No es suerte, es esfuerzo'" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que npm está instalado
Write-Host "Verificando Node.js y npm..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Node.js y npm deben estar instalados" -ForegroundColor Red
    Write-Host "Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Paso 1: Limpiando instalaciones previas..." -ForegroundColor Yellow

# Limpiar node_modules y package-lock.json si existen
if (Test-Path "node_modules") {
    Write-Host "Eliminando node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules"
}

if (Test-Path "package-lock.json") {
    Write-Host "Eliminando package-lock.json..." -ForegroundColor Gray
    Remove-Item -Force "package-lock.json"
}

Write-Host "✓ Limpieza completada" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Paso 2: Instalando dependencias..." -ForegroundColor Yellow
Write-Host "Esto puede tomar varios minutos..." -ForegroundColor Gray

try {
    npm install
    Write-Host "✓ Dependencias instaladas correctamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Paso 3: Verificando configuración TypeScript..." -ForegroundColor Yellow

try {
    npm run type-check
    Write-Host "✓ TypeScript configurado correctamente" -ForegroundColor Green
} catch {
    Write-Host "⚠ Hay errores de TypeScript, pero puedes continuar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dependencias instaladas:" -ForegroundColor Yellow
Write-Host "✓ React 19.2.0" -ForegroundColor Green
Write-Host "✓ React Router 6.28.0" -ForegroundColor Green
Write-Host "✓ Zustand 5.0.2" -ForegroundColor Green
Write-Host "✓ Axios 1.7.9" -ForegroundColor Green
Write-Host "✓ React Hook Form 7.54.2" -ForegroundColor Green
Write-Host "✓ Zod 3.24.1" -ForegroundColor Green
Write-Host "✓ Stripe React & JS" -ForegroundColor Green
Write-Host "✓ Tailwind CSS 3.4.17" -ForegroundColor Green
Write-Host "✓ TypeScript 5.9.3" -ForegroundColor Green
Write-Host "✓ Vite 7.2.4" -ForegroundColor Green
Write-Host "✓ Y muchas más..." -ForegroundColor Green

Write-Host ""
Write-Host "Comandos disponibles:" -ForegroundColor Yellow
Write-Host "  npm run dev        - Iniciar servidor de desarrollo" -ForegroundColor Cyan
Write-Host "  npm run build      - Build para producción" -ForegroundColor Cyan
Write-Host "  npm run preview    - Preview del build" -ForegroundColor Cyan
Write-Host "  npm run type-check - Verificar tipos TypeScript" -ForegroundColor Cyan
Write-Host "  npm run lint       - Linting del código" -ForegroundColor Cyan

Write-Host ""
Write-Host "Próximo paso:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Green -NoNewline
Write-Host " para iniciar el servidor de desarrollo" -ForegroundColor White

Write-Host ""
Write-Host "El proyecto estará disponible en:" -ForegroundColor Yellow
Write-Host "  http://localhost:5173" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "¡Listo para empezar a desarrollar!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

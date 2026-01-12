# Script para construir el deployment package optimizado (reduce tamaño)

Write-Host "============================================================"
Write-Host "🔨 Building Optimized Lambda Package"
Write-Host "============================================================"

# Limpiar
if (Test-Path package) {
    Write-Host "🧹 Cleaning old package..."
    Remove-Item -Recurse -Force package
}

if (Test-Path function.zip) {
    Write-Host "🧹 Removing old function.zip..."
    Remove-Item -Force function.zip
}

# Crear directorio
New-Item -ItemType Directory -Path package | Out-Null

# Obtener ruta absoluta
$currentPath = (Get-Location).Path

Write-Host ""
Write-Host "📦 Installing dependencies in Docker container..."
Write-Host "   (This may take a few minutes...)"

# Instalar dependencias
docker run --rm `
    --entrypoint /bin/bash `
    -v "${currentPath}:/var/task" `
    -w /var/task `
    public.ecr.aws/lambda/python:3.14 `
    -c "pip install -r requirements.txt -t package/ --upgrade --no-cache-dir"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!"
    exit 1
}

# Copiar index.py
Write-Host ""
Write-Host "📄 Copying index.py..."
Copy-Item index.py package/index.py

# Limpieza agresiva
Write-Host ""
Write-Host "🧹 Cleaning up unnecessary files..."

$cleaned = 0

# Eliminar directorios innecesarios
$dirsToRemove = @(
    "**/__pycache__",
    "**/*.dist-info",
    "**/*.egg-info",
    "**/tests",
    "**/test",
    "**/testing",
    "**/docs",
    "**/doc",
    "**/*.md",
    "**/*.txt",
    "**/*.rst",
    "**/examples",
    "**/example",
    "**/benchmarks",
    "**/benchmark"
)

foreach ($pattern in $dirsToRemove) {
    $items = Get-ChildItem -Path package -Include $pattern.Split('/')[-1] -Recurse -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            Remove-Item -Recurse -Force $item.FullName -ErrorAction SilentlyContinue
            $cleaned++
        } else {
            Remove-Item -Force $item.FullName -ErrorAction SilentlyContinue
            $cleaned++
        }
    }
}

# Eliminar archivos .pyc, .pyo
Get-ChildItem -Path package -Include *.pyc,*.pyo -Recurse | Remove-Item -Force
$cleaned += (Get-ChildItem -Path package -Include *.pyc,*.pyo -Recurse -ErrorAction SilentlyContinue).Count

# Eliminar archivos de desarrollo
$devFiles = @("*.md", "*.txt", "*.rst", "*.yml", "*.yaml", "LICENSE", "CHANGELOG", "README", "setup.py", "setup.cfg", "pyproject.toml")
foreach ($pattern in $devFiles) {
    Get-ChildItem -Path package -Filter $pattern -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
}

# Optimizar PyMuPDF: eliminar archivos innecesarios pero mantener lo esencial
if (Test-Path "package\fitz") {
    Write-Host "  Optimizing PyMuPDF..."
    # PyMuPDF puede tener muchos archivos, mantener solo lo esencial
}

# Optimizar Pillow: eliminar formatos de imagen no necesarios
if (Test-Path "package\PIL") {
    Write-Host "  Optimizing Pillow..."
    # Mantener solo formatos comunes (PNG, JPEG)
}

Write-Host "✓ Cleaned $cleaned files/directories"

# Verificar tamaño antes de comprimir
$packageSize = (Get-ChildItem -Path package -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "📊 Package size before compression: $([math]::Round($packageSize, 2)) MB"

# Crear zip
Write-Host ""
Write-Host "📦 Creating function.zip..."
cd package
Compress-Archive -Path * -DestinationPath ..\function.zip -Force
cd ..

$zipSize = (Get-Item function.zip).Length / 1MB
Write-Host "✓ function.zip created: $([math]::Round($zipSize, 2)) MB"

if ($zipSize -gt 50) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Zip size ($([math]::Round($zipSize, 2)) MB) exceeds 50 MB limit for direct upload!"
    Write-Host "   Options:"
    Write-Host "   1. Upload via S3 (supports up to 250 MB uncompressed)"
    Write-Host "   2. Use Lambda Layers for dependencies"
    Write-Host "   3. Further optimize by removing more dependencies"
} else {
    Write-Host ""
    Write-Host "✅ Zip size is under 50 MB - ready for direct upload!"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "✅ Package built!"
Write-Host "============================================================"

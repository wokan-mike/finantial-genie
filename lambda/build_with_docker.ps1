# Script para construir el deployment package usando Docker en Windows
# Esto asegura que todas las dependencias sean para Linux

Write-Host "============================================================"
Write-Host "🔨 Building Lambda Package with Docker (Linux)"
Write-Host "============================================================"

# Verificar que Docker esté disponible
try {
    docker --version | Out-Null
    Write-Host "✓ Docker found"
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop."
    exit 1
}

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
$packagePath = Join-Path $currentPath "package"

Write-Host ""
Write-Host "📦 Installing dependencies in Docker container..."
Write-Host "   (This may take a few minutes on first run...)"

# Usar imagen de Lambda Python oficial (Python 3.14)
# Necesitamos sobrescribir el entrypoint porque Lambda tiene un entrypoint especial
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

# Verificar pydantic_core
Write-Host ""
Write-Host "🔍 Verifying pydantic_core..."
if (Test-Path "package\pydantic_core") {
    Write-Host "✓ pydantic_core found"
    $soFiles = Get-ChildItem -Path "package\pydantic_core" -Recurse -Filter "*.so" -ErrorAction SilentlyContinue
    if ($soFiles) {
        Write-Host "✓ Found Linux binaries (.so files):"
        $soFiles | Select-Object -First 3 | ForEach-Object { Write-Host "  - $($_.FullName.Replace($currentPath + '\', ''))" }
    } else {
        Write-Host "⚠️  No .so files found"
    }
} else {
    Write-Host "❌ pydantic_core NOT found!"
    exit 1
}

# Crear zip
Write-Host ""
Write-Host "📦 Creating function.zip..."
cd package
Compress-Archive -Path * -DestinationPath ..\function.zip -Force
cd ..

$size = (Get-Item function.zip).Length / 1MB
Write-Host "✓ function.zip created: $([math]::Round($size, 2)) MB"

Write-Host ""
Write-Host "============================================================"
Write-Host "✅ Package built successfully!"
Write-Host "============================================================"

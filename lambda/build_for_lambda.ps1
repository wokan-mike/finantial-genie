# Script para construir el deployment package para AWS Lambda (Linux)
# Este script instala las dependencias para Linux x86_64

Write-Host "=" * 60
Write-Host "🔨 Building Lambda Deployment Package for Linux"
Write-Host "=" * 60

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
Write-Host "✓ Created package directory"

# Instalar dependencias para Linux
Write-Host "`n📦 Installing dependencies for Linux x86_64..."
Write-Host "   (This may take a few minutes...)"

# Usar pip con --platform para forzar instalación de wheels de Linux
$pipArgs = @(
    "install",
    "-r", "requirements.txt",
    "-t", "package/",
    "--platform", "manylinux2014_x86_64",
    "--only-binary", ":all:",
    "--python-version", "3.14",
    "--implementation", "cp",
    "--upgrade",
    "--no-cache-dir"
)

$result = & pip @pipArgs 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Platform-specific install failed, trying standard install..."
    # Si falla, intentar instalación estándar
    pip install -r requirements.txt -t package/ --upgrade --no-cache-dir
}

Write-Host "✓ Dependencies installed"

# Copiar index.py
Write-Host "`n📄 Copying index.py..."
Copy-Item index.py package/index.py
Write-Host "✓ index.py copied"

# Verificar pydantic_core
Write-Host "`n🔍 Verifying pydantic_core..."
$pydanticCorePath = "package\pydantic_core"
if (Test-Path $pydanticCorePath) {
    Write-Host "✓ pydantic_core found"
    
    # Buscar archivos .so (Linux) o .pyd (Windows)
    $soFiles = Get-ChildItem -Path $pydanticCorePath -Recurse -Filter "*.so" -ErrorAction SilentlyContinue
    $pydFiles = Get-ChildItem -Path $pydanticCorePath -Recurse -Filter "*.pyd" -ErrorAction SilentlyContinue
    
    if ($soFiles) {
        Write-Host "✓ Found Linux binaries (.so files)"
        $soFiles | Select-Object -First 3 | ForEach-Object { Write-Host "  - $($_.Name)" }
    } elseif ($pydFiles) {
        Write-Host "⚠️  WARNING: Found Windows binaries (.pyd files) instead of Linux (.so)"
        Write-Host "   These won't work in Lambda. Consider using Docker."
    } else {
        Write-Host "⚠️  No binary files found in pydantic_core"
    }
} else {
    Write-Host "❌ pydantic_core NOT found!"
}

# Verificar openai
Write-Host "`n🔍 Verifying openai..."
if (Test-Path "package\openai") {
    Write-Host "✓ openai found"
} else {
    Write-Host "❌ openai NOT found!"
}

# Crear zip
Write-Host "`n📦 Creating function.zip..."
cd package
Compress-Archive -Path * -DestinationPath ..\function.zip -Force
cd ..

$size = (Get-Item function.zip).Length / 1MB
Write-Host "✓ function.zip created: $([math]::Round($size, 2)) MB"

Write-Host "`n" + "=" * 60
Write-Host "✅ Package built!"
Write-Host "=" * 60
Write-Host "`n⚠️  NOTE: If you see Windows binaries (.pyd), use Docker method instead."

#!/bin/bash
# Script para construir el deployment package usando Docker (recomendado)
# Esto asegura que todas las dependencias sean para Linux

echo "============================================================"
echo "🔨 Building Lambda Package with Docker (Linux)"
echo "============================================================"

# Limpiar
rm -rf package function.zip

# Crear directorio
mkdir -p package

# Usar imagen de Python oficial (Linux)
echo ""
echo "📦 Installing dependencies in Docker container..."
docker run --rm \
  --entrypoint /bin/bash \
  -v "$(pwd):/var/task" \
  -w /var/task \
  public.ecr.aws/lambda/python:3.14 \
  -c "pip install -r requirements.txt -t package/ --upgrade --no-cache-dir"

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Copiar index.py
echo ""
echo "📄 Copying index.py..."
cp index.py package/

# Verificar pydantic_core
echo ""
echo "🔍 Verifying pydantic_core..."
if [ -d "package/pydantic_core" ]; then
    echo "✓ pydantic_core found"
    SO_FILES=$(find package/pydantic_core -name "*.so" | head -3)
    if [ -n "$SO_FILES" ]; then
        echo "✓ Found Linux binaries (.so files):"
        echo "$SO_FILES"
    else
        echo "⚠️  No .so files found"
    fi
else
    echo "❌ pydantic_core NOT found!"
    exit 1
fi

# Crear zip
echo ""
echo "📦 Creating function.zip..."
cd package
zip -r ../function.zip . -q
cd ..

SIZE=$(du -h function.zip | cut -f1)
echo "✓ function.zip created: $SIZE"

echo ""
echo "============================================================"
echo "✅ Package built successfully!"
echo "============================================================"

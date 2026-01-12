#!/usr/bin/env python3
"""
Script para construir el deployment package y verificar que openai esté incluido correctamente
"""

import os
import zipfile
import shutil
import subprocess
from pathlib import Path

def build_package():
    """Construir el deployment package correctamente"""
    print("=" * 60)
    print("🔨 Building Lambda Deployment Package")
    print("=" * 60)
    
    # Limpiar anteriores
    if os.path.exists('package'):
        print("🧹 Cleaning old package directory...")
        shutil.rmtree('package')
    
    if os.path.exists('function.zip'):
        print("🧹 Removing old function.zip...")
        os.remove('function.zip')
    
    # Crear directorio package
    os.makedirs('package', exist_ok=True)
    print("✓ Created package directory")
    
    # Instalar dependencias
    print("\n📦 Installing dependencies...")
    # Instalar todas las dependencias, incluyendo las de pydantic
    result = subprocess.run(
        [
            'pip', 'install',
            '-r', 'requirements.txt',
            '-t', 'package/',
            '--upgrade',
            '--no-cache-dir'  # Evitar problemas de caché
        ],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"❌ Error installing dependencies:")
        print(result.stderr)
        return False
    
    print("✓ Dependencies installed")
    
    # Copiar index.py
    print("\n📄 Copying index.py...")
    shutil.copy('index.py', 'package/index.py')
    print("✓ index.py copied")
    
    # Verificar que openai esté presente
    print("\n🔍 Verifying openai package...")
    openai_path = Path('package/openai')
    if openai_path.exists() and openai_path.is_dir():
        print(f"✓ openai package found at: {openai_path.absolute()}")
        
        # Verificar archivos importantes
        init_file = openai_path / '__init__.py'
        if init_file.exists():
            print(f"✓ openai/__init__.py exists")
        else:
            print(f"⚠️  openai/__init__.py NOT found!")
        
        # Listar algunos archivos para verificar
        files = list(openai_path.glob('*.py'))
        print(f"✓ Found {len(files)} Python files in openai package")
    else:
        print(f"❌ openai package NOT found in package directory!")
        print(f"   Looking in: {Path('package').absolute()}")
        print(f"   Contents: {list(Path('package').iterdir())}")
        return False
    
    # Verificar dependencias de openai
    print("\n🔍 Checking openai dependencies...")
    required_deps = ['httpx', 'pydantic', 'pydantic_core', 'typing_extensions']
    for dep in required_deps:
        dep_path = Path(f'package/{dep}')
        if dep_path.exists():
            print(f"✓ {dep} found")
            # Verificar que tenga __init__.py o archivos importantes
            if dep_path.is_dir():
                init_file = dep_path / '__init__.py'
                if init_file.exists() or any(dep_path.glob('*.so')) or any(dep_path.glob('*.pyd')):
                    print(f"  ✓ {dep} appears to be complete")
                else:
                    print(f"  ⚠️  {dep} may be incomplete")
        else:
            print(f"❌ {dep} NOT found (WILL cause import issues!)")
    
    # Limpiar archivos innecesarios para reducir tamaño
    print("\n🧹 Cleaning up unnecessary files...")
    cleanup_patterns = [
        '**/__pycache__',
        '**/*.pyc',
        '**/*.dist-info',
        '**/*.egg-info',
        '**/tests',
        '**/test',
        '**/*.md',
        '**/*.txt',
    ]
    
    cleaned = 0
    for pattern in cleanup_patterns:
        for path in Path('package').glob(pattern):
            if path.is_file():
                path.unlink()
                cleaned += 1
            elif path.is_dir():
                shutil.rmtree(path)
                cleaned += 1
    
    print(f"✓ Cleaned {cleaned} unnecessary files/directories")
    
    # Crear zip
    print("\n📦 Creating function.zip...")
    with zipfile.ZipFile('function.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('package'):
            for file in files:
                file_path = os.path.join(root, file)
                # Usar ruta relativa desde package/
                arcname = os.path.relpath(file_path, 'package')
                zipf.write(file_path, arcname)
    
    zip_size = os.path.getsize('function.zip') / (1024 * 1024)
    print(f"✓ function.zip created ({zip_size:.2f} MB)")
    
    # Verificar contenido del zip
    print("\n🔍 Verifying zip contents...")
    with zipfile.ZipFile('function.zip', 'r') as zipf:
        files = zipf.namelist()
        openai_files = [f for f in files if f.startswith('openai/')]
        
        if openai_files:
            print(f"✓ Found {len(openai_files)} files in openai/ directory in zip")
            print(f"  Sample files: {openai_files[:5]}")
            
            # Verificar que index.py esté en la raíz
            if 'index.py' in files:
                print("✓ index.py is in root of zip")
            else:
                print("❌ index.py NOT in root of zip!")
                return False
        else:
            print("❌ No openai files found in zip!")
            return False
    
    print("\n" + "=" * 60)
    print("✅ Package built successfully!")
    print("=" * 60)
    print(f"\n📋 Summary:")
    print(f"   - Package size: {zip_size:.2f} MB")
    print(f"   - Files in zip: {len(files)}")
    print(f"   - OpenAI files: {len(openai_files)}")
    print(f"\n📤 Next steps:")
    print(f"   1. Upload function.zip to Lambda")
    print(f"   2. Verify OPENAI_API_KEY environment variable is set")
    print(f"   3. Test the function")
    
    return True

if __name__ == "__main__":
    success = build_package()
    exit(0 if success else 1)

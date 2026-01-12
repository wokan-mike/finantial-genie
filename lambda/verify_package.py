#!/usr/bin/env python3
"""
Script para verificar que el package tenga todas las dependencias necesarias
"""

import zipfile
import os
from pathlib import Path

def verify_zip(zip_path):
    """Verificar contenido del zip"""
    print("=" * 60)
    print(f"🔍 Verifying {zip_path}")
    print("=" * 60)
    
    if not os.path.exists(zip_path):
        print(f"❌ {zip_path} not found!")
        return False
    
    with zipfile.ZipFile(zip_path, 'r') as zipf:
        files = zipf.namelist()
        
        print(f"\nTotal files in zip: {len(files)}")
        
        # Verificar estructura
        checks = {
            'index.py': False,
            'openai/': False,
            'pydantic/': False,
            'pydantic_core/': False,
            'pydantic_core .so files': False,
        }
        
        # Verificar index.py
        if 'index.py' in files:
            checks['index.py'] = True
            print("✓ index.py found")
        else:
            print("❌ index.py NOT found!")
        
        # Verificar openai
        openai_files = [f for f in files if f.startswith('openai/')]
        if openai_files:
            checks['openai/'] = True
            print(f"✓ openai/ found ({len(openai_files)} files)")
            # Verificar __init__.py
            if 'openai/__init__.py' in files:
                print("  ✓ openai/__init__.py found")
        else:
            print("❌ openai/ NOT found!")
        
        # Verificar pydantic
        pydantic_files = [f for f in files if f.startswith('pydantic/')]
        if pydantic_files:
            checks['pydantic/'] = True
            print(f"✓ pydantic/ found ({len(pydantic_files)} files)")
        else:
            print("❌ pydantic/ NOT found!")
        
        # Verificar pydantic_core
        pydantic_core_files = [f for f in files if f.startswith('pydantic_core/')]
        if pydantic_core_files:
            checks['pydantic_core/'] = True
            print(f"✓ pydantic_core/ found ({len(pydantic_core_files)} files)")
            
            # Buscar archivos .so (Linux)
            so_files = [f for f in pydantic_core_files if f.endswith('.so')]
            if so_files:
                checks['pydantic_core .so files'] = True
                print(f"  ✓ Found {len(so_files)} .so files (Linux binaries)")
                print("  Sample .so files:")
                for so_file in so_files[:5]:
                    print(f"    - {so_file}")
            else:
                print("  ❌ No .so files found in pydantic_core!")
                # Buscar .pyd (Windows) para diagnosticar
                pyd_files = [f for f in pydantic_core_files if f.endswith('.pyd')]
                if pyd_files:
                    print(f"  ⚠️  Found {len(pyd_files)} .pyd files (Windows binaries - won't work in Lambda)")
        else:
            print("❌ pydantic_core/ NOT found!")
        
        # Verificar otras dependencias importantes
        print("\n📦 Other important dependencies:")
        important_deps = ['httpx', 'typing_extensions', 'anyio', 'sniffio']
        for dep in important_deps:
            dep_files = [f for f in files if f.startswith(f'{dep}/')]
            if dep_files:
                print(f"  ✓ {dep}/ ({len(dep_files)} files)")
            else:
                print(f"  ⚠️  {dep}/ not found")
        
        # Resumen
        print("\n" + "=" * 60)
        print("📊 Summary:")
        print("=" * 60)
        
        all_ok = all(checks.values())
        for check, status in checks.items():
            status_icon = "✓" if status else "❌"
            print(f"{status_icon} {check}")
        
        if all_ok:
            print("\n✅ All checks passed! Package should work in Lambda.")
        else:
            print("\n❌ Some checks failed. Package may not work correctly.")
        
        return all_ok

if __name__ == "__main__":
    import sys
    zip_path = sys.argv[1] if len(sys.argv) > 1 else "function.zip"
    verify_zip(zip_path)

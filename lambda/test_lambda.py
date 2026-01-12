#!/usr/bin/env python3
"""
Script para probar la Lambda function localmente o remotamente
"""

import json
import base64
import requests
import sys
from pathlib import Path

# Configuración
LAMBDA_URL = "https://tu-url.lambda-url.us-east-1.on.aws/"  # Reemplaza con tu URL
API_KEY = "tu-api-key-aqui"  # Reemplaza con tu API key

def test_without_api_key():
    """Test 1: Sin API key (debe retornar 401)"""
    print("\n🔒 Test 1: Sin API key")
    print("-" * 50)
    
    payload = {
        "fileBase64": base64.b64encode(b"test").decode('utf-8'),
        "fileType": "pdf",
        "creditCardId": "test",
        "creditCardName": "Test Card",
        "cutDate": 17,
        "billingPeriod": {
            "start": "2024-11-01",
            "end": "2024-11-30"
        }
    }
    
    response = requests.post(
        LAMBDA_URL,
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 401:
        print("✅ PASS: Correctamente rechazó sin API key")
    else:
        print("❌ FAIL: Debería retornar 401")
    
    return response.status_code == 401


def test_with_wrong_api_key():
    """Test 2: Con API key incorrecta (debe retornar 401)"""
    print("\n🔒 Test 2: Con API key incorrecta")
    print("-" * 50)
    
    payload = {
        "fileBase64": base64.b64encode(b"test").decode('utf-8'),
        "fileType": "pdf",
        "creditCardId": "test",
        "creditCardName": "Test Card",
        "cutDate": 17,
        "billingPeriod": {
            "start": "2024-11-01",
            "end": "2024-11-30"
        }
    }
    
    response = requests.post(
        LAMBDA_URL,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": "wrong-key-12345"
        }
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 401:
        print("✅ PASS: Correctamente rechazó API key incorrecta")
    else:
        print("❌ FAIL: Debería retornar 401")
    
    return response.status_code == 401


def test_rate_limit():
    """Test 3: Rate limit (hacer 11 requests rápidas, la 11 debe fallar con 429)"""
    print("\n⏱️  Test 3: Rate limit (10 req/min)")
    print("-" * 50)
    
    payload = {
        "fileBase64": base64.b64encode(b"test").decode('utf-8'),
        "fileType": "pdf",
        "creditCardId": "test",
        "creditCardName": "Test Card",
        "cutDate": 17,
        "billingPeriod": {
            "start": "2024-11-01",
            "end": "2024-11-30"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY
    }
    
    # Hacer 11 requests rápidas
    results = []
    for i in range(11):
        response = requests.post(LAMBDA_URL, json=payload, headers=headers)
        results.append(response.status_code)
        print(f"Request {i+1}: Status {response.status_code}", end="")
        if 'X-RateLimit-Remaining' in response.headers:
            print(f" | Remaining: {response.headers['X-RateLimit-Remaining']}")
        else:
            print()
    
    if results[-1] == 429:
        print("✅ PASS: Rate limit funcionando (11va request bloqueada)")
    else:
        print(f"❌ FAIL: La 11va request debería retornar 429, pero retornó {results[-1]}")
    
    return results[-1] == 429


def test_file_size_limit():
    """Test 4: Archivo muy grande (debe retornar 413)"""
    print("\n📦 Test 4: Límite de tamaño de archivo (20 MB)")
    print("-" * 50)
    
    # Crear un archivo base64 que exceda 20 MB
    # 20 MB = 20 * 1024 * 1024 bytes
    # Base64 aumenta ~33%, así que necesitamos ~27 MB de base64
    large_file = b"x" * (25 * 1024 * 1024)  # 25 MB de datos
    large_base64 = base64.b64encode(large_file).decode('utf-8')
    
    payload = {
        "fileBase64": large_base64,
        "fileType": "pdf",
        "creditCardId": "test",
        "creditCardName": "Test Card",
        "cutDate": 17,
        "billingPeriod": {
            "start": "2024-11-01",
            "end": "2024-11-30"
        }
    }
    
    response = requests.post(
        LAMBDA_URL,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY
        }
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 413:
        print("✅ PASS: Correctamente rechazó archivo muy grande")
    else:
        print("❌ FAIL: Debería retornar 413")
    
    return response.status_code == 413


def test_valid_request():
    """Test 5: Request válido (debe procesar o fallar por archivo inválido, pero no por auth)"""
    print("\n✅ Test 5: Request válido")
    print("-" * 50)
    
    # Usar un PDF pequeño de prueba (puedes reemplazar con un PDF real)
    test_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    pdf_base64 = base64.b64encode(test_pdf_content).decode('utf-8')
    
    payload = {
        "fileBase64": pdf_base64,
        "fileType": "pdf",
        "creditCardId": "test",
        "creditCardName": "Test Card",
        "cutDate": 17,
        "billingPeriod": {
            "start": "2024-11-01",
            "end": "2024-11-30"
        }
    }
    
    response = requests.post(
        LAMBDA_URL,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY
        }
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Puede retornar 200 (éxito) o 500 (error procesando), pero NO debe ser 401, 413, o 429
    if response.status_code not in [401, 413, 429]:
        print("✅ PASS: Request válido procesado (no rechazado por auth, rate limit o tamaño)")
        return True
    else:
        print(f"❌ FAIL: No debería retornar {response.status_code}")
        return False


def test_with_real_pdf(pdf_path: str):
    """Test 6: Con un PDF real"""
    print("\n📄 Test 6: Con PDF real")
    print("-" * 50)
    
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        print(f"❌ Archivo no encontrado: {pdf_path}")
        return False
    
    with open(pdf_file, 'rb') as f:
        pdf_content = f.read()
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
    
    payload = {
        "fileBase64": pdf_base64,
        "fileType": "pdf",
        "creditCardId": "test",
        "creditCardName": "Test Card",
        "cutDate": 17,
        "billingPeriod": {
            "start": "2024-11-01",
            "end": "2024-11-30"
        }
    }
    
    response = requests.post(
        LAMBDA_URL,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY
        }
    )
    
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    
    if result.get('success'):
        transactions = result.get('transactions', [])
        print(f"✅ PASS: Extrajo {len(transactions)} transacciones")
        if transactions:
            print(f"Primera transacción: {json.dumps(transactions[0], indent=2)}")
        return True
    else:
        print(f"❌ Error: {result.get('error')}")
        return False


def main():
    """Ejecutar todos los tests"""
    print("=" * 50)
    print("🧪 TESTING LAMBDA FUNCTION")
    print("=" * 50)
    
    # Verificar configuración
    if "tu-url" in LAMBDA_URL or "tu-api-key" in API_KEY:
        print("\n⚠️  ADVERTENCIA: Debes configurar LAMBDA_URL y API_KEY en este script")
        print("   Edita las variables al inicio del archivo")
        return
    
    results = []
    
    # Ejecutar tests básicos
    results.append(("Sin API key", test_without_api_key()))
    results.append(("API key incorrecta", test_with_wrong_api_key()))
    results.append(("Request válido", test_valid_request()))
    
    # Tests opcionales (pueden tomar tiempo)
    print("\n" + "=" * 50)
    print("Tests opcionales (pueden tomar tiempo):")
    print("=" * 50)
    
    # Descomenta estos si quieres probarlos:
    # results.append(("Rate limit", test_rate_limit()))
    # results.append(("Tamaño de archivo", test_file_size_limit()))
    
    # Si tienes un PDF real, descomenta:
    # if len(sys.argv) > 1:
    #     results.append(("PDF real", test_with_real_pdf(sys.argv[1])))
    
    # Resumen
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE TESTS")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests pasados")
    
    if passed == total:
        print("\n🎉 ¡Todos los tests pasaron!")
    else:
        print("\n⚠️  Algunos tests fallaron. Revisa la configuración.")


if __name__ == "__main__":
    main()

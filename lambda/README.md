# Credit Card Statement Processor Lambda

Esta función Lambda procesa estados de cuenta de tarjetas de crédito en formato PDF usando OpenAI para extraer transacciones automáticamente.

**Nota:** Esta función está disponible en Python. Ver `README_PYTHON.md` para instrucciones de despliegue.

## Versiones Disponibles

- **Python** (`index.py`): Versión recomendada, más fácil de mantener
- **JavaScript** (`index.js`): Versión legacy (deprecada)

## Configuración Rápida (Python)

1. **Instalar dependencias:**
```bash
cd lambda
pip install -r requirements.txt
```

2. **Configurar variables de entorno en AWS Lambda:**
- `OPENAI_API_KEY`: Tu API key de OpenAI
- `AWS_REGION`: Región de AWS (opcional, default: us-east-1)

3. **Desplegar:**
```bash
# Crear deployment package con dependencias
mkdir -p package
pip install -r requirements.txt -t package/
zip -r function.zip index.py package/

# Subir a Lambda (Python 3.11)
aws lambda update-function-code \
  --function-name statement-processor \
  --zip-file fileb://function.zip
```

Ver `README_PYTHON.md` para instrucciones detalladas.

## Uso

### Desde la aplicación React Native

La función espera un evento con esta estructura:

```json
{
  "pdfBase64": "base64 encoded PDF content",
  "creditCardId": "card_123",
  "creditCardName": "BBVA Azul",
  "cutDate": 17,
  "billingPeriod": {
    "start": "2024-11-18",
    "end": "2024-12-17"
  }
}
```

### Respuesta

```json
{
  "success": true,
  "transactions": [
    {
      "date": "2024-11-20",
      "amount": 150.50,
      "description": "Walmart Supercenter",
      "category": "Comida"
    }
  ],
  "metadata": {
    "totalExtracted": 25,
    "pdfPageCount": 3
  }
}
```

## Alternativa: Usar S3

También puedes subir el PDF a S3 y pasar las referencias:

```json
{
  "s3Bucket": "my-bucket",
  "s3Key": "statements/statement-2024-12.pdf",
  "creditCardId": "card_123",
  ...
}
```

## Categorías Soportadas

- Comida
- Entretenimiento
- Familia
- Transporte
- Salud
- Educación
- Ropa
- Servicios
- Vivienda
- Otros

## Notas

- La función usa `gpt-4o-mini` por defecto (más económico). Puedes cambiar a `gpt-4o` para mejor precisión.
- Los PDFs grandes se truncan a 15,000 caracteres para evitar límites de tokens.
- Solo se extraen transacciones dentro del período de facturación especificado.

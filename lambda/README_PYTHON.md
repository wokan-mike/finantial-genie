# Credit Card Statement Processor Lambda (Python)

Esta función Lambda procesa estados de cuenta de tarjetas de crédito en formato PDF usando OpenAI para extraer transacciones automáticamente.

## Configuración

### 1. Instalar dependencias localmente (para testing)

```bash
cd lambda
pip install -r requirements.txt
```

### 2. Configurar variables de entorno en AWS Lambda

- `OPENAI_API_KEY`: Tu API key de OpenAI
- `AWS_REGION`: Región de AWS (opcional, default: us-east-1)

### 3. Desplegar a AWS Lambda

#### Opción A: Usando AWS CLI

```bash
# Crear deployment package
zip -r function.zip index.py requirements.txt

# Subir a Lambda (Python 3.11 runtime)
aws lambda create-function \
  --function-name statement-processor \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512

# O actualizar función existente
aws lambda update-function-code \
  --function-name statement-processor \
  --zip-file fileb://function.zip
```

#### Opción B: Usando AWS SAM

Crea un `template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  StatementProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.lambda_handler
      Runtime: python3.11
      CodeUri: .
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          OPENAI_API_KEY: !Ref OpenAIApiKey
          AWS_REGION: us-east-1
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /process-statement
            Method: post
```

#### Opción C: Usando Terraform

```hcl
resource "aws_lambda_function" "statement_processor" {
  filename         = "function.zip"
  function_name    = "statement-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.lambda_handler"
  source_code_hash = filebase64sha256("function.zip")
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      OPENAI_API_KEY = var.openai_api_key
      AWS_REGION     = "us-east-1"
    }
  }
}
```

### 4. Instalar dependencias en Lambda

Las dependencias deben estar incluidas en el deployment package. Para incluir dependencias:

```bash
# Crear directorio para dependencias
mkdir -p package
pip install -r requirements.txt -t package/

# Crear zip con código y dependencias
zip -r function.zip index.py package/
```

O usar una Lambda Layer:

```bash
# Crear layer con dependencias
mkdir -p python/lib/python3.11/site-packages
pip install -r requirements.txt -t python/lib/python3.11/site-packages/
zip -r layer.zip python/

# Crear layer en AWS
aws lambda publish-layer-version \
  --layer-name statement-processor-deps \
  --zip-file fileb://layer.zip \
  --compatible-runtimes python3.11

# Asociar layer a la función
aws lambda update-function-configuration \
  --function-name statement-processor \
  --layers arn:aws:lambda:REGION:ACCOUNT:layer:statement-processor-deps:VERSION
```

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
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": {
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
      "totalExtracted": 25
    }
  }
}
```

## Testing Local

Puedes probar la función localmente:

```python
import json
import base64

# Leer PDF y convertir a base64
with open('statement.pdf', 'rb') as f:
    pdf_base64 = base64.b64encode(f.read()).decode('utf-8')

# Crear evento
event = {
    'pdfBase64': pdf_base64,
    'creditCardId': 'card_123',
    'creditCardName': 'BBVA Azul',
    'cutDate': 17,
    'billingPeriod': {
        'start': '2024-11-18',
        'end': '2024-12-17'
    }
}

# Ejecutar handler
from index import lambda_handler
result = lambda_handler(event, None)
print(json.dumps(result, indent=2))
```

## Dependencias

- **boto3**: AWS SDK para Python (opcional, solo si usas S3)
- **openai**: Cliente de OpenAI API (versión 1.12.0+ con soporte para Vision API)
- **python-dateutil**: Para parsing flexible de fechas (opcional)

**Nota**: Ya no se requiere `pdfplumber` porque OpenAI Vision API procesa PDFs e imágenes directamente.

## Notas

- La función usa **`gpt-4o`** con Vision API para procesar PDFs e imágenes directamente.
- **Soporta múltiples formatos**: PDF, PNG, JPG, JPEG
- OpenAI procesa el archivo completo sin necesidad de extraer texto previamente.
- Mejor precisión porque OpenAI ve el formato original del documento.
- Solo se extraen transacciones dentro del período de facturación especificado.
- El runtime recomendado es Python 3.11 para mejor rendimiento.

## Troubleshooting

### Error: "pdfplumber not available"

Asegúrate de incluir las dependencias en el deployment package o usar una Lambda Layer.

### Error: "OpenAI client not available"

Verifica que `OPENAI_API_KEY` esté configurada como variable de entorno en Lambda.

### Timeout en Lambda

Aumenta el timeout a 60 segundos si procesas PDFs muy grandes.

### Memoria insuficiente

Aumenta `memory_size` a 1024 MB si tienes problemas con PDFs grandes.

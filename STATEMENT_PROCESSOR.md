# Procesador de Estados de Cuenta con IA

Esta funcionalidad permite procesar automáticamente estados de cuenta de tarjetas de crédito en formato PDF usando OpenAI para extraer transacciones.

## Características

- ✅ Extracción automática de transacciones desde PDFs **e imágenes** (PNG, JPG)
- ✅ Procesamiento directo con OpenAI Vision API (sin extracción previa de texto)
- ✅ Categorización inteligente usando IA
- ✅ Detección de duplicados basada en fecha, monto y descripción
- ✅ Integración con el sistema de tarjetas de crédito
- ✅ Cálculo automático del período de facturación
- ✅ Preview de transacciones antes de guardar
- ✅ Soporte para estados de cuenta escaneados (imágenes)

## Configuración

### 1. Lambda Function (AWS)

#### Requisitos
- Cuenta de AWS con acceso a Lambda
- API Key de OpenAI
- Python 3.11+ para desarrollo local (recomendado)
- Node.js 18+ (solo si usas la versión JavaScript)

#### Instalación (Python - Recomendado)

```bash
cd lambda
pip install -r requirements.txt
```

#### Instalación (JavaScript - Legacy)

```bash
cd lambda
npm install
```

#### Variables de Entorno

Configura estas variables en AWS Lambda:

- `OPENAI_API_KEY`: Tu API key de OpenAI
- `AWS_REGION`: Región de AWS (opcional, default: us-east-1)

#### Despliegue (Python)

```bash
# Crear directorio para dependencias
mkdir -p package
pip install -r requirements.txt -t package/

# Crear zip con código y dependencias
zip -r function.zip index.py package/

# Subir a Lambda (Python 3.11)
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

#### Despliegue (JavaScript - Legacy)

```bash
# Crear package de deployment
zip -r function.zip . -x "*.git*" "node_modules/.cache/*"

# Subir a Lambda usando AWS CLI
aws lambda update-function-code \
  --function-name statement-processor \
  --zip-file fileb://function.zip
```

Ver `lambda/README_PYTHON.md` para instrucciones detalladas de despliegue en Python.

#### Configurar API Gateway o Function URL

Para que la aplicación pueda llamar a la Lambda, necesitas exponerla mediante:

1. **API Gateway** (recomendado para producción)
2. **Lambda Function URL** (más simple para desarrollo)

Ejemplo con Function URL:
```bash
aws lambda create-function-url-config \
  --function-name statement-processor \
  --auth-type NONE \
  --cors '{"AllowOrigins": ["*"], "AllowMethods": ["POST"], "AllowHeaders": ["content-type"]}'
```

### 2. Configuración en la Aplicación

#### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_LAMBDA_ENDPOINT=https://your-lambda-url.execute-api.us-east-1.amazonaws.com/prod/process-statement
```

O configura la variable en `src/services/statementProcessor.ts`:

```typescript
export function getLambdaEndpoint(): string {
  return 'https://your-lambda-url.execute-api.us-east-1.amazonaws.com/prod/process-statement';
}
```

## Uso

### Desde la Aplicación

1. **Navegar a Tarjetas**: Ve a la pestaña "Tarjetas" en el menú inferior
2. **Abrir Subir Estado**: Haz clic en el botón "📄 Subir Estado"
3. **Seleccionar Tarjeta**: Elige la tarjeta de crédito correspondiente
4. **Seleccionar Mes**: Elige el mes del estado de cuenta
5. **Subir PDF**: Selecciona el archivo PDF del estado de cuenta
6. **Procesar**: Haz clic en "Procesar Estado de Cuenta"
7. **Revisar Transacciones**: Revisa las transacciones extraídas
8. **Verificar Duplicados**: Haz clic en "Verificar Duplicados" para detectar transacciones ya existentes
9. **Guardar**: Guarda solo las transacciones nuevas

### Flujo de Trabajo

```
PDF → Lambda → OpenAI → Transacciones Extraídas → Verificación de Duplicados → Guardar
```

## Detección de Duplicados

El sistema detecta duplicados basándose en:

1. **Misma tarjeta de crédito**
2. **Mismo monto** (tolerancia: ±$0.01)
3. **Misma fecha** (tolerancia: ±1 día)
4. **Descripción similar** (matching difuso con 80% de similitud)

Las transacciones duplicadas se marcan y no se guardan automáticamente.

## Categorías Soportadas

El sistema categoriza automáticamente las transacciones en:

- 🍽️ Comida
- 🎬 Entretenimiento
- 👨‍👩‍👧‍👦 Familia
- 🚗 Transporte
- 🏥 Salud
- 📚 Educación
- 👕 Ropa
- 💡 Servicios
- 🏠 Vivienda
- 📦 Otros

## Costos

### OpenAI API

- **Modelo usado**: `gpt-4o` con Vision API
- **Formato soportado**: PDF, PNG, JPG, JPEG
- **Costo aproximado**: 
  - Imágenes: ~$0.01-0.03 por imagen (dependiendo del tamaño)
  - PDFs: Similar a imágenes, procesados como imágenes
- **Ventaja**: Procesa el archivo completo sin necesidad de extraer texto previamente

### Python Runtime

- **Versión**: Python 3.11 (recomendado)
- **Tiempo de ejecución**: ~5-15 segundos por PDF
- **Memoria**: 512 MB recomendado (1024 MB para PDFs grandes)

### AWS Lambda

- **Tiempo de ejecución**: ~5-15 segundos por PDF
- **Memoria**: 512 MB recomendado
- **Costo**: Dentro del free tier de AWS

## Troubleshooting

### Error: "Failed to process statement"

1. Verifica que la Lambda esté desplegada correctamente
2. Verifica que `OPENAI_API_KEY` esté configurada
3. Revisa los logs de CloudWatch para más detalles

### Error: "Credit card not found"

Asegúrate de haber creado la tarjeta de crédito en la aplicación antes de procesar su estado de cuenta.

### Las transacciones no se categorizan correctamente

El modelo de IA puede mejorar con prompts más específicos. Edita `lambda/index.js` para ajustar el prompt del sistema.

### PDF muy grande

Los PDFs grandes se truncan a 15,000 caracteres. Considera dividir estados de cuenta muy largos.

## Mejoras Futuras

- [ ] Soporte para múltiples formatos de PDF (diferentes bancos)
- [ ] Entrenamiento de modelo personalizado para mejor precisión
- [ ] Procesamiento por lotes de múltiples estados de cuenta
- [ ] Integración con S3 para almacenar PDFs
- [ ] Soporte móvil con expo-document-picker
- [ ] Historial de procesamientos
- [ ] Corrección manual de categorías antes de guardar

## Seguridad

- ⚠️ **Nunca** commits la API key de OpenAI al repositorio
- ⚠️ Usa variables de entorno para todas las credenciales
- ⚠️ Configura CORS correctamente en API Gateway/Function URL
- ⚠️ Considera agregar autenticación para producción

## Soporte

Para problemas o preguntas, revisa:
1. Logs de CloudWatch (Lambda)
2. Console del navegador (aplicación)
3. Documentación de OpenAI API

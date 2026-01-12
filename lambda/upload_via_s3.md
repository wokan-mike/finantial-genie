# Cómo subir el Lambda package vía S3 (para archivos > 50 MB)

Si tu `function.zip` es mayor a 50 MB, necesitas subirlo vía S3 en lugar de upload directo.

## Pasos:

### 1. Crear un bucket S3 (si no tienes uno)

```bash
aws s3 mb s3://tu-bucket-lambda-packages --region us-east-1
```

### 2. Subir el zip a S3

```powershell
# Desde PowerShell
aws s3 cp function.zip s3://tu-bucket-lambda-packages/function.zip

# O desde la consola de S3:
# 1. Ve a S3 en la consola de AWS
# 2. Selecciona o crea un bucket
# 3. Upload → Select function.zip
```

### 3. Actualizar Lambda desde S3

**Opción A: Desde la consola**
1. Ve a tu función Lambda
2. Code → Upload from → Amazon S3 location
3. Ingresa la URL de S3: `s3://tu-bucket-lambda-packages/function.zip`
4. Save

**Opción B: Desde AWS CLI**
```bash
aws lambda update-function-code \
  --function-name finantialGenie \
  --s3-bucket tu-bucket-lambda-packages \
  --s3-key function.zip
```

## Nota importante

- El límite para S3 es **250 MB descomprimido**
- El zip puede ser hasta ~100 MB comprimido
- Asegúrate de que el bucket esté en la misma región que tu Lambda

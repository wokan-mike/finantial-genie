# Solución para el Error en Expo Go

## Problema

El error "Failed to download remote update" ocurre porque tu proyecto usa **WatermelonDB** (`@nozbe/watermelondb`), que requiere código nativo y **NO es compatible con Expo Go**.

## Soluciones

### Opción 1: Usar Development Build (Recomendado)

En lugar de Expo Go, necesitas crear un development build que incluya el código nativo de WatermelonDB.

```bash
# Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# Iniciar sesión en Expo
eas login

# Crear un development build para Android
eas build --profile development --platform android

# O para iOS
eas build --profile development --platform ios
```

Luego instala el build en tu dispositivo y úsalo en lugar de Expo Go.

### Opción 2: Usar solo Dexie.js (Más simple para desarrollo)

Si solo quieres probar en Expo Go, puedes modificar temporalmente el código para usar solo Dexie.js (que ya está instalado y funciona en web y móvil).

### Opción 3: Usar Tunnel en Expo

Si el problema es de conexión de red, intenta usar tunnel:

```bash
expo start --tunnel
```

Esto crea un túnel público que permite conectar desde cualquier red.

## Verificación

Para verificar qué dependencias requieren código nativo:

```bash
npx expo-doctor
```

Este comando te dirá qué dependencias no son compatibles con Expo Go.

## Recomendación

Para desarrollo rápido, usa **Opción 3 (tunnel)** primero. Si el error persiste, entonces el problema es WatermelonDB y necesitas usar **Opción 1 (development build)**.

# Solución para Error en Expo Go

## Problema

El error "Failed to download remote update" puede deberse a:

1. **WatermelonDB en dependencias**: Aunque no se usa, está en `package.json` y puede causar conflictos
2. **Problemas de conexión**: El dispositivo y la computadora no están en la misma red
3. **Firewall/Antivirus**: Bloqueando la conexión

## Soluciones (en orden de facilidad)

### Solución 1: Usar Tunnel (Más fácil)

Ejecuta Expo con tunnel para evitar problemas de red:

```bash
expo start --tunnel
```

Esto crea un túnel público que funciona desde cualquier red.

### Solución 2: Remover WatermelonDB (Recomendado)

Ya que no estás usando WatermelonDB (el código usa Dexie para todo), puedes removerlo:

```bash
npm uninstall @nozbe/watermelondb @nozbe/with-observables
```

Luego reinicia el servidor:

```bash
expo start
```

### Solución 3: Verificar conexión de red

Asegúrate de que:
- Tu computadora y tu móvil están en la misma red WiFi
- No hay firewall bloqueando el puerto (por defecto 8081)
- El antivirus no está bloqueando Expo

### Solución 4: Usar Development Build

Si necesitas usar WatermelonDB en el futuro, necesitarás un development build:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Crear development build
eas build --profile development --platform android
```

## Verificación

Para verificar qué está causando el problema:

```bash
npx expo-doctor
```

Este comando te dirá si hay dependencias incompatibles.

## Recomendación

**Empieza con Solución 1 (tunnel)**. Si funciona, el problema era de red. Si no funciona, aplica **Solución 2 (remover WatermelonDB)** ya que no lo estás usando.

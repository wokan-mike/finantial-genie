# Instalación de Degradados

Para que los degradados funcionen correctamente en móvil, necesitas instalar `expo-linear-gradient`.

## Instalación

Ejecuta el siguiente comando:

```bash
npx expo install expo-linear-gradient
```

## ¿Por qué?

- **Web**: Los degradados funcionan automáticamente con CSS `linear-gradient`
- **Móvil**: Necesita `expo-linear-gradient` para renderizar degradados nativos

El componente `GradientCard` ya está preparado para usar `expo-linear-gradient` cuando esté disponible. Si no lo instalas, usará colores sólidos como fallback en móvil.

## Verificación

Después de instalar, los degradados deberían aparecer automáticamente en:
- Cards del Dashboard
- Menú de navegación inferior
- Cualquier componente que use `GradientCard`

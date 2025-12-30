# Financial Genie

Aplicación financiera standalone multiplataforma (web + mobile) para gestión de gastos, ingresos, patrimonio e inversiones.

## Características

- 📊 Gestión de gastos e ingresos con etiquetas/categorías
- 💳 Compras a meses con seguimiento de pagos
- 📈 Analizador de gastos por categoría
- 💰 Gestión de patrimonio (activos y pasivos)
- 📱 Funciona completamente offline
- 🎨 Interfaz moderna y elegante

## Stack Tecnológico

- React Native + Expo
- TypeScript
- WatermelonDB (Mobile) / Dexie.js (Web)
- React Navigation
- Zustand
- Victory Charts

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm start

# Ejecutar en plataforma específica
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Estructura del Proyecto

```
src/
├── screens/          # Pantallas principales
├── components/       # Componentes reutilizables
├── services/         # Lógica de negocio
├── hooks/           # Custom hooks
├── store/           # Estado global
├── utils/           # Utilidades
├── navigation/      # Configuración de navegación
└── theme/           # Tema y estilos
```


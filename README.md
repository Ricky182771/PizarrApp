# 📋 Pizarra Táctica — PWA & Telegram Mini App

¡Bienvenido a la **Pizarra Táctica**! Una pizarra de tácticas de fútbol interactiva construida con un canvas adaptable 16:9 que permite a los directores técnicos, jugadores y aficionados diseñar, guardar y compartir jugadas de forma ágil y profesional.

Este proyecto ha sido optimizado tanto para funcionar de manera nativa como una **Mini App de Telegram** y como una **Progressive Web App (PWA)** instalable en cualquier dispositivo y navegador moderno.

---

## ⚡ Características Principales

- **Canvas 16:9 Interactivo:** Posiciona fichas de jugadores, traza flechas tácticas en tiempo real y gestiona alineaciones completas.
- **Funcionamiento Dual:**
  - 🤖 **Telegram Mini App:** Integrada con el SDK oficial, autodección de entorno, sincronización de la paleta de colores nativa de Telegram y modo de pantalla expandida automática.
  - 📱 **PWA (Progressive Web App):** Instalable en teléfonos móviles (iOS & Android) y ordenadores directamente desde el navegador con soporte Offline completo.
- **Modo Sin Conexión (Offline):** Service Worker incorporado que realiza el pre-caché de la shell de la aplicación y gestiona estrategias inteligentes de red/caché para asegurar que el tablero táctico siempre esté accesible, incluso en el campo de juego sin cobertura de red.

---

## 📂 Archivos PWA Agregados

Para dotar al proyecto de capacidades PWA, hemos agregado y configurado los siguientes recursos:

1. **[manifest.json](file:///home/teacher/PizarrApp/public/manifest.json):** Define los metadatos de la aplicación web, incluyendo colores corporativos de la interfaz (`theme_color`), el comportamiento de visualización autónomo (`standalone`), y los punteros a los distintos tamaños de iconos.
2. **Iconos PWA (en `public/`):** Generados con diseño premium oscuro para coincidir con la estética táctica de la app:
   - [favicon.png](file:///home/teacher/PizarrApp/public/favicon.png) (32x32)
   - [icon-192.png](file:///home/teacher/PizarrApp/public/icon-192.png) y [icon-512.png](file:///home/teacher/PizarrApp/public/icon-512.png) (Iconos adaptativos para pantallas estándar)
   - [icon-192-maskable.png](file:///home/teacher/PizarrApp/public/icon-192-maskable.png) y [icon-512-maskable.png](file:///home/teacher/PizarrApp/public/icon-512-maskable.png) (Iconos con área segura/padding para sistemas Android e iOS)
3. **[sw.js](file:///home/teacher/PizarrApp/public/sw.js):** El Service Worker encargado del ciclo de vida y la red de caché:
   - **Estrategia Cache-First:** Para todos los recursos compilados por Vite en `/assets/` (gracias al hashing dinámico).
   - **Estrategia Network-First:** Para el HTML raíz, configuraciones y el script SDK de Telegram, garantizando actualizaciones inmediatas del lado del cliente y fallback offline si la red falla.
4. **[main.tsx](file:///home/teacher/PizarrApp/src/main.tsx):** Registro automático y asíncrono del Service Worker al cargar la página para evitar impactos en el tiempo de interacción inicial (LCP/INP).

---

## 🛠️ Cómo Probar Localmente

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Correr Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construir y Probar la PWA en Producción:**
   ```bash
   # Compila la app y genera el bundle estático en dist/
   npm run build
   
   # Previsualiza localmente el build de producción
   npm run preview
   ```
   *Nota:* Para instalar la PWA en tu dispositivo local durante el modo de previsualización o desarrollo, accede desde un navegador compatible (como Chrome, Edge, Safari) usando una conexión segura o `localhost`.

4. **Para probar en Telegram:**
   Sigue las instrucciones completas explicadas en la **[Guía de Telegram](file:///home/teacher/PizarrApp/TELEGRAM_GUIDE.md)** para levantar un túnel HTTPS seguro (`localtunnel`/`ngrok`) y conectar el BotFather con tu entorno local.

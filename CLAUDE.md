# Portafolio de Proyectos — Innovación y Transformación Digital

## Descripción
App web React (Vite) para gestión de portafolio de proyectos del área de Innovación de Flores El Trigal. Hospedada en GitHub Pages con dominio custom, conectada a SharePoint Lists via Power Automate como backend.

## Stack técnico
- **Frontend:** React 18 + Vite, single-page app, inline styles (no CSS files)
- **Hosting:** GitHub Pages → dominio custom `innovacion.trigal-digital.com`
- **Backend:** SharePoint Lists via Power Automate HTTP triggers
- **Fotos:** GitHub CDN — repo `El-Trigal/portfolio-fotos` (público), token via variable de entorno Vite
- **Deploy:** GitHub Actions compila automáticamente en cada push a `main`

## Estructura de archivos
```
src/
  App.jsx      — Componente principal: layout, ProjectCard, AuthBar, filtros, KPIs
  Detail.jsx   — Vista de detalle de proyecto (lazy-loaded)
  Modals.jsx   — Todos los formularios CRUD (lazy-loaded)
  api.js       — Power Automate CRUD + subida de fotos a GitHub CDN
  tokens.js    — Constantes de diseño, helpers, INNOVATION_TYPES
  context.js   — AuthCtx (isEditor, isMobile) + EDITOR_KEY
  main.jsx     — Entry point de React
public/
  logo.png     — Logo I+D (PNG estático, referenciado con import.meta.env.BASE_URL)
  CNAME        — innovacion.trigal-digital.com
.env.local     — VITE_GITHUB_TOKEN (gitignoreado, solo desarrollo local)
index.html     — HTML base con skeleton spinner CSS (#root:empty)
vite.config.js — Config Vite con base path /portfolio-proyectos/
.github/workflows/deploy.yml — GitHub Actions (inyecta VITE_GITHUB_TOKEN desde secret)
```

## Variable de entorno
- **`VITE_GITHUB_TOKEN`**: token de GitHub con acceso write al repo `El-Trigal/portfolio-fotos`
- En local: crear `.env.local` (ya está en `.gitignore` via `*.local`)
- En CI: secret en GitHub → Settings → Secrets → `VITE_GITHUB_TOKEN`

## Identidad visual
- **Colores en `tokens.js` objeto `C`:**
  - `navy: "#0E2841"` — primario
  - `teal: "#267B8A"` — secundario
  - `orange: "#E97132"` — acento
  - `dark: "#1F3361"` — fondo de página completo
  - `white`, `bg`, `border`, `borderLight`, `textPrimary`, `textSecondary`, `textMuted`
- **Fuente:** Aptos con fallback a Segoe UI
- **Logo:** PNG en `public/logo.png`, mostrado en chip blanco sobre fondo oscuro
- **Estilos:** 100% inline styles, sin archivos CSS

## Layout principal (pantalla de portafolio)
- **Fondo completo:** `C.dark` (`#1F3361`) cubre toda la página
- **Header:** Directo sobre el azul — logo en chip blanco, subtítulo `rgba(255,255,255,0.6)`, título en blanco
- **KPIs:** Isla blanca `border-radius:12px` con 4 indicadores sobre proyectos "En curso":
  - Activos, En prototipado, En piloto, En implementación
- **Filtros:** Flotando sobre el azul — activo: fondo blanco/texto `C.dark`; inactivo: `rgba(255,255,255,0.1)`
- **Grid de tarjetas:** 1 columna en móvil, `repeat(auto-fill, minmax(300px, 1fr))` en desktop

## ProjectCard (dossier layout)
- **Contenedor:** `display:flex`, `height:128px` (fijo), `border-radius:10px`, `overflow:hidden`
- **Thumbnail izquierdo:** `width:110px`, altura 100% (hereda del flex container), `objectFit:cover`, `objectPosition:center`; placeholder 🌱 si no hay foto
- **Zona derecha:** 3 bloques con `justify-content:space-between`:
  1. **Meta:** tipo de innovación (color del acento) + indicador de actividad (≤30d: "Act. hace Xd" gris; >30d: chip ámbar "Sin update Xd")
  2. **Título + responsable:** título 2-line clamp, responsable con `formatLocations` integrado (`nombre · Varias sedes`)
  3. **Progreso:** nombre de fase + barra única (color del tipo de innovación) + contador X/7

## Tipos de innovación (`INNOVATION_TYPES` en tokens.js)
```js
"IA / visión":     { accent: "#7c3aed", barFill: "#7c3aed" }
"Sensórica / IoT": { accent: "#0891b2", barFill: "#0891b2" }
"Mecanización":    { accent: "#ea580c", barFill: "#ea580c" }
"Software":        { accent: "#059669", barFill: "#059669" }
"Sanidad vegetal":    { accent: "#db2777", barFill: "#db2777" }
"Puestos saludables": { accent: "#16a34a", barFill: "#16a34a" }
"Otro":               { accent: "#64748b", barFill: "#64748b" }  // fallback
```
- Proyectos sin `TipoInnovacion` en SharePoint → muestran "OTRO" en gris
- Campo seleccionable en formularios de creación y edición

## Modelo de datos (SharePoint Lists)

### Proyectos_ITD
| Campo | Tipo SharePoint | Obligatorio |
|-------|----------------|-------------|
| Nombre (Title) | Línea de texto | Sí |
| Descripcion | Varias líneas | No |
| Responsable | Línea de texto | Sí |
| Sede | Línea de texto (comma-separated: "Aguas Claras, Olas") | No |
| FechaInicio | Fecha | Sí |
| FechaEstimadaFin | Fecha | No |
| Presupuesto | Número | No |
| Estado | Opción: En curso, Pausado, Completado, Cancelado | Sí |
| Fase | Opción: Ideación, Iniciación, Prototipado, Piloto, Implementación, Entrega, Seguimiento | Sí |
| FotoPrincipal | Línea de texto (URL) | No |
| LinkBrightIdea | Línea de texto (URL) | No |
| TipoInnovacion | Opción: IA / visión, Sensórica / IoT, Mecanización, Software, Sanidad vegetal, Otro | No |

### Avances_ITD
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| TituloAvance (Title) | Línea de texto | Sí |
| ProyectoID | Número | Sí |
| Fecha | Fecha | Sí |
| Descripcion | Varias líneas | No |
| ProximoPaso | Varias líneas | Sí |
| RegistradoPor | Línea de texto | Sí |
| FotoEvidencia | Línea de texto (URL) | No |

### Contratos_ITD
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Proveedor (Title) | Línea de texto | Sí |
| ProyectoID | Número | Sí |
| Concepto | Línea de texto | Sí |
| Valor | Número | Sí |

### Pagos_ITD
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Nota (Title) | Línea de texto | No |
| ContratoID | Número | Sí |
| Fecha | Fecha | Sí |
| Monto | Número | Sí |

## Helpers en tokens.js
- `formatLocations(sede)` — 1 sede → nombre, >1 → "Varias sedes", vacío → null. **Solo para tarjetas; el detail view muestra la lista completa.**
- `imgUrl(src, width)` — proxy wsrv.nl para imágenes raw.githubusercontent.com → WebP optimizado
- `fmtD(date)` — formatea fecha a "14 Abr 2025"
- `fmt(n)` / `fmtS(n)` — formatean montos COP
- `sumPay(cs)` / `sumVal(cs)` — suman pagos y valores de contratos

## Power Automate Endpoints (en src/api.js)
- **API-Leer** (GET): Trae las 4 listas completas. El paso "Obtener elementos" trae todas las columnas automáticamente — no requiere modificación al agregar columnas nuevas.
- **API-CrearProyecto** (POST): Envía `tipoInnovacion` entre otros campos.
- **API-EditarProyecto** (POST): Envía `tipoInnovacion` entre otros campos.
- **API-CrearAvance** (POST): Acepta `fotoEvidencia` (opcional).
- **API-CrearContrato** (POST)
- **API-CrearPago** (POST)

> Los flujos de escritura devuelven `{"ok": true}`. `apiCall()` parsea el texto correctamente.
> Los campos opcionales se filtran con `stripEmpty()` — nunca se envían como `null`.
> SharePoint devuelve campos Opción como `{Value: "..."}` — el mapeo usa `p.Campo?.Value || p.Campo`.

## Subida de fotos (GitHub CDN)
- **Función:** `subirFotoGithub(file, folder)` en `api.js`
- **Flujo:** selección → compresión canvas (max 1200px, ~900KB) → base64 → PUT GitHub API → URL `raw.githubusercontent.com`
- **Carpetas:** `/proyectos/` para foto principal, `/avances/` para foto evidencia
- **Repo:** `El-Trigal/portfolio-fotos` (debe ser público)

## Sistema de roles
- **Lector (default):** Solo lectura, sin botones de edición
- **Editor:** Clave `innova2026` vía botón "🔑 Acceso editor" — aparece translúcido sobre el fondo oscuro
- Implementado con `AuthCtx`. Expone `{ isEditor, isMobile }`.

## Responsive / Móvil
- Breakpoint: `≤640px` via `useMediaQuery("(max-width: 640px)")`
- `isMobile` distribuido via `AuthCtx`
- KPIs: grid 2×2 en móvil, 4 columnas en desktop
- Tarjetas: 1 columna en móvil (layout horizontal se mantiene — thumbnail 110px + contenido)
- Formularios: 1 columna en móvil

## Sede (campo multi-valor)
- Almacenado como string comma-separated en SharePoint: `"Aguas Claras, Olas"`
- En formularios: checkboxes con opciones `["Aguas Claras", "Olas", "Caribe", "Manantiales"]`
- En tarjetas: `formatLocations` convierte a "Varias sedes" si hay más de una
- En detail view: se muestra el string completo sin transformar

## Notas importantes
- `node` está en `C:\Program Files\nodejs\` — no está en el PATH de bash, usar PowerShell para correr npm
- Comando para build local: `powershell.exe -ExecutionPolicy Bypass -Command "& { $env:PATH = 'C:\Program Files\nodejs;' + $env:PATH; npm run build }"`
- SharePoint tiene límite de 100 items por defecto en "Obtener elementos" — configurar paginación si se superan
- Power Automate tiene ~5 segundos de latencia por llamada

## Comandos
```bash
# Desde PowerShell (node no está en PATH de bash)
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
npm install
npm run dev      # puerto 5173
npm run build    # genera dist/
```

## Deploy
Push a `main` → GitHub Actions compila y despliega automáticamente a:
https://innovacion.trigal-digital.com/

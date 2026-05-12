# Informe del proyecto Pbex

Documento de estado del trabajo realizado, stack tecnológico y funcionalidades implementadas en la aplicación de gestión de producción **Pbex**.

---

## 1. Resumen

**Pbex** es una aplicación web orientada a planta: permite autenticarse, registrar producción y defectos como **eventos** en Supabase, consultar un **panel** con métricas derivadas de esos datos, obtener **recomendaciones en español** vía IA (Groq) y administrar un **catálogo de productos** (líneas, materiales y especificaciones de inyección/soplado).

---

## 2. Lo realizado hasta ahora

En términos de producto y código, el proyecto incluye:

| Área | Estado |
|------|--------|
| Landing pública (`/`) con acceso a login y registro | Implementado |
| Autenticación Supabase (email/contraseña) y sesión SSR | Implementado |
| Rutas protegidas con redirección si no hay usuario | Implementado |
| Registro de eventos de producción y defectos | Implementado |
| Panel de control con métricas y resumen para IA | Implementado |
| API de recomendaciones con Groq (usuario autenticado) | Implementado |
| Catálogo de productos con filtros y búsqueda | Implementado |
| Alta/edición/baja de productos y catálogos auxiliares (acciones servidor + Zod) | Implementado |
| Actualización de sesión/cookies en el borde (middleware de Supabase) | Implementado |

La base de datos esperada incluye al menos la tabla de **eventos** (ver migración en `supabase/migrations/001_eventos.sql`) y tablas de **producto**, **línea de producción**, **material** y especificaciones, coherentes con las consultas del código.

---

## 3. Tecnologías en uso

| Tecnología | Uso en el proyecto |
|------------|-------------------|
| **Next.js 16** | App Router, páginas servidor, Route Handlers, Server Actions |
| **React 19** | Componentes de interfaz y formularios |
| **TypeScript** | Tipado en servicios, acciones y componentes |
| **Tailwind CSS 4** | Estilos utilitarios y modo claro/oscuro coherente con `zinc` |
| **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) | Auth, cliente browser/servidor, cookies en middleware |
| **Zod 4** | Validación de formularios (Server Actions) y cuerpo del API de recomendaciones |
| **Groq SDK** | Chat completions (modelo `llama-3.3-70b-versatile`) para recomendaciones |
| **ESLint** (`eslint-config-next`) | Calidad de código en el pipeline `npm run lint` |

Herramientas de desarrollo: Node, `npm`, PostCSS con plugin de Tailwind 4.

---

## 4. Funcionalidades

### 4.1 Público y autenticación

- **Página de inicio (`/`)**: presenta el propósito de la app; si el usuario ya tiene sesión, redirige a `/dashboard`.
- **Registro e inicio de sesión** (`/register`, `/login`): formularios que operan contra Supabase Auth.
- **Cerrar sesión**: acción de servidor que invalida la sesión y redirige al flujo público.

### 4.2 Área protegida (layout `(protected)`)

- **Panel (`/dashboard`)**: lee la tabla `eventos`, calcula analíticas y muestra estadísticas; incluye bloque de recomendaciones IA alimentado por un resumen textual de las métricas.
- **Registros de planta (`/registro`)**:
  - **Producción**: línea, turno, producción total, porcentaje de desperdicio → inserta `PRODUCTION_RECORDED`.
  - **Defectos**: máquina, tipo de defecto, cantidad → inserta `DEFECT_RECORDED`.
- **Productos (`/productos`)**:
  - Listado con relaciones a línea y material.
  - Filtros por línea y material y búsqueda por texto (código/descripción).
  - Especificaciones opcionales **inyección** y **soplado** asociadas al producto.
  - Flujos de creación/edición/eliminación según acciones en `app/actions/productos.ts`.

### 4.3 Analítica y IA

- **Métricas de producción**: totales, promedio de desperdicio, eficiencia material aproximada (`100% − desperdicio medio`), conteo de registros con desperdicio por encima del umbral definido (5%).
- **Métricas de defectos**: totales, agregación por máquina y por tipo, detección de posible **pico** comparando ventanas de 7 días.
- **`POST /api/recommendations`**: exige usuario autenticado; valida el cuerpo con Zod; llama a Groq y devuelve texto de recomendaciones. Sin `GROQ_API_KEY`, el servicio informa que debe configurarse la variable.

### 4.4 Navegación y seguridad

- **Barra superior**: enlaces a Panel, Registros, Productos y botón de salida.
- **Middleware/proxy de sesión**: refresca la sesión de Supabase en las peticiones coincidentes con el matcher configurado (excluye estáticos e imágenes comunes).

---

## 5. Variables de entorno relevantes

| Variable | Rol |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) para el cliente |
| `GROQ_API_KEY` | Clave para el SDK de Groq (recomendaciones) |

---

## 6. Scripts npm

- `npm run dev` — servidor de desarrollo  
- `npm run build` / `npm run start` — compilación y producción  
- `npm run lint` — ESLint  

---

*Informe generado a partir del estado del repositorio Pbex. Para instrucciones de despliegue y SQL inicial, el README del proyecto sigue siendo la referencia operativa.*

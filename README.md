# Pbex - Sistema de Gestión de Producción

Aplicación web full-stack construida con Next.js (App Router) y TypeScript para registrar producción y defectos, almacenar eventos en Supabase y mostrar análisis con recomendaciones generadas por IA (Groq).

## Funcionalidades

- Autenticación con Supabase (registro e inicio de sesión).
- Registro diario de producción:
  - Línea de producción
  - Turno
  - Producción total
  - Porcentaje de desperdicio
- Registro de defectos de máquina:
  - Nombre de la máquina
  - Tipo de defecto
  - Cantidad
- Arquitectura basada en eventos en la tabla `eventos`.
- Panel de control con métricas y estadísticas.
- Servicio de análisis para eficiencia, desperdicio alto y picos de defectos.
- Recomendaciones con API de Groq.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Groq SDK

## Variables de entorno

Crea `/.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica
GROQ_API_KEY=tu_groq_api_key
# Solo servidor: panel /admin (listar/crear usuarios y roles). Nunca la expongas al cliente.
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
# Opcional, solo para el script seed:admin
BOOTSTRAP_ADMIN_EMAIL=admin@tuempresa.com
BOOTSTRAP_ADMIN_PASSWORD=una_clave_segura
```

### Primer administrador y gestión de usuarios

1. En Supabase: **Settings → API → service_role** (secreta).
2. Pon `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y reinicia `npm run dev`.
3. **Opción A — script (recomendado la primera vez)**  
   Define `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` en `.env.local` y ejecuta (Node 20+):

   ```bash
   npm run seed:admin
   ```

   Crea el usuario con `user_metadata.app_role = ADMIN` o, si el correo ya existe, lo deja en ADMIN y actualiza la contraseña.

4. **Opción B — a mano**  
   Crea el usuario en **Authentication → Users** y en **User metadata** añade: `{ "app_role": "ADMIN" }`.

5. Inicia sesión con ese usuario y abre **`/admin`**: desde ahí puedes **crear usuarios** y **cambiar roles** (`GERENTE`, `ENCARGADO_LINEA`, `VENTAS`, `ADMIN`) sin volver al dashboard de Supabase.

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta en SQL Editor, en orden: `supabase/migrations/001_eventos.sql`, `002_productos.sql` y `003_eventos_event_sourcing.sql` (este último renombra `tipo`→`type`, `created_at`→`timestamp` y amplía `eventos`).
3. Habilita Email/Password en Authentication.
4. Configura `Site URL` y `Redirect URLs`:
   - Local: `http://localhost:3000`
   - Producción: tu dominio de Vercel

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Despliegue en Vercel

1. Importa el repositorio desde GitHub en Vercel.
2. Agrega variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
3. Despliega y actualiza en Supabase las URLs de autenticación con el dominio final.

## Notas

- Los datos de producción y defectos se guardan como eventos (`type`):
  - `PRODUCTION_RECORDED`, `MERMA_RECORDED`, `DEFECT_RECORDED`, `MACHINE_FAILURE_RECORDED`, `ORDER_CREATED`, `ORDER_COMPLETED`
- Si quieres subir imágenes a la nube, la ruta recomendada es Supabase Storage (bucket + políticas RLS).

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
```

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el SQL de `supabase/migrations/001_eventos.sql` en SQL Editor.
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

- Los datos de producción y defectos se guardan como eventos:
  - `PRODUCTION_RECORDED`
  - `DEFECT_RECORDED`
- Si quieres subir imágenes a la nube, la ruta recomendada es Supabase Storage (bucket + políticas RLS).

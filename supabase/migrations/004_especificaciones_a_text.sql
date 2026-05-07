-- Si las tablas de especificación aún tienen numeric, conviértelas a text (como en 002 actualizado).
-- Seguro ejecutar varias veces: si ya son text, PostgreSQL puede fallar en ALTER; en ese caso omite este script.

alter table public.espec_inyeccion
  alter column peso_g_nominal type text using peso_g_nominal::text,
  alter column peso_g_tolerancia type text using peso_g_tolerancia::text,
  alter column diam_exterior_mm_nominal type text using diam_exterior_mm_nominal::text,
  alter column diam_exterior_mm_tolerancia type text using diam_exterior_mm_tolerancia::text,
  alter column diam_interior_mm_nominal type text using diam_interior_mm_nominal::text,
  alter column diam_interior_mm_tolerancia type text using diam_interior_mm_tolerancia::text,
  alter column alto_largo_mm_nominal type text using alto_largo_mm_nominal::text,
  alter column alto_largo_mm_tolerancia type text using alto_largo_mm_tolerancia::text,
  alter column ancho_mm_nominal type text using ancho_mm_nominal::text,
  alter column ancho_mm_tolerancia type text using ancho_mm_tolerancia::text,
  alter column espesor_pared_mm_nominal type text using espesor_pared_mm_nominal::text,
  alter column espesor_pared_mm_tolerancia type text using espesor_pared_mm_tolerancia::text,
  alter column espesor_preco_mm_nominal type text using espesor_preco_mm_nominal::text,
  alter column espesor_preco_mm_tolerancia type text using espesor_preco_mm_tolerancia::text,
  alter column diam_ext_sin_hilo_mm_nominal type text using diam_ext_sin_hilo_mm_nominal::text,
  alter column diam_ext_sin_hilo_mm_tolerancia type text using diam_ext_sin_hilo_mm_tolerancia::text;

alter table public.espec_soplado
  alter column peso_g type text using peso_g::text,
  alter column peso_tolerancia type text using peso_tolerancia::text,
  alter column diam_ext_boca_mm type text using diam_ext_boca_mm::text,
  alter column diam_ext_cuello_mm type text using diam_ext_cuello_mm::text,
  alter column diam_int_cuello_mm type text using diam_int_cuello_mm::text,
  alter column altura_boca_mm type text using altura_boca_mm::text;

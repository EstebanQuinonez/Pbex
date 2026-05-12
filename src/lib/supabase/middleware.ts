import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateRouteAccess, homePathForRole, parseAppRole } from "@/lib/auth/roles";

function copyCookiesTo(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, { path: "/" });
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        } catch {
          // En algunos runtimes la request cookie store no es mutable.
        }
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    // Evita romper el request completo por errores transitorios de auth.
  }

  const pathname = request.nextUrl.pathname;
  const access = evaluateRouteAccess(pathname, user);

  if (access === "login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    copyCookiesTo(supabaseResponse, redirectRes);
    return redirectRes;
  }

  if (access === "forbidden") {
    const target = request.nextUrl.clone();
    target.pathname = homePathForRole(parseAppRole(user));
    target.search = "";
    const redirectRes = NextResponse.redirect(target);
    copyCookiesTo(supabaseResponse, redirectRes);
    return redirectRes;
  }

  return supabaseResponse;
}

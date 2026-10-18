import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const DEMO_COOKIE = 'catalogai-demo';
const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

/**
 * Protege las rutas del catálogo cuando Supabase está configurado.
 * - Sin sesión → /auth/login?next=<ruta>
 * - Con sesión en /auth/login → /dashboard
 * - Modo demo (cookie) → sin login: solo hay datos simulados en el navegador.
 * La protección real de los datos es RLS; esto evita mostrar la app a quien no inició sesión.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const demo = request.cookies.get(DEMO_COOKIE)?.value === 'true';
  if (demo && !isPublic) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const login = request.nextUrl.clone();
    login.pathname = '/auth/login';
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(login, response);
  }
  if (user && pathname === '/auth/login') {
    const home = request.nextUrl.clone();
    home.pathname = '/dashboard';
    home.search = '';
    return redirectWithCookies(home, response);
  }
  return response;
}

function redirectWithCookies(target: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(target);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};

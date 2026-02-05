import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Obtenemos la cookie de sesión
  const session = request.cookies.get('session');
  
  // 2. Definimos rutas clave
  const path = request.nextUrl.pathname;
  const isLoginPage = path === '/admin/login';
  const isAdminRoute = path.startsWith('/admin');

  // CASO 1: Intenta entrar a una ruta protegida (/admin/...) SIN estar logueado
  if (isAdminRoute && !isLoginPage) {
    if (!session) {
      // Lo mandamos al login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // CASO 2: Intenta entrar al Login (/admin/login) PERO YA ESTÁ logueado
  if (isLoginPage && session) {
    // Lo mandamos directo al dashboard (para que no se loguee dos veces)
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Si no es ninguno de esos casos, deja pasar la petición normal
  return NextResponse.next();
}

// Configuración: Solo ejecutamos esto en rutas que empiecen con /admin
export const config = {
  matcher: ['/admin/:path*'],
};
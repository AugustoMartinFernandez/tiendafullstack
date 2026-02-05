import { authAdmin } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { idToken, remember } = await request.json();

    if (!idToken) {
      return NextResponse.json({ success: false, message: "Falta el ID Token" }, { status: 400 });
    }

    // 1. Definir duración de la sesión
    // 5 días por defecto, 14 días (máximo permitido por Firebase) si "Recordarme"
    const expiresIn = (remember ? 14 : 5) * 24 * 60 * 60 * 1000;

    // 2. Verificar el token y crear la cookie de sesión
    // Verificamos el token primero para asegurar que es válido
    await authAdmin.verifyIdToken(idToken, true);
    
    // Creamos la cookie de sesión
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    // 3. Establecer la cookie en el navegador
    const cookieStore = await cookies();
    
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge en segundos para la cookie
      httpOnly: true, // No accesible por JS del cliente (Seguridad XSS)
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en prod
      path: "/",
      sameSite: "lax", // Protege contra CSRF pero permite navegación normal
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[API Login] Error creando sesión:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo iniciar sesión" }, 
      { status: 401 }
    );
  }
}

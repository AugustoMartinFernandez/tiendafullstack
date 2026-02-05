// src/lib/actions/security.ts
"use server";

export async function verifyCaptcha(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  // Si no hay clave configurada (ej: desarrollo), permitimos pasar (o bloqueamos según tu preferencia)
  if (!secretKey) {
    console.warn("⚠️ RECAPTCHA_SECRET_KEY no configurada. Saltando verificación.");
    return { success: true };
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: "POST" }
    );
    
    const data = await response.json();

    // score: 0.0 (bot) - 1.0 (humano). 0.5 es un buen umbral por defecto.
    if (data.success && data.score >= 0.5) {
      return { success: true };
    } else {
      console.warn("Captcha score too low:", data.score);
      return { success: false, message: "Detectamos actividad inusual. Intenta más tarde." };
    }
  } catch (error) {
    console.error("Error verificando captcha:", error);
    return { success: false, message: "Error de conexión con el servicio de seguridad." };
  }
}

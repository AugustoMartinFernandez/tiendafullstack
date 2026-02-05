"use server";

/**
 * Valida un token de reCAPTCHA v2 (Checkbox "No soy un robot")
 * con el servidor de Google.
 */
export async function verifyRecaptcha(token: string): Promise<{
  success: boolean;
  message: string;
}> {
  // Validación básica del token
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      message: "Token de reCAPTCHA inválido o vacío.",
    };
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error("[RECAPTCHA] RECAPTCHA_SECRET_KEY no está configurada en .env.local");
    return {
      success: false,
      message: "Configuración de reCAPTCHA incompleta en el servidor.",
    };
  }

  try {
    // Llamada a Google reCAPTCHA API v2
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    // Manejo de errores de conexión
    if (!response.ok) {
      console.error(`[RECAPTCHA] Google API respondió con status ${response.status}`);
      return {
        success: false,
        message: "Error al validar reCAPTCHA. Intenta de nuevo.",
      };
    }

    const data = await response.json();

    // VALIDACIÓN PARA reCAPTCHA v2:
    // - v2 devuelve SOLO: { success: boolean, challenge_ts, hostname, error-codes? }
    // - v3 devuelve: { success, score, action, challenge_ts, hostname, error-codes? }
    // 
    // ⚠️ IMPORTANTE: Eliminamos cualquier lógica de score.
    // Para v2, simplemente validamos: data.success === true

    if (data.success === true) {
      return {
        success: true,
        message: "Validación de reCAPTCHA exitosa.",
      };
    }

    // Si success es false, Google rechazó el token
    const errorCodes = data["error-codes"] || [];
    const errorMessage =
      errorCodes.length > 0
        ? `Errores de reCAPTCHA: ${errorCodes.join(", ")}`
        : "reCAPTCHA rechazó la validación.";

    console.warn(`[RECAPTCHA] Validación fallida: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
    };
  } catch (error) {
    // Manejo de excepciones (timeout, red, etc.)
    console.error("[RECAPTCHA] Error durante la validación:", error);
    return {
      success: false,
      message: "Error de conexión al validar reCAPTCHA. Intenta de nuevo.",
    };
  }
}

// src/lib/errors.ts
export class AppError extends Error {
  constructor(public message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = "AppError";
  }
}

export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, "BUSINESS_ERROR", 400);
    this.name = "BusinessError";
  }
}

export class AuthError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
  }
}

// Helper para manejar errores en Server Actions de forma consistente
export function handleActionError(error: unknown) {
  // En desarrollo, logueamos todo a consola. En prod, esto iría a un servicio de agregación (ej: Datadog/Sentry)
  if (process.env.NODE_ENV === 'development') {
    console.error("Action Error:", error);
  }

  if (error instanceof AppError) {
    return { success: false, message: error.message, code: error.code };
  }

  if (error instanceof Error) {
    return { success: false, message: error.message, code: "UNKNOWN_ERROR" };
  }

  return { success: false, message: "Ocurrió un error inesperado.", code: "INTERNAL_SERVER_ERROR" };
}

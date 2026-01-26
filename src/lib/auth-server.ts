import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export async function requireAdmin() {
  const cookieStore = await cookies();

  // Firebase Hosting requiere estrictamente que la cookie se llame "__session"
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("Unauthorized: No session cookie found");
  }

  try {
    const adminAuth = getAdminAuth();

    // Verificamos la cookie y si fue revocada (checkRevoked: true)
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // VALIDACIÓN ESTRICTA: Solo rol 'admin' (Sin emails hardcodeados)
    if (decodedClaims.role !== "admin") {
      throw new Error("Forbidden: Insufficient permissions");
    }

    return decodedClaims;
  } catch (error) {
    console.error("Admin verification failed:", error);
    throw new Error("Unauthorized: Invalid session");
  }
}

export async function requireUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

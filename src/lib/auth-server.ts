import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export async function requireAdmin() {
  const cookieStore = await cookies();

  // Firebase Hosting usa __session, mantenemos compatibilidad local
  const sessionCookie =
    cookieStore.get("__session")?.value ||
    cookieStore.get("session")?.value;

  if (!sessionCookie) {
    throw new Error("Unauthorized: No session cookie found");
  }

  try {
    const adminAuth = getAdminAuth();

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    if (
      decodedClaims.role !== "admin" &&
      decodedClaims.email !== "mff061022@gmail.com"
    ) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    return decodedClaims;
  } catch {
    throw new Error("Unauthorized: Invalid session");
  }
}

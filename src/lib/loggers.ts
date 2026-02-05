// src/lib/logger.ts
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY";

export interface LogEntry {
  type: LogLevel;
  action: string;
  actorUid: string;
  actorRole: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Registra una actividad en la colección de auditoría.
 * Es "Fire and Forget" para no bloquear la respuesta al usuario.
 */
export async function logActivity(
  level: LogLevel,
  action: string,
  details: {
    actorUid?: string;
    actorRole?: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const db = getAdminDb();
    const entry: LogEntry = {
      type: level,
      action,
      actorUid: details.actorUid || "system",
      actorRole: details.actorRole || "unknown",
      targetId: details.targetId || null,
      metadata: details.metadata || {},
      createdAt: new Date().toISOString(),
    };

    // No usamos await para no penalizar la latencia de la request principal
    db.collection("audit_logs").add(entry).catch(err => 
      console.error("CRITICAL: Failed to write audit log", err)
    );
  } catch (error) {
    console.error("CRITICAL: Logger failed", error);
  }
}

// --- ADMIN: Obtener Logs ---
export async function getAuditLogs(limitCount = 50) {
  await requireAdmin();
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("audit_logs")
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
}
// --- NUEVO: Obtener Logs de Actividad de un Usuario Específico ---
export async function getUserActivityLogs(userId: string, limitCount = 20) {
  await requireAdmin();
  try {
    const db = getAdminDb();
    // Buscamos logs donde el actor sea el usuario (lo que hizo)
    const snapshot = await db.collection("audit_logs")
      .where("actorUid", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return [];
  }
}
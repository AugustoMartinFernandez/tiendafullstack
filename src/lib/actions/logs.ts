"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

export interface LogEntry {
  id: string;
  type: "INFO" | "WARN" | "ERROR" | "SECURITY";
  action: string;
  actorUid: string;
  actorRole: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export async function getAuditLogs(filters: { 
  type?: string;
  startDate?: string;
  limit?: number;
  cursorId?: string;
  direction?: 'next' | 'prev';
}) {
  await requireAdmin();
  
  try {
    const db = getAdminDb();
    let q = db.collection("audit_logs").orderBy("createdAt", "desc");

    // Filtro por Tipo
    if (filters.type && filters.type !== "ALL") {
      q = q.where("type", "==", filters.type);
    }

    // Filtro por Fecha (Desde)
    if (filters.startDate) {
      // Aseguramos formato ISO para comparar strings
      const start = new Date(filters.startDate).toISOString();
      q = q.where("createdAt", ">=", start);
    }

    const limit = filters.limit || 50;

    // Lógica de Paginación por Cursor
    if (filters.cursorId) {
      const cursorDoc = await db.collection("audit_logs").doc(filters.cursorId).get();
      if (cursorDoc.exists) {
        if (filters.direction === 'prev') {
           q = q.endBefore(cursorDoc).limitToLast(limit);
        } else {
           q = q.startAfter(cursorDoc).limit(limit);
        }
      } else {
         q = q.limit(limit); // Fallback si el cursor no existe
      }
    } else {
      q = q.limit(limit);
    }

    const snapshot = await q.get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LogEntry[];

    return {
      logs,
      firstId: logs.length > 0 ? logs[0].id : null,
      lastId: logs.length > 0 ? logs[logs.length - 1].id : null
    };
  } catch (error) {
    console.error("Error fetching logs:", error);
    return { logs: [], firstId: null, lastId: null };
  }
}

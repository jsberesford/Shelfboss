import { db } from "./db";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SUBMIT"
  | "APPROVE"
  | "RECEIVE"
  | "CLOSE"
  | "LOGIN"
  | "IMPORT"
  | "EXPORT"
  | "COUNT"
  | "USAGE";

export async function logAudit(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, unknown> | null
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId ?? null,
        details: details ?? undefined,
      },
    });
  } catch {
    // Audit log failures must never break the primary operation
    console.error("Failed to write audit log", { userId, action, entityType, entityId });
  }
}

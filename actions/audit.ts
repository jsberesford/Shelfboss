"use server";

import { db } from "@/lib/db";
import type { AuditLogWithUser } from "@/types";

export async function loadMoreAuditLogs(
  cursor: string,
  from?: string,
  to?: string
): Promise<{ logs: AuditLogWithUser[]; nextCursor: string | null }> {
  const logs = await db.auditLog.findMany({
    cursor: { id: cursor },
    skip: 1,
    take: 100,
    orderBy: { createdAt: "desc" },
    where: {
      createdAt: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to + "T23:59:59Z") }),
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const nextCursor = logs.length === 100 ? logs[logs.length - 1].id : null;

  return { logs, nextCursor };
}

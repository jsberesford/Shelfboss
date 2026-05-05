import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { AuditTable } from "@/components/admin/audit-table";

export const metadata: Metadata = { title: "Audit Log" };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const { from, to } = searchParams;

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Record of all significant system actions."
      />
      <AuditTable
        initialLogs={logs}
        initialCursor={nextCursor}
        from={from}
        to={to}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { AuditTable } from "@/components/admin/audit-table";

export const metadata: Metadata = { title: "Audit Log" };

export default async function AuditLogPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Record of all significant system actions."
      />
      <AuditTable logs={logs} />
    </div>
  );
}

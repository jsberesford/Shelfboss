import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { VendorTable } from "@/components/admin/vendor-table";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const session = await auth();
  const role = session?.user?.role as Role;

  const vendors = await db.vendor.findMany({
    include: { _count: { select: { items: true, orders: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description={`${vendors.filter((v) => v.active).length} active vendors`} />
      <VendorTable vendors={vendors} role={role} />
    </div>
  );
}

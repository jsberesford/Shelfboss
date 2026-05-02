import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { OrderTable } from "@/components/admin/order-table";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await auth();
  const role = session?.user?.role as Role;

  const orders = await db.purchaseOrder.findMany({
    include: {
      vendor: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        include: { item: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description={`${orders.length} orders`}
      />
      <OrderTable orders={orders} role={role} />
    </div>
  );
}

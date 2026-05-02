import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { ReceiveOrderFlow } from "@/components/mobile/receive-order-flow";

export const metadata: Metadata = { title: "Receive Order" };

export default async function ReceivePage() {
  const orders = await db.purchaseOrder.findMany({
    where: { status: "ORDERED" },
    include: {
      vendor: true,
      items: { include: { item: true } },
    },
    orderBy: { orderedAt: "asc" },
  });

  return (
    <div>
      <MobileHeader title="Receive Order" subtitle="Confirm incoming shipments" />
      <ReceiveOrderFlow orders={orders} />
    </div>
  );
}

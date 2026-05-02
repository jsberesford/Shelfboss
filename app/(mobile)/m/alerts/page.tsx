import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { AlertList } from "@/components/mobile/alert-list";
import { getStockStatus } from "@/types";

export const metadata: Metadata = { title: "Low Stock Alerts" };

export default async function AlertsPage() {
  const items = await db.inventoryItem.findMany({
    where: { active: true },
    include: { location: true },
    orderBy: [{ quantity: "asc" }],
  });

  const alertItems = items
    .filter((i) => getStockStatus(i) !== "ok")
    .sort((a, b) => {
      const sa = getStockStatus(a);
      const sb = getStockStatus(b);
      if (sa === "critical" && sb !== "critical") return -1;
      if (sb === "critical" && sa !== "critical") return 1;
      return a.quantity - b.quantity;
    });

  return (
    <div>
      <MobileHeader title="Low Stock" subtitle={`${alertItems.length} item${alertItems.length !== 1 ? "s" : ""} need attention`} />
      <AlertList items={alertItems} />
    </div>
  );
}

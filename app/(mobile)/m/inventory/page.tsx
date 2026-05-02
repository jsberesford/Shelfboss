import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { MobileInventoryList } from "@/components/mobile/inventory-list";

export const metadata: Metadata = { title: "Inventory" };

export default async function MobileInventoryPage() {
  const items = await db.inventoryItem.findMany({
    where: { active: true },
    include: { location: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <MobileHeader title="Inventory" />
      <MobileInventoryList items={items} />
    </div>
  );
}

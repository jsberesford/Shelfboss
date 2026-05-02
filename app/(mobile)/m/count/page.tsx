import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { CountFlow } from "@/components/mobile/count-flow";

export const metadata: Metadata = { title: "Stock Count" };

export default async function CountPage() {
  const items = await db.inventoryItem.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      unit: true,
      quantity: true,
      parLevel: true,
      reorderPoint: true,
      location: { select: { name: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <MobileHeader title="Stock Count" subtitle="Tap to update quantities" />
      <CountFlow items={items} />
    </div>
  );
}

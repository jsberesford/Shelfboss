import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { UsageForm } from "@/components/mobile/usage-form";

export const metadata: Metadata = { title: "Log Usage" };

export default async function UsagePage() {
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
      <MobileHeader title="Log Usage" subtitle="Record item consumption" />
      <UsageForm items={items} />
    </div>
  );
}

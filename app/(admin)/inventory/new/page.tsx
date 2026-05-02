import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryForm } from "@/components/admin/inventory-form";

export const metadata: Metadata = { title: "Add Inventory Item" };

export default async function NewInventoryPage() {
  const [locations, vendors, existingItems] = await Promise.all([
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.inventoryItem.findMany({ select: { sku: true } }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Inventory Item"
        description="Add a new item to the inventory system."
      />
      <InventoryForm
        locations={locations}
        vendors={vendors}
        existingSkus={existingItems.map((i) => i.sku)}
      />
    </div>
  );
}

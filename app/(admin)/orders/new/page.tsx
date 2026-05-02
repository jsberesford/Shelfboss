import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { OrderForm } from "@/components/admin/order-form";

export const metadata: Metadata = { title: "New Order" };

export default async function NewOrderPage() {
  const [vendors, items] = await Promise.all([
    db.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.inventoryItem.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="New Purchase Order"
        description="Create a draft order to send to a vendor."
      />
      <OrderForm vendors={vendors} items={items} />
    </div>
  );
}

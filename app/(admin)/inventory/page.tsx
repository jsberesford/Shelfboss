import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTable } from "@/components/admin/inventory-table";
import { CsvImport } from "@/components/admin/csv-import";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const session = await getSession();
  const role = session?.user?.role as Role;

  const items = await db.inventoryItem.findMany({
    where: { active: true },
    include: { location: true, vendor: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const canImport = role === "SUPER_ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${items.length} active items`}
      >
        {canImport && (
          <div className="flex gap-2">
            <CsvImport />
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </PageHeader>

      <InventoryTable items={items} role={role} />
    </div>
  );
}

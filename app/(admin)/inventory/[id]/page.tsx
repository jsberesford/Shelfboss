import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryForm } from "@/components/admin/inventory-form";
import { StockStatusBadge } from "@/components/admin/stock-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Role } from "@prisma/client";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const item = await db.inventoryItem.findUnique({ where: { id: params.id }, select: { name: true } });
  return { title: item?.name ?? "Inventory Item" } satisfies Metadata;
}

export default async function InventoryItemPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const role = session?.user?.role as Role;

  const [item, locations, vendors, recentCounts] = await Promise.all([
    db.inventoryItem.findUnique({
      where: { id: params.id, active: true },
      include: { location: true, vendor: true },
    }),
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.stockCount.findMany({
      where: { itemId: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { countedAt: "desc" },
      take: 10,
    }),
  ]);

  if (!item) notFound();

  const canEdit = role === "SUPER_ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={item.name}
        description={`SKU: ${item.sku}`}
      >
        <StockStatusBadge
          quantity={item.quantity}
          parLevel={item.parLevel}
          reorderPoint={item.reorderPoint}
        />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                <InventoryForm item={item} locations={locations} vendors={vendors} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Category", item.category],
                    ["Unit", item.unit],
                    ["Par Level", `${item.parLevel} ${item.unit}`],
                    ["Reorder Point", `${item.reorderPoint} ${item.unit}`],
                    ["Current Qty", `${item.quantity} ${item.unit}`],
                    ["Cost Per Unit", formatCurrency(Number(item.costPerUnit))],
                    ["Location", item.location?.name ?? "—"],
                    ["Vendor", item.vendor?.name ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-medium text-muted-foreground">{label}</dt>
                      <dd className="mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
                {item.notes && (
                  <div className="mt-4">
                    <dt className="font-medium text-muted-foreground text-sm">Notes</dt>
                    <dd className="mt-1 text-sm">{item.notes}</dd>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Count History</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No counts recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentCounts.map((count) => (
                    <li key={count.id} className="text-sm border-b last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{count.quantity} {item.unit}</span>
                        <span className="text-muted-foreground">{formatDateTime(count.countedAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {count.user.name ?? count.user.email}
                      </p>
                      {count.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{count.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valuation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Cost</span>
                <span>{formatCurrency(Number(item.costPerUnit))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Qty</span>
                <span>{item.quantity} {item.unit}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Total Value</span>
                <span>{formatCurrency(item.quantity * Number(item.costPerUnit))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

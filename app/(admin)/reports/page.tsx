import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryValuationReport } from "@/components/admin/reports/inventory-valuation";
import { UsageReport } from "@/components/admin/reports/usage-report";
import { OrderSpendReport } from "@/components/admin/reports/order-spend";
import { getStockStatus } from "@/types";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; tab?: string };
}) {
  const { from, to } = searchParams;

  const usageWhere =
    from || to
      ? {
          loggedAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to + "T23:59:59Z") }),
          },
        }
      : undefined;

  const orderWhere: Record<string, unknown> = {
    status: { in: ["RECEIVED", "CLOSED"] },
  };
  if (from || to) {
    orderWhere.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + "T23:59:59Z") }),
    };
  }

  const [items, usageLogs, orders] = await Promise.all([
    db.inventoryItem.findMany({
      where: { active: true },
      include: { vendor: true },
      orderBy: { category: "asc" },
    }),
    db.usageLog.findMany({
      where: usageWhere,
      orderBy: { loggedAt: "desc" },
      take: 500,
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.purchaseOrder.findMany({
      where: orderWhere,
      include: { vendor: true, items: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const valuationRows = items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    quantity: item.quantity,
    costPerUnit: Number(item.costPerUnit),
    totalValue: item.quantity * Number(item.costPerUnit),
    status: getStockStatus(item),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Inventory analytics and purchase history" />

      <Tabs defaultValue="valuation">
        <TabsList>
          <TabsTrigger value="valuation">Inventory Valuation</TabsTrigger>
          <TabsTrigger value="usage">Usage Log</TabsTrigger>
          <TabsTrigger value="spend">Order Spend</TabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="mt-6">
          <InventoryValuationReport rows={valuationRows} />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <UsageReport logs={usageLogs} from={from} to={to} />
        </TabsContent>

        <TabsContent value="spend" className="mt-6">
          <OrderSpendReport orders={orders} from={from} to={to} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

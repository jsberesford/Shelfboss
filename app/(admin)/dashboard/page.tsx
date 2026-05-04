import type { Metadata } from "next";
import Link from "next/link";
import { Package, AlertTriangle, ShoppingCart, DollarSign } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/admin/stats-card";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { LowStockAlert } from "@/components/admin/low-stock-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItemWithRelations, AuditLogWithUser } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();

  const [items, pendingOrders, recentActivity] = await Promise.all([
    db.inventoryItem.findMany({
      where: { active: true },
      include: { location: true, vendor: true },
    }),
    db.purchaseOrder.count({
      where: { status: { in: ["SUBMITTED", "APPROVED", "ORDERED"] } },
    }),
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const lowStockItems = (items as InventoryItemWithRelations[]).filter(
    (i) => i.quantity < i.parLevel
  );
  const criticalItems = lowStockItems.filter((i) => i.quantity <= i.reorderPoint);
  const totalValue = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.costPerUnit),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${session?.user?.name?.split(" ")[0] ?? "there"}`}
        description="Here's what's happening at Premium Food Service today."
      >
        <Button asChild>
          <Link href="/inventory/new">Add Item</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={items.length}
          description="Active inventory items"
          icon={Package}
          iconClassName="bg-blue-500/10"
        />
        <StatsCard
          title="Low Stock"
          value={lowStockItems.length}
          description={`${criticalItems.length} critical`}
          icon={AlertTriangle}
          iconClassName={criticalItems.length > 0 ? "bg-red-100" : "bg-amber-100"}
        />
        <StatsCard
          title="Pending Orders"
          value={pendingOrders}
          description="Awaiting action"
          icon={ShoppingCart}
          iconClassName="bg-violet-500/10"
        />
        <StatsCard
          title="Inventory Value"
          value={formatCurrency(totalValue)}
          description="At current cost"
          icon={DollarSign}
          iconClassName="bg-green-500/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            {lowStockItems.length > 5 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory?filter=low">View all ({lowStockItems.length})</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <LowStockAlert items={(lowStockItems as InventoryItemWithRelations[]).slice(0, 8)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={recentActivity as AuditLogWithUser[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

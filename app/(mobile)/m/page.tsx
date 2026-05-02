import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStockStatus } from "@/types";
import { ClipboardList, ShoppingBag, TriangleAlert, Minus, Package2 } from "lucide-react";
import { MobileHeader } from "@/components/mobile/mobile-header";

export const metadata: Metadata = { title: "Home" };

export default async function MobileHomePage() {
  const session = await auth();

  const [allItems, pendingOrdersCount] = await Promise.all([
    db.inventoryItem.findMany({
      where: { active: true },
      select: { quantity: true, parLevel: true, reorderPoint: true },
    }),
    db.purchaseOrder.count({ where: { status: "ORDERED" } }),
  ]);

  const critical = allItems.filter((i) => getStockStatus(i) === "critical").length;
  const low = allItems.filter((i) => getStockStatus(i) === "low").length;

  const quickActions = [
    {
      href: "/m/count",
      icon: ClipboardList,
      label: "Quick Count",
      description: "Submit a stock count",
      color: "bg-blue-500",
    },
    {
      href: "/m/receive",
      icon: ShoppingBag,
      label: "Receive Order",
      description: pendingOrdersCount > 0 ? `${pendingOrdersCount} order${pendingOrdersCount > 1 ? "s" : ""} pending` : "No pending orders",
      color: "bg-violet-500",
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      href: "/m/usage",
      icon: Minus,
      label: "Log Usage",
      description: "Record consumption",
      color: "bg-orange-500",
    },
    {
      href: "/m/alerts",
      icon: TriangleAlert,
      label: "Low Stock",
      description: critical > 0 ? `${critical} critical, ${low} low` : low > 0 ? `${low} items below par` : "All items OK",
      color: critical > 0 ? "bg-red-500" : low > 0 ? "bg-amber-500" : "bg-green-500",
      badge: critical + low > 0 ? critical + low : undefined,
    },
  ];

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="flex flex-col min-h-full">
      <MobileHeader
        title="PremiumSupply"
        subtitle={firstName ? `Hi, ${firstName}` : "Welcome"}
        showSignOut
      />

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="active:scale-95 transition-transform touch-none h-full">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-3 ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    {action.badge !== undefined && (
                      <Badge variant="destructive" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-base">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">All Inventory</p>
              <p className="text-xs text-muted-foreground">Browse and search all items</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/m/inventory">View →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

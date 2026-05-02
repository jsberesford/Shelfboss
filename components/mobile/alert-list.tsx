import Link from "next/link";
import { getStockStatus } from "@/types";
import { cn } from "@/lib/utils";
import { TriangleAlert, Package } from "lucide-react";
import type { InventoryItem, Location } from "@prisma/client";

type ItemWithLocation = InventoryItem & { location: Location | null };

interface AlertListProps { items: ItemWithLocation[] }

export function AlertList({ items }: AlertListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
        <div className="rounded-full bg-green-100 p-6">
          <Package className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">All Items OK</h2>
        <p className="text-sm text-muted-foreground">
          No items are below par level right now.
        </p>
      </div>
    );
  }

  const critical = items.filter((i) => getStockStatus(i) === "critical");
  const low = items.filter((i) => getStockStatus(i) === "low");

  return (
    <div className="p-4 space-y-6">
      {critical.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600">Critical — At or Below Reorder Point</h2>
          </div>
          <div className="space-y-2">
            {critical.map((item) => (
              <AlertCard key={item.id} item={item} status="critical" />
            ))}
          </div>
        </section>
      )}

      {low.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-600">Low — Below Par Level</h2>
          </div>
          <div className="space-y-2">
            {low.map((item) => (
              <AlertCard key={item.id} item={item} status="low" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AlertCard({ item, status }: { item: ItemWithLocation; status: "critical" | "low" }) {
  const pct = Math.round((item.quantity / item.parLevel) * 100);

  return (
    <Link href={`/m/count`}>
      <div className={cn(
        "rounded-xl border p-4 space-y-2",
        status === "critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{item.name}</p>
            {item.location && (
              <p className="text-xs text-muted-foreground">{item.location.name}</p>
            )}
          </div>
          <span className={cn(
            "shrink-0 text-xs font-bold px-2 py-0.5 rounded-full",
            status === "critical" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
          )}>
            {status === "critical" ? "CRITICAL" : "LOW"}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {item.quantity} / {item.parLevel} {item.unit}
            </span>
            <span className={status === "critical" ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
              {pct}% of par
            </span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden border">
            <div
              className={cn("h-full rounded-full transition-all", status === "critical" ? "bg-red-500" : "bg-amber-500")}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Reorder at: {item.reorderPoint} {item.unit} · Tap to count
        </p>
      </div>
    </Link>
  );
}

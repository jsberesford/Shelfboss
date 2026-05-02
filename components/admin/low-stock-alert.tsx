import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStockStatus } from "@/types";
import type { InventoryItemWithRelations } from "@/types";

interface LowStockAlertProps {
  items: InventoryItemWithRelations[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">All items are at or above par level</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const status = getStockStatus(item);
        return (
          <li key={item.id}>
            <Link
              href={`/inventory/${item.id}`}
              className="flex items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle
                  className={status === "critical" ? "h-4 w-4 text-red-500 shrink-0" : "h-4 w-4 text-amber-500 shrink-0"}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit} · Par: {item.parLevel}
                  </p>
                </div>
              </div>
              <Badge variant={status === "critical" ? "critical" : "warning"} className="shrink-0 ml-2">
                {status === "critical" ? "Critical" : "Low"}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

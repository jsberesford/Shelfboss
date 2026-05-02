import { Badge } from "@/components/ui/badge";
import { getStockStatus } from "@/types";

interface StockStatusBadgeProps {
  quantity: number;
  parLevel: number;
  reorderPoint: number;
  showLabel?: boolean;
}

export function StockStatusBadge({ quantity, parLevel, reorderPoint, showLabel = true }: StockStatusBadgeProps) {
  const status = getStockStatus({ quantity, parLevel, reorderPoint });

  if (status === "critical") {
    return <Badge variant="critical">{showLabel ? "Critical" : "●"}</Badge>;
  }
  if (status === "low") {
    return <Badge variant="warning">{showLabel ? "Low" : "●"}</Badge>;
  }
  return <Badge variant="success">{showLabel ? "In Stock" : "●"}</Badge>;
}

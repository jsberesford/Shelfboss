import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@prisma/client";

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "critical" | "info" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "info" },
  APPROVED: { label: "Approved", variant: "warning" },
  ORDERED: { label: "Ordered", variant: "warning" },
  RECEIVED: { label: "Received", variant: "success" },
  CLOSED: { label: "Closed", variant: "outline" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

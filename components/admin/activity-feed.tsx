import { formatDateTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AuditLogWithUser } from "@/types";

interface ActivityFeedProps {
  items: AuditLogWithUser[];
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  SUBMIT: "submitted",
  APPROVE: "approved",
  RECEIVE: "received",
  CLOSE: "closed",
  COUNT: "counted stock for",
  USAGE: "logged usage for",
  IMPORT: "imported",
  EXPORT: "exported",
};

const ENTITY_LABELS: Record<string, string> = {
  InventoryItem: "inventory item",
  PurchaseOrder: "purchase order",
  Vendor: "vendor",
  User: "user",
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((entry) => {
        const initials = entry.user.name
          ? entry.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : entry.user.email?.[0].toUpperCase() ?? "?";

        const actionLabel = ACTION_LABELS[entry.action] ?? entry.action.toLowerCase();
        const entityLabel = ENTITY_LABELS[entry.entityType] ?? entry.entityType;

        return (
          <li key={entry.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{entry.user.name ?? entry.user.email}</span>{" "}
                <span className="text-muted-foreground">{actionLabel} a {entityLabel}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(entry.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

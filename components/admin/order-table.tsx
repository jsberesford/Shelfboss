"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "./order-status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { approveOrder, submitOrder, markOrdered } from "@/actions/orders";
import { toast } from "sonner";
import { Search, Plus, ChevronRight } from "lucide-react";
import type { PurchaseOrderWithRelations } from "@/types";
import type { Role, OrderStatus } from "@prisma/client";

interface OrderTableProps {
  orders: PurchaseOrderWithRelations[];
  role: Role;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "ORDERED", label: "Ordered" },
  { value: "RECEIVED", label: "Received" },
  { value: "CLOSED", label: "Closed" },
];

export function OrderTable({ orders, role }: OrderTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.vendor.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  function orderTotal(order: PurchaseOrderWithRelations) {
    return order.items.reduce((sum, i) => sum + i.quantity * Number(i.unitCost), 0);
  }

  const canApprove = role === "SUPER_ADMIN" || role === "MANAGER";
  const canCreate = role === "SUPER_ADMIN" || role === "MANAGER";

  function handleAction(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        toast.success("Order updated");
        router.refresh();
      } catch {
        toast.error("Failed to update order");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order # or vendor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expected</TableHead>
              {canApprove && <TableHead className="w-[120px]">Actions</TableHead>}
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.vendor.name}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell className="text-right">{order.items.length}</TableCell>
                  <TableCell className="text-right">{formatCurrency(orderTotal(order))}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {order.expectedDate ? formatDate(order.expectedDate) : "—"}
                  </TableCell>
                  {canApprove && (
                    <TableCell>
                      {order.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleAction(() => approveOrder(order.id))}
                        >
                          Approve
                        </Button>
                      )}
                      {order.status === "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleAction(() => markOrdered(order.id))}
                        >
                          Mark Ordered
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {orders.length} orders
      </p>
    </div>
  );
}

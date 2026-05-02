"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { receiveOrder } from "@/actions/orders";
import { formatDate } from "@/lib/utils";
import { ChevronRight, Check, Package } from "lucide-react";
import type { PurchaseOrder, PurchaseOrderItem, InventoryItem, Vendor } from "@prisma/client";

type OrderWithItems = PurchaseOrder & {
  vendor: Vendor;
  items: (PurchaseOrderItem & { item: InventoryItem })[];
};

interface ReceiveOrderFlowProps { orders: OrderWithItems[] }

export function ReceiveOrderFlow({ orders }: ReceiveOrderFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});
  const [discrepancyNotes, setDiscrepancyNotes] = useState<Record<string, string>>({});

  function selectOrder(order: OrderWithItems) {
    setSelectedOrder(order);
    setReceivedQtys(
      Object.fromEntries(order.items.map((i) => [i.id, String(i.quantity)]))
    );
    setDiscrepancyNotes({});
  }

  function handleConfirm() {
    if (!selectedOrder) return;

    startTransition(async () => {
      try {
        await receiveOrder(
          selectedOrder.id,
          selectedOrder.items.map((line) => ({
            orderItemId: line.id,
            receivedQty: parseFloat(receivedQtys[line.id] ?? String(line.quantity)) || 0,
            discrepancyNote: discrepancyNotes[line.id] || undefined,
          }))
        );
        toast.success(`${selectedOrder.orderNumber} received`);
        setSelectedOrder(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to receive order");
      }
    });
  }

  if (selectedOrder) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-7rem)]">
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{selectedOrder.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.vendor.name}</p>
            </div>
            <Badge variant="warning">Receiving</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Adjust quantities if anything is short-shipped or damaged. Add a note for any discrepancy.
          </p>

          {selectedOrder.items.map((line) => {
            const recvd = receivedQtys[line.id] ?? String(line.quantity);
            const hasDiscrepancy = parseFloat(recvd) !== line.quantity;

            return (
              <div key={line.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{line.item.name}</p>
                    <p className="text-xs text-muted-foreground">{line.item.sku}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Ordered: {line.quantity} {line.item.unit}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Received ({line.item.unit})
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={recvd}
                    onChange={(e) =>
                      setReceivedQtys((prev) => ({ ...prev, [line.id]: e.target.value }))
                    }
                    className={`h-12 text-lg font-semibold text-center ${hasDiscrepancy ? "border-amber-400" : ""}`}
                  />
                </div>

                {hasDiscrepancy && (
                  <div>
                    <label className="text-xs text-amber-600 font-medium block mb-1">
                      Discrepancy note *
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Short-shipped, damaged, incorrect item…"
                      value={discrepancyNotes[line.id] ?? ""}
                      onChange={(e) =>
                        setDiscrepancyNotes((prev) => ({ ...prev, [line.id]: e.target.value }))
                      }
                      className="border-amber-400"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t space-y-2">
          <Button size="xl" className="w-full" onClick={handleConfirm} disabled={isPending}>
            <Check className="h-5 w-5" />
            {isPending ? "Confirming…" : "Confirm Receipt"}
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => setSelectedOrder(null)}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">No Orders Pending</h2>
        <p className="text-sm text-muted-foreground">
          Orders will appear here once they have been marked as ordered by your manager.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">{orders.length} order{orders.length > 1 ? "s" : ""} ready to receive</p>
      {orders.map((order) => (
        <button
          key={order.id}
          className="w-full text-left rounded-xl border p-4 active:bg-muted transition-colors"
          onClick={() => selectOrder(order)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{order.vendor.name}</p>
              <p className="text-xs text-muted-foreground">
                {order.items.length} items · Ordered {formatDate(order.orderedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">Ordered</Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  submitOrder, approveOrder, markOrdered, receiveOrder, closeOrder, deleteOrderDraft,
} from "@/actions/orders";
import type { PurchaseOrderWithRelations } from "@/types";
import type { Role } from "@prisma/client";

interface OrderActionsProps {
  order: PurchaseOrderWithRelations;
  role: Role;
}

export function OrderActions({ order, role }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canManage = role === "SUPER_ADMIN" || role === "MANAGER";

  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>(
    Object.fromEntries(order.items.map((i) => [i.id, String(i.quantity)]))
  );
  const [discrepancyNotes, setDiscrepancyNotes] = useState<Record<string, string>>({});

  function act(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        toast.success("Order updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update order");
      }
    });
  }

  if (order.status === "DRAFT" && canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button disabled={isPending} onClick={() => act(() => submitOrder(order.id))}>
            Submit for Approval
          </Button>
          <ConfirmDialog
            trigger={<Button variant="destructive" disabled={isPending}>Delete Draft</Button>}
            title="Delete Draft Order"
            description="This will permanently delete this draft. Are you sure?"
            confirmLabel="Delete"
            destructive
            onConfirm={() => act(async () => { await deleteOrderDraft(order.id); router.push("/orders"); })}
          />
        </CardContent>
      </Card>
    );
  }

  if (order.status === "SUBMITTED" && canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button disabled={isPending} onClick={() => act(() => approveOrder(order.id))}>
            Approve Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "APPROVED" && canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button disabled={isPending} onClick={() => act(() => markOrdered(order.id))}>
            Mark as Ordered
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "ORDERED") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receive Shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the actual quantities received. Flag any discrepancies.
          </p>
          {order.items.map((line) => (
            <div key={line.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{line.item.name}</p>
                <span className="text-xs text-muted-foreground">Ordered: {line.quantity} {line.item.unit}</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Received qty</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receivedQtys[line.id] ?? line.quantity}
                    onChange={(e) =>
                      setReceivedQtys((prev) => ({ ...prev, [line.id]: e.target.value }))
                    }
                  />
                </div>
              </div>
              {parseFloat(receivedQtys[line.id] ?? String(line.quantity)) !== line.quantity && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Discrepancy note *</label>
                  <Textarea
                    rows={2}
                    placeholder="Explain the discrepancy…"
                    value={discrepancyNotes[line.id] ?? ""}
                    onChange={(e) =>
                      setDiscrepancyNotes((prev) => ({ ...prev, [line.id]: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
          ))}
          <Button
            disabled={isPending}
            onClick={() =>
              act(() =>
                receiveOrder(
                  order.id,
                  order.items.map((line) => ({
                    orderItemId: line.id,
                    receivedQty: parseFloat(receivedQtys[line.id] ?? String(line.quantity)) || 0,
                    discrepancyNote: discrepancyNotes[line.id] || undefined,
                  }))
                )
              )
            }
          >
            Confirm Receipt
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "RECEIVED" && canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button disabled={isPending} onClick={() => act(() => closeOrder(order.id))}>
            Close Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

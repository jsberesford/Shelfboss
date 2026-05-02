"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";
import { generateOrderNumber } from "@/lib/utils";
import type { OrderFormData } from "@/types";
import type { Role } from "@prisma/client";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function createOrder(data: OrderFormData) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:create");

  const count = await db.purchaseOrder.count();
  const orderNumber = generateOrderNumber(count);

  const order = await db.purchaseOrder.create({
    data: {
      orderNumber,
      vendorId: data.vendorId,
      createdById: session.user.id,
      notes: data.notes ?? null,
      expectedDate: data.expectedDate ?? null,
      items: {
        create: data.items.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
    include: { items: true },
  });

  await logAudit(session.user.id, "CREATE", "PurchaseOrder", order.id, {
    orderNumber,
    vendorId: data.vendorId,
  });

  revalidatePath("/orders");
  return order;
}

export async function submitOrder(orderId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:submit");

  const order = await db.purchaseOrder.update({
    where: { id: orderId, status: "DRAFT" },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await logAudit(session.user.id, "SUBMIT", "PurchaseOrder", orderId, {});
  revalidatePath("/orders");
  return order;
}

export async function approveOrder(orderId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:approve");

  const order = await db.purchaseOrder.update({
    where: { id: orderId, status: "SUBMITTED" },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  await logAudit(session.user.id, "APPROVE", "PurchaseOrder", orderId, {});
  revalidatePath("/orders");
  return order;
}

export async function markOrdered(orderId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:approve");

  const order = await db.purchaseOrder.update({
    where: { id: orderId, status: "APPROVED" },
    data: { status: "ORDERED", orderedAt: new Date() },
  });

  await logAudit(session.user.id, "UPDATE", "PurchaseOrder", orderId, { status: "ORDERED" });
  revalidatePath("/orders");
  return order;
}

export async function receiveOrder(
  orderId: string,
  receivedItems: { orderItemId: string; receivedQty: number; discrepancyNote?: string }[]
) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:receive");

  const hasDiscrepancies = receivedItems.some((ri) => ri.discrepancyNote);

  await db.$transaction(async (tx) => {
    for (const ri of receivedItems) {
      const orderItem = await tx.purchaseOrderItem.findUnique({
        where: { id: ri.orderItemId },
        include: { item: true },
      });
      if (!orderItem) continue;

      await tx.purchaseOrderItem.update({
        where: { id: ri.orderItemId },
        data: {
          receivedQty: ri.receivedQty,
          discrepancyNote: ri.discrepancyNote ?? null,
        },
      });

      await tx.inventoryItem.update({
        where: { id: orderItem.itemId },
        data: { quantity: { increment: ri.receivedQty } },
      });
    }

    await tx.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: hasDiscrepancies ? "RECEIVED" : "RECEIVED",
        receivedAt: new Date(),
      },
    });
  });

  await logAudit(session.user.id, "RECEIVE", "PurchaseOrder", orderId, {
    hasDiscrepancies,
    itemCount: receivedItems.length,
  });

  revalidatePath("/orders");
  revalidatePath("/inventory");
  revalidatePath("/m/receive");
}

export async function closeOrder(orderId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:close");

  const order = await db.purchaseOrder.update({
    where: { id: orderId, status: "RECEIVED" },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await logAudit(session.user.id, "CLOSE", "PurchaseOrder", orderId, {});
  revalidatePath("/orders");
  return order;
}

export async function deleteOrderDraft(orderId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "orders:create");

  await db.purchaseOrder.delete({ where: { id: orderId, status: "DRAFT" } });
  await logAudit(session.user.id, "DELETE", "PurchaseOrder", orderId, {});
  revalidatePath("/orders");
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function logUsage(itemId: string, quantity: number, notes?: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "usage:log");

  const item = await db.inventoryItem.findUnique({
    where: { id: itemId },
    select: { quantity: true, name: true },
  });

  if (!item) throw new Error("Item not found");
  if (item.quantity < quantity) throw new Error(`Insufficient stock. Current quantity: ${item.quantity}`);

  const newQuantity = item.quantity - quantity;

  const [usageLog] = await db.$transaction([
    db.usageLog.create({
      data: {
        itemId,
        userId: session.user.id,
        quantity,
        notes: notes ?? null,
      },
    }),
    db.inventoryItem.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    }),
  ]);

  await logAudit(session.user.id, "USAGE", "InventoryItem", itemId, { quantity, newQuantity });

  revalidatePath("/inventory");
  revalidatePath("/m");
  revalidatePath("/m/usage");

  return usageLog;
}

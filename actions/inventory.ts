"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";
import type { InventoryItemFormData } from "@/types";
import type { Role } from "@prisma/client";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function createInventoryItem(data: InventoryItemFormData) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "inventory:create");

  const item = await db.inventoryItem.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unit: data.unit,
      parLevel: data.parLevel,
      reorderPoint: data.reorderPoint,
      quantity: data.quantity,
      costPerUnit: data.costPerUnit,
      notes: data.notes ?? null,
      locationId: data.locationId || null,
      vendorId: data.vendorId || null,
    },
  });

  await logAudit(session.user.id, "CREATE", "InventoryItem", item.id, {
    name: item.name,
    sku: item.sku,
  });

  revalidatePath("/inventory");
  return item;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItemFormData>) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "inventory:update");

  const item = await db.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.parLevel !== undefined && { parLevel: data.parLevel }),
      ...(data.reorderPoint !== undefined && { reorderPoint: data.reorderPoint }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.costPerUnit !== undefined && { costPerUnit: data.costPerUnit }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.locationId !== undefined && { locationId: data.locationId || null }),
      ...(data.vendorId !== undefined && { vendorId: data.vendorId || null }),
    },
  });

  await logAudit(session.user.id, "UPDATE", "InventoryItem", item.id, { fields: Object.keys(data) });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  return item;
}

export async function deleteInventoryItem(id: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "inventory:delete");

  const item = await db.inventoryItem.update({
    where: { id },
    data: { active: false },
  });

  await logAudit(session.user.id, "DELETE", "InventoryItem", id, { name: item.name });

  revalidatePath("/inventory");
  return item;
}

export async function submitStockCount(itemId: string, quantity: number, notes?: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "count:submit");

  const [count] = await db.$transaction([
    db.stockCount.create({
      data: {
        itemId,
        userId: session.user.id,
        quantity,
        notes: notes ?? null,
      },
    }),
    db.inventoryItem.update({
      where: { id: itemId },
      data: { quantity },
    }),
  ]);

  await logAudit(session.user.id, "COUNT", "InventoryItem", itemId, { quantity });

  revalidatePath("/inventory");
  revalidatePath("/m");
  revalidatePath("/m/count");
  return count;
}

export async function importInventoryItems(
  rows: Array<{
    name: string;
    sku: string;
    category: string;
    unit: string;
    parLevel: number;
    reorderPoint: number;
    quantity: number;
    costPerUnit: number;
    locationName?: string;
    vendorName?: string;
    notes?: string;
  }>
) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "inventory:import");

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    let locationId: string | null = null;
    if (row.locationName) {
      const loc = await db.location.upsert({
        where: { name: row.locationName },
        create: { name: row.locationName },
        update: {},
      });
      locationId = loc.id;
    }

    let vendorId: string | null = null;
    if (row.vendorName) {
      const vendor = await db.vendor.upsert({
        where: { name: row.vendorName },
        create: { name: row.vendorName },
        update: {},
      });
      vendorId = vendor.id;
    }

    const existing = await db.inventoryItem.findUnique({ where: { sku: row.sku } });

    if (existing) {
      await db.inventoryItem.update({
        where: { sku: row.sku },
        data: {
          name: row.name,
          category: row.category,
          unit: row.unit,
          parLevel: row.parLevel,
          reorderPoint: row.reorderPoint,
          quantity: row.quantity,
          costPerUnit: row.costPerUnit,
          notes: row.notes ?? null,
          locationId,
          vendorId,
          active: true,
        },
      });
      updated++;
    } else {
      await db.inventoryItem.create({
        data: {
          name: row.name,
          sku: row.sku,
          category: row.category,
          unit: row.unit,
          parLevel: row.parLevel,
          reorderPoint: row.reorderPoint,
          quantity: row.quantity,
          costPerUnit: row.costPerUnit,
          notes: row.notes ?? null,
          locationId,
          vendorId,
        },
      });
      created++;
    }
  }

  await logAudit(session.user.id, "IMPORT", "InventoryItem", null, { created, updated });
  revalidatePath("/inventory");

  return { created, updated };
}

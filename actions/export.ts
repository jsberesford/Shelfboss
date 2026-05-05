"use server";

import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getStockStatus } from "@/types";
import type { Role } from "@prisma/client";

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (cell: string | number | null | undefined) =>
    `"${String(cell ?? "").replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export async function exportInventoryCSV(): Promise<{ csv: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user) return { error: "Not authenticated" };
  if (!hasPermission(session.user.role as Role, "inventory:read"))
    return { error: "Insufficient permissions" };

  const items = await db.inventoryItem.findMany({
    where: { active: true },
    include: { location: true, vendor: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const headers = [
    "SKU", "Name", "Category", "Unit", "Quantity",
    "Par Level", "Reorder Point", "Cost Per Unit", "Total Value",
    "Status", "Location", "Vendor",
  ];

  const rows = items.map((item) => {
    const status = getStockStatus(item);
    return [
      item.sku, item.name, item.category, item.unit,
      item.quantity, item.parLevel, item.reorderPoint,
      Number(item.costPerUnit),
      item.quantity * Number(item.costPerUnit),
      status === "critical" ? "Critical" : status === "low" ? "Low" : "OK",
      item.location?.name ?? "",
      item.vendor?.name ?? "",
    ];
  });

  await logAudit(session.user.id, "EXPORT", "InventoryItem", null, { count: items.length });
  return { csv: buildCsv(headers, rows) };
}

export async function exportInventoryValuationCSV(): Promise<{ csv: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user) return { error: "Not authenticated" };
  if (!hasPermission(session.user.role as Role, "reports:read"))
    return { error: "Insufficient permissions" };

  const items = await db.inventoryItem.findMany({
    where: { active: true },
    orderBy: { category: "asc" },
  });

  const headers = ["SKU", "Name", "Category", "Quantity", "Unit Cost", "Total Value", "Status"];

  const rows = items.map((item) => {
    const status = getStockStatus(item);
    return [
      item.sku, item.name, item.category,
      item.quantity, Number(item.costPerUnit),
      item.quantity * Number(item.costPerUnit),
      status === "critical" ? "Critical" : status === "low" ? "Low" : "OK",
    ];
  });

  await logAudit(session.user.id, "EXPORT", "InventoryValuation", null, { count: items.length });
  return { csv: buildCsv(headers, rows) };
}

export async function exportUsageLogCSV(): Promise<{ csv: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user) return { error: "Not authenticated" };
  if (!hasPermission(session.user.role as Role, "reports:read"))
    return { error: "Insufficient permissions" };

  const logs = await db.usageLog.findMany({
    orderBy: { loggedAt: "desc" },
    include: {
      item: true,
      user: { select: { name: true, email: true } },
    },
  });

  const headers = ["Date", "Item", "SKU", "Quantity", "Unit", "Unit Cost", "Total Cost", "Logged By", "Notes"];

  const rows = logs.map((log) => [
    log.loggedAt.toISOString(),
    log.item.name,
    log.item.sku,
    log.quantity,
    log.item.unit,
    Number(log.item.costPerUnit),
    log.quantity * Number(log.item.costPerUnit),
    log.user.name ?? log.user.email ?? "",
    log.notes ?? "",
  ]);

  await logAudit(session.user.id, "EXPORT", "UsageLog", null, { count: logs.length });
  return { csv: buildCsv(headers, rows) };
}

export async function exportOrderSpendCSV(): Promise<{ csv: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user) return { error: "Not authenticated" };
  if (!hasPermission(session.user.role as Role, "reports:read"))
    return { error: "Insufficient permissions" };

  const orders = await db.purchaseOrder.findMany({
    where: { status: { in: ["RECEIVED", "CLOSED"] } },
    include: { vendor: true, items: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Order Number", "Vendor", "Date", "Item Count", "Total Spend"];

  const rows = orders.map((order) => {
    const total = order.items.reduce((s, i) => s + i.quantity * Number(i.unitCost), 0);
    return [
      order.orderNumber,
      order.vendor.name,
      (order.receivedAt ?? order.closedAt ?? order.createdAt).toISOString(),
      order.items.length,
      total,
    ];
  });

  await logAudit(session.user.id, "EXPORT", "PurchaseOrder", null, { count: orders.length });
  return { csv: buildCsv(headers, rows) };
}

export async function exportAuditLogCSV(): Promise<{ csv: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user) return { error: "Not authenticated" };
  if (!hasPermission(session.user.role as Role, "audit:read"))
    return { error: "Insufficient permissions" };

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: { user: { select: { name: true, email: true } } },
  });

  const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details"];

  const rows = logs.map((log) => [
    log.createdAt.toISOString(),
    log.user.name ?? log.user.email ?? "",
    log.action,
    log.entityType,
    log.entityId ?? "",
    log.details ? JSON.stringify(log.details) : "",
  ]);

  await logAudit(session.user.id, "EXPORT", "AuditLog", null, { count: logs.length });
  return { csv: buildCsv(headers, rows) };
}

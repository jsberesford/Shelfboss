"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";
import type { VendorFormData } from "@/types";
import type { Role } from "@prisma/client";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function createVendor(data: VendorFormData) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "vendors:manage");

  const vendor = await db.vendor.create({
    data: {
      name: data.name,
      contactName: data.contactName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
    },
  });

  await logAudit(session.user.id, "CREATE", "Vendor", vendor.id, { name: vendor.name });
  revalidatePath("/vendors");
  return vendor;
}

export async function updateVendor(id: string, data: Partial<VendorFormData>) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "vendors:manage");

  const vendor = await db.vendor.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  await logAudit(session.user.id, "UPDATE", "Vendor", id, {});
  revalidatePath("/vendors");
  return vendor;
}

export async function deactivateVendor(id: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "vendors:manage");

  const vendor = await db.vendor.update({ where: { id }, data: { active: false } });
  await logAudit(session.user.id, "UPDATE", "Vendor", id, { active: false });
  revalidatePath("/vendors");
  return vendor;
}

export async function reactivateVendor(id: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "vendors:manage");

  const vendor = await db.vendor.update({ where: { id }, data: { active: true } });
  await logAudit(session.user.id, "UPDATE", "Vendor", id, { action: "reactivated" });
  revalidatePath("/vendors");
  return { success: true };
}

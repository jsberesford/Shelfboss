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

export async function updateUserRole(userId: string, role: Role) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "users:manage");

  if (userId === session.user.id) throw new Error("Cannot change your own role");

  const user = await db.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAudit(session.user.id, "UPDATE", "User", userId, { role });
  revalidatePath("/users");
  return user;
}

export async function deactivateUser(userId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "users:manage");

  if (userId === session.user.id) throw new Error("Cannot deactivate yourself");

  const user = await db.user.update({
    where: { id: userId },
    data: { active: false },
  });

  await logAudit(session.user.id, "UPDATE", "User", userId, { active: false });
  revalidatePath("/users");
  return user;
}

export async function reactivateUser(userId: string) {
  const session = await getSessionOrThrow();
  requirePermission(session.user.role as Role, "users:manage");

  const user = await db.user.update({
    where: { id: userId },
    data: { active: true },
  });

  await logAudit(session.user.id, "UPDATE", "User", userId, { active: true });
  revalidatePath("/users");
  return user;
}

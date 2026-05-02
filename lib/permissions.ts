import type { Role } from "@prisma/client";

export type Permission =
  | "inventory:read"
  | "inventory:create"
  | "inventory:update"
  | "inventory:delete"
  | "inventory:import"
  | "orders:read"
  | "orders:create"
  | "orders:update"
  | "orders:submit"
  | "orders:approve"
  | "orders:receive"
  | "orders:close"
  | "usage:log"
  | "count:submit"
  | "users:read"
  | "users:manage"
  | "vendors:read"
  | "vendors:manage"
  | "reports:read"
  | "locations:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:delete",
    "inventory:import",
    "orders:read",
    "orders:create",
    "orders:update",
    "orders:submit",
    "orders:approve",
    "orders:receive",
    "orders:close",
    "usage:log",
    "count:submit",
    "users:read",
    "users:manage",
    "vendors:read",
    "vendors:manage",
    "reports:read",
    "locations:manage",
    "audit:read",
  ],
  MANAGER: [
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:import",
    "orders:read",
    "orders:create",
    "orders:update",
    "orders:submit",
    "orders:approve",
    "orders:receive",
    "orders:close",
    "usage:log",
    "count:submit",
    "users:read",
    "vendors:read",
    "vendors:manage",
    "reports:read",
    "locations:manage",
    "audit:read",
  ],
  WAREHOUSE_STAFF: [
    "inventory:read",
    "orders:read",
    "orders:receive",
    "usage:log",
    "count:submit",
    "vendors:read",
  ],
  VIEWER: [
    "inventory:read",
    "orders:read",
    "vendors:read",
    "reports:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export function isAdminRole(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  WAREHOUSE_STAFF: "Warehouse Staff",
  VIEWER: "Viewer",
};

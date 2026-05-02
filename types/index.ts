import type {
  User,
  Vendor,
  Location,
  InventoryItem,
  StockCount,
  UsageLog,
  PurchaseOrder,
  PurchaseOrderItem,
  AuditLog,
  Role,
  LocationType,
  OrderStatus,
} from "@prisma/client";

export type { Role, LocationType, OrderStatus };

// ─── Enriched types (with relations) ─────────────────────────────────────────

export type InventoryItemWithRelations = InventoryItem & {
  location: Location | null;
  vendor: Vendor | null;
};

export type PurchaseOrderWithRelations = PurchaseOrder & {
  vendor: Vendor;
  createdBy: Pick<User, "id" | "name" | "email">;
  items: (PurchaseOrderItem & {
    item: InventoryItem;
  })[];
};

export type StockCountWithRelations = StockCount & {
  item: InventoryItem;
  user: Pick<User, "id" | "name" | "email">;
};

export type UsageLogWithRelations = UsageLog & {
  item: InventoryItem;
  user: Pick<User, "id" | "name" | "email">;
};

export type AuditLogWithUser = AuditLog & {
  user: Pick<User, "id" | "name" | "email">;
};

// ─── Form types ───────────────────────────────────────────────────────────────

export type InventoryItemFormData = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  parLevel: number;
  reorderPoint: number;
  quantity: number;
  costPerUnit: number;
  notes?: string;
  locationId?: string;
  vendorId?: string;
};

export type VendorFormData = {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type OrderFormData = {
  vendorId: string;
  notes?: string;
  expectedDate?: Date;
  items: {
    itemId: string;
    quantity: number;
    unitCost: number;
  }[];
};

export type UsageFormData = {
  itemId: string;
  quantity: number;
  notes?: string;
};

export type StockCountFormData = {
  itemId: string;
  quantity: number;
  notes?: string;
};

// ─── Stock status ─────────────────────────────────────────────────────────────

export type StockStatus = "ok" | "low" | "critical";

export function getStockStatus(item: {
  quantity: number;
  parLevel: number;
  reorderPoint: number;
}): StockStatus {
  if (item.quantity <= item.reorderPoint) return "critical";
  if (item.quantity < item.parLevel) return "low";
  return "ok";
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export type DashboardStats = {
  totalItems: number;
  lowStockCount: number;
  criticalStockCount: number;
  pendingOrdersCount: number;
  totalInventoryValue: number;
  recentActivity: AuditLogWithUser[];
};

// ─── Report types ─────────────────────────────────────────────────────────────

export type InventoryValuationRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  costPerUnit: number;
  totalValue: number;
  status: StockStatus;
};

export type UsageReportRow = {
  date: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  loggedBy: string;
};

export type OrderSpendRow = {
  vendorName: string;
  orderCount: number;
  totalSpend: number;
  avgOrderValue: number;
};

// ─── Session user ─────────────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};

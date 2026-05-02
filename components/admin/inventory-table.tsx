"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StockStatusBadge } from "./stock-status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import { deleteInventoryItem } from "@/actions/inventory";
import { toast } from "sonner";
import { Search, Plus, Trash2, Pencil } from "lucide-react";
import type { InventoryItemWithRelations } from "@/types";
import type { Role } from "@prisma/client";

interface InventoryTableProps {
  items: InventoryItemWithRelations[];
  role: Role;
}

export function InventoryTable({ items, role }: InventoryTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.category))).sort();
    return cats;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === "low") matchesStatus = item.quantity < item.parLevel && item.quantity > item.reorderPoint;
      if (statusFilter === "critical") matchesStatus = item.quantity <= item.reorderPoint;
      if (statusFilter === "ok") matchesStatus = item.quantity >= item.parLevel;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const canEdit = role === "SUPER_ADMIN" || role === "MANAGER";

  async function handleDelete(id: string) {
    try {
      await deleteInventoryItem(id);
      toast.success("Item deactivated");
      router.refresh();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, SKU, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ok">In Stock</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="h-4 w-4" />
              Add Item
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Par</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 9 : 8} className="h-24 text-center text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/inventory/${item.id}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.location?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.quantity} <span className="text-xs text-muted-foreground">{item.unit}</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.parLevel}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(Number(item.costPerUnit))}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge
                      quantity={item.quantity}
                      parLevel={item.parLevel}
                      reorderPoint={item.reorderPoint}
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/inventory/${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {role === "SUPER_ADMIN" && (
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Deactivate Item"
                            description={`Remove "${item.name}" from active inventory? This cannot be undone.`}
                            confirmLabel="Deactivate"
                            destructive
                            onConfirm={() => handleDelete(item.id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} items
      </p>
    </div>
  );
}

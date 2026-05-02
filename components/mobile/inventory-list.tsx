"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { getStockStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { InventoryItem, Location } from "@prisma/client";

type ItemWithLocation = InventoryItem & { location: Location | null };

export function MobileInventoryList({ items }: { items: ItemWithLocation[] }) {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const filtered = items.filter(
      (i) =>
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase())
    );

    const map = new Map<string, ItemWithLocation[]>();
    filtered.forEach((item) => {
      const key = item.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [items, search]);

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {Array.from(grouped.entries()).map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {category}
          </h3>
          <div className="space-y-1.5">
            {categoryItems.map((item) => {
              const status = getStockStatus(item);
              return (
                <div key={item.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                  <div className={cn(
                    "h-3 w-3 rounded-full shrink-0",
                    status === "critical" ? "bg-red-500" :
                    status === "low" ? "bg-amber-500" :
                    "bg-green-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.location?.name ?? "No location"} · {item.sku}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {grouped.size === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No items found</p>
      )}
    </div>
  );
}

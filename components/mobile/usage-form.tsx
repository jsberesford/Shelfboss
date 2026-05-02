"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logUsage } from "@/actions/usage";
import { getStockStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Search, Check, ChevronRight, X } from "lucide-react";

type Item = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  parLevel: number;
  reorderPoint: number;
  location: { name: string } | null;
};

interface UsageFormProps { items: Item[] }

export function UsageForm({ items }: UsageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");

  const filtered = items.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit() {
    if (!selectedItem) return;
    const quantity = parseFloat(qty);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (quantity > selectedItem.quantity) {
      toast.error(`Only ${selectedItem.quantity} ${selectedItem.unit} available`);
      return;
    }

    startTransition(async () => {
      try {
        await logUsage(selectedItem.id, quantity, notes || undefined);
        toast.success(`Logged ${quantity} ${selectedItem.unit} of ${selectedItem.name}`);
        setSelectedItem(null);
        setQty("1");
        setNotes("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to log usage");
      }
    });
  }

  if (selectedItem) {
    const status = getStockStatus(selectedItem);
    const remaining = selectedItem.quantity - (parseFloat(qty) || 0);

    return (
      <div className="flex flex-col min-h-[calc(100vh-7rem)]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground"
            onClick={() => setSelectedItem(null)}
          >
            <X className="h-4 w-4" /> Change item
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center space-y-2">
            {selectedItem.location && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                {selectedItem.location.name}
              </span>
            )}
            <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
            <p className={cn(
              "text-sm font-medium",
              status === "critical" ? "text-red-600" :
              status === "low" ? "text-amber-600" :
              "text-green-600"
            )}>
              {selectedItem.quantity} {selectedItem.unit} on hand
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <label className="text-sm font-medium text-center block">
              Quantity Used ({selectedItem.unit})
            </label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={selectedItem.quantity}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="text-center text-3xl h-16 font-bold"
              autoFocus
            />
            {parseFloat(qty) > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                After usage: {Math.max(0, remaining).toFixed(2)} {selectedItem.unit}
              </p>
            )}
          </div>

          <div className="w-full max-w-xs">
            <label className="text-sm font-medium block mb-2">Notes (optional)</label>
            <Textarea
              rows={2}
              placeholder="Reason for usage…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t">
          <Button
            size="xl"
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
          >
            <Check className="h-5 w-5" />
            {isPending ? "Logging…" : "Log Usage"}
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="space-y-2">
        {filtered.map((item) => {
          const status = getStockStatus(item);
          return (
            <button
              key={item.id}
              className="w-full text-left rounded-xl border p-4 active:bg-muted transition-colors flex items-center gap-4"
              onClick={() => {
                setSelectedItem(item);
                setQty("1");
              }}
            >
              <div className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                status === "critical" ? "bg-red-500" :
                status === "low" ? "bg-amber-500" :
                "bg-green-500"
              )} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} {item.unit} · {item.category}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No items found</p>
        )}
      </div>
    </div>
  );
}

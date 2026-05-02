"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { submitStockCount } from "@/actions/inventory";
import { getStockStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

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

interface CountFlowProps { items: Item[] }

export function CountFlow({ items }: CountFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [countValues, setCountValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const filtered = items.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const currentItem = currentIndex !== null ? filtered[currentIndex] : null;

  function handleCountChange(value: string) {
    if (currentItem) {
      setCountValues((prev) => ({ ...prev, [currentItem.id]: value }));
    }
  }

  function handleSubmit() {
    if (!currentItem) return;
    const value = parseFloat(countValues[currentItem.id] ?? "");
    if (isNaN(value) || value < 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    startTransition(async () => {
      try {
        await submitStockCount(currentItem.id, value);
        setSubmitted((prev) => new Set([...prev, currentItem.id]));
        toast.success(`${currentItem.name}: ${value} ${currentItem.unit}`);

        if (currentIndex !== null && currentIndex < filtered.length - 1) {
          setCurrentIndex(currentIndex + 1);
          const nextItem = filtered[currentIndex + 1];
          setCountValues((prev) => ({
            ...prev,
            [nextItem.id]: String(nextItem.quantity),
          }));
        } else {
          setCurrentIndex(null);
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to submit count");
      }
    });
  }

  if (currentIndex !== null && currentItem) {
    const status = getStockStatus(currentItem);
    const countVal = countValues[currentItem.id] ?? String(currentItem.quantity);
    const isAlreadyCounted = submitted.has(currentItem.id);

    return (
      <div className="flex flex-col min-h-[calc(100vh-7rem)]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => (i ?? 0) - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" disabled={currentIndex === filtered.length - 1}
              onClick={() => setCurrentIndex((i) => (i ?? 0) + 1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentIndex(null)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center space-y-2">
            {currentItem.location && (
              <Badge variant="secondary" className="text-xs">{currentItem.location.name}</Badge>
            )}
            <h2 className="text-2xl font-bold">{currentItem.name}</h2>
            <p className="text-sm text-muted-foreground">{currentItem.sku} · {currentItem.category}</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                status === "critical" ? "bg-red-100 text-red-700" :
                status === "low" ? "bg-amber-100 text-amber-700" :
                "bg-green-100 text-green-700"
              )}>
                On hand: {currentItem.quantity} {currentItem.unit}
              </span>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <label className="text-sm font-medium text-center block">New Count ({currentItem.unit})</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={countVal}
              onChange={(e) => handleCountChange(e.target.value)}
              className="text-center text-3xl h-16 font-bold"
              autoFocus
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
            {isPending ? "Saving…" : isAlreadyCounted ? "Update Count" : "Submit Count"}
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

      {filtered.length > 0 && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setCurrentIndex(0);
            const first = filtered[0];
            setCountValues((prev) => ({ ...prev, [first.id]: String(first.quantity) }));
          }}
        >
          Start Sequential Count ({filtered.length} items)
        </Button>
      )}

      <div className="space-y-2">
        {filtered.map((item, index) => {
          const status = getStockStatus(item);
          const isSubmitted = submitted.has(item.id);

          return (
            <button
              key={item.id}
              className="w-full text-left rounded-xl border p-4 active:bg-muted transition-colors flex items-center gap-4"
              onClick={() => {
                setCurrentIndex(index);
                if (!countValues[item.id]) {
                  setCountValues((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
                }
              }}
            >
              <div className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                isSubmitted ? "bg-green-500" :
                status === "critical" ? "bg-red-500" :
                status === "low" ? "bg-amber-500" :
                "bg-gray-300"
              )} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.location?.name ?? "No location"} · {item.quantity} {item.unit}
                </p>
              </div>
              {isSubmitted && <Check className="h-4 w-4 text-green-600 shrink-0" />}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

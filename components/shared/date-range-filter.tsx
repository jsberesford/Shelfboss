"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  from?: string;
  to?: string;
}

export function DateRangeFilter({ from, to }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildUrl(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    return `?${params.toString()}`;
  }

  function handleFromChange(value: string) {
    router.push(buildUrl({ from: value || undefined }));
  }

  function handleToChange(value: string) {
    router.push(buildUrl({ to: value || undefined }));
  }

  function handleClear() {
    router.push(buildUrl({ from: undefined, to: undefined }));
  }

  const hasFilter = Boolean(from || to);

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={from ?? ""}
          onChange={(e) => handleFromChange(e.target.value)}
          className="w-36 h-8 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={to ?? ""}
          onChange={(e) => handleToChange(e.target.value)}
          className="w-36 h-8 text-sm"
        />
      </div>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 text-xs"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

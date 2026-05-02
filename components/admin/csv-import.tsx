"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importInventoryItems } from "@/actions/inventory";
import { Upload, FileText, AlertCircle } from "lucide-react";

const EXPECTED_HEADERS = ["name", "sku", "category", "unit", "parLevel", "reorderPoint", "quantity", "costPerUnit"];

export function CsvImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
        if (missingHeaders.length > 0) {
          setErrors([`Missing required columns: ${missingHeaders.join(", ")}`]);
          setPreview([]);
          return;
        }
        setErrors([]);
        setPreview(result.data.slice(0, 5));
        setOpen(true);
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  }

  function handleImport() {
    if (preview.length === 0) return;
    startTransition(async () => {
      try {
        const rows = preview.map((row) => ({
          name: row.name,
          sku: row.sku,
          category: row.category,
          unit: row.unit,
          parLevel: parseFloat(row.parLevel) || 0,
          reorderPoint: parseFloat(row.reorderPoint) || 0,
          quantity: parseFloat(row.quantity) || 0,
          costPerUnit: parseFloat(row.costPerUnit) || 0,
          locationName: row.location || undefined,
          vendorName: row.vendor || undefined,
          notes: row.notes || undefined,
        }));

        const result = await importInventoryItems(rows);
        toast.success(`Import complete: ${result.created} created, ${result.updated} updated`);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      }
    });
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Inventory</DialogTitle>
            <DialogDescription>
              Preview of the first 5 rows. The full file will be imported.
            </DialogDescription>
          </DialogHeader>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors[0]}</AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded border text-xs">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(preview[0]).map((k) => (
                      <th key={k} className="px-3 py-2 text-left font-medium">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 max-w-[120px] truncate">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Required columns: name, sku, category, unit, parLevel, reorderPoint, quantity, costPerUnit.
              Optional: location, vendor, notes. Existing SKUs will be updated.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={isPending || errors.length > 0}>
              {isPending ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createInventoryItem, updateInventoryItem } from "@/actions/inventory";
import { CATEGORIES, UNITS, generateSku } from "@/lib/utils";
import type { InventoryItemWithRelations } from "@/types";
import type { Location, Vendor } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sku: z.string().min(1, "SKU is required").max(50),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  parLevel: z.coerce.number().min(0, "Must be 0 or greater"),
  reorderPoint: z.coerce.number().min(0, "Must be 0 or greater"),
  quantity: z.coerce.number().min(0, "Must be 0 or greater"),
  costPerUnit: z.coerce.number().min(0, "Must be 0 or greater"),
  locationId: z.string().optional(),
  vendorId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface InventoryFormProps {
  item?: InventoryItemWithRelations;
  locations: Location[];
  vendors: Vendor[];
  existingSkus?: string[];
}

export function InventoryForm({ item, locations, vendors, existingSkus = [] }: InventoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!item;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? "",
      sku: item?.sku ?? "",
      category: item?.category ?? "",
      unit: item?.unit ?? "",
      parLevel: item?.parLevel ?? 0,
      reorderPoint: item?.reorderPoint ?? 0,
      quantity: item?.quantity ?? 0,
      costPerUnit: Number(item?.costPerUnit ?? 0),
      locationId: item?.locationId ?? "",
      vendorId: item?.vendorId ?? "",
      notes: item?.notes ?? "",
    },
  });

  function handleNameBlur() {
    if (!isEdit && !form.getValues("sku") && form.getValues("name")) {
      const suggested = generateSku(form.getValues("name"), existingSkus);
      form.setValue("sku", suggested);
    }
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const data = {
          ...values,
          locationId: values.locationId || undefined,
          vendorId: values.vendorId || undefined,
          notes: values.notes || undefined,
        };

        if (isEdit) {
          await updateInventoryItem(item.id, data);
          toast.success("Item updated");
        } else {
          await createInventoryItem(data);
          toast.success("Item created");
          router.push("/inventory");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save item");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Chicken Breast" {...field} onBlur={handleNameBlur} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. CHK-001" className="font-mono" {...field} />
                </FormControl>
                <FormDescription>Auto-generated from name, editable</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Par Level *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormDescription>Target quantity to maintain</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reorderPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormDescription>Triggers critical alert below this level</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Quantity *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costPerUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Per Unit *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes…" className="resize-none" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Item"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

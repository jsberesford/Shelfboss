"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOrder } from "@/actions/orders";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { Vendor, InventoryItem } from "@prisma/client";

const schema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Item is required"),
        quantity: z.coerce.number().min(0.01, "Quantity must be > 0"),
        unitCost: z.coerce.number().min(0, "Cost must be >= 0"),
      })
    )
    .min(1, "At least one item is required"),
});

type FormValues = z.infer<typeof schema>;

interface OrderFormProps {
  vendors: Vendor[];
  items: InventoryItem[];
}

export function OrderForm({ vendors, items }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorId: "",
      notes: "",
      expectedDate: "",
      items: [{ itemId: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function handleItemChange(index: number, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      form.setValue(`items.${index}.unitCost`, Number(item.costPerUnit));
    }
  }

  const watchedItems = form.watch("items");
  const total = watchedItems.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0), 0);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const order = await createOrder({
          vendorId: values.vendorId,
          notes: values.notes || undefined,
          expectedDate: values.expectedDate ? new Date(values.expectedDate) : undefined,
          items: values.items,
        });
        toast.success(`Order ${order.orderNumber} created`);
        router.push(`/orders/${order.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create order");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Delivery</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ itemId: "", quantity: 1, unitCost: 0 })}
            >
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_100px_120px_40px] gap-2 items-end">
              <FormField
                control={form.control}
                name={`items.${index}.itemId`}
                render={({ field: f }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Item</FormLabel>}
                    <Select
                      onValueChange={(val) => {
                        f.onChange(val);
                        handleItemChange(index, val);
                      }}
                      defaultValue={f.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field: f }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Qty</FormLabel>}
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitCost`}
                render={({ field: f }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Unit Cost</FormLabel>}
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`text-destructive hover:text-destructive ${index === 0 ? "mt-8" : ""}`}
                onClick={() => fields.length > 1 && remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex justify-end pt-2 border-t">
            <span className="text-sm font-medium">
              Estimated Total: {formatCurrency(total)}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional order notes…" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Draft Order"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

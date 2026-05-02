"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { createVendor, updateVendor, deactivateVendor } from "@/actions/vendors";
import { Plus, Pencil } from "lucide-react";
import type { Vendor, Role } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type VendorWithCount = Vendor & { _count: { items: number; orders: number } };

interface VendorTableProps {
  vendors: VendorWithCount[];
  role: Role;
}

export function VendorTable({ vendors, role }: VendorTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const canManage = role === "SUPER_ADMIN" || role === "MANAGER";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", contactName: "", email: "", phone: "", address: "", notes: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", contactName: "", email: "", phone: "", address: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditing(vendor);
    form.reset({
      name: vendor.name,
      contactName: vendor.contactName ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      address: vendor.address ?? "",
      notes: vendor.notes ?? "",
    });
    setDialogOpen(true);
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const data = {
          name: values.name,
          contactName: values.contactName || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          notes: values.notes || undefined,
        };

        if (editing) {
          await updateVendor(editing.id, data);
          toast.success("Vendor updated");
        } else {
          await createVendor(data);
          toast.success("Vendor created");
        }
        setDialogOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to save vendor");
      }
    });
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id} className={!vendor.active ? "opacity-60" : undefined}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.contactName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.phone ?? "—"}</TableCell>
                <TableCell className="text-right">{vendor._count.items}</TableCell>
                <TableCell className="text-right">{vendor._count.orders}</TableCell>
                <TableCell>
                  <Badge variant={vendor.active ? "success" : "secondary"}>
                    {vendor.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(vendor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {vendor.active && (
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isPending}>
                              Deactivate
                            </Button>
                          }
                          title="Deactivate Vendor"
                          description={`Remove ${vendor.name} from active vendors?`}
                          confirmLabel="Deactivate"
                          destructive
                          onConfirm={() =>
                            startTransition(async () => {
                              await deactivateVendor(vendor.id);
                              toast.success("Vendor deactivated");
                              router.refresh();
                            })
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contactName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : editing ? "Save Changes" : "Create Vendor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

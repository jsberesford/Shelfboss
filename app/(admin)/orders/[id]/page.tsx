import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderActions } from "@/components/admin/order-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Role } from "@prisma/client";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const order = await db.purchaseOrder.findUnique({ where: { id: params.id }, select: { orderNumber: true } });
  return { title: order?.orderNumber ?? "Order" } satisfies Metadata;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const role = session?.user?.role as Role;

  const order = await db.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      vendor: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        include: { item: true },
      },
    },
  });

  if (!order) notFound();

  const total = order.items.reduce((sum, i) => sum + i.quantity * Number(i.unitCost), 0);

  const timeline: { label: string; date: Date | null }[] = [
    { label: "Created", date: order.createdAt },
    { label: "Submitted", date: order.submittedAt },
    { label: "Approved", date: order.approvedAt },
    { label: "Ordered", date: order.orderedAt },
    { label: "Received", date: order.receivedAt },
    { label: "Closed", date: order.closedAt },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title={order.orderNumber} description={`Vendor: ${order.vendor.name}`}>
        <OrderStatusBadge status={order.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((line) => {
                    const hasDiscrepancy =
                      line.receivedQty !== null && line.receivedQty !== line.quantity;
                    return (
                      <TableRow key={line.id} className={hasDiscrepancy ? "bg-amber-50" : undefined}>
                        <TableCell className="font-medium">{line.item.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{line.item.sku}</TableCell>
                        <TableCell className="text-right">
                          {line.quantity} {line.item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.receivedQty !== null ? (
                            <span className={hasDiscrepancy ? "text-amber-700 font-medium" : ""}>
                              {line.receivedQty} {line.item.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(line.unitCost))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(line.quantity * Number(line.unitCost))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {role === "WAREHOUSE_STAFF" || role === "SUPER_ADMIN" || role === "MANAGER" ? (
            <OrderActions order={order} role={role} />
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{order.createdBy.name ?? order.createdBy.email}</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p>{order.notes}</p>
                </div>
              )}
              {order.expectedDate && (
                <div>
                  <p className="text-muted-foreground">Expected delivery</p>
                  <p>{formatDate(order.expectedDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {timeline
                  .filter((t) => t.date)
                  .map((t) => (
                    <li key={t.label} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0 ring-2 ring-background ring-offset-1" />
                      <div>
                        <p className="font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(t.date)}</p>
                      </div>
                    </li>
                  ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

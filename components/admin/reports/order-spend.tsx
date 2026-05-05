"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PurchaseOrder, PurchaseOrderItem, InventoryItem, Vendor } from "@prisma/client";
import { DateRangeFilter } from "@/components/shared/date-range-filter";

type OrderWithRelations = PurchaseOrder & {
  vendor: Vendor;
  items: (PurchaseOrderItem & { item: InventoryItem })[];
};

interface Props {
  orders: OrderWithRelations[];
  from?: string;
  to?: string;
}

export function OrderSpendReport({ orders, from, to }: Props) {
  const totalSpend = useMemo(
    () => orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity * Number(i.unitCost), 0), 0),
    [orders]
  );

  const byVendor = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    orders.forEach((o) => {
      const spend = o.items.reduce((s, i) => s + i.quantity * Number(i.unitCost), 0);
      const existing = map.get(o.vendorId);
      if (existing) {
        existing.total += spend;
        existing.count += 1;
      } else {
        map.set(o.vendorId, { name: o.vendor.name, total: spend, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [orders]);

  return (
    <div className="space-y-6">
      <DateRangeFilter from={from} to={to} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Order Spend</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Orders Completed</p>
            <p className="text-3xl font-bold mt-1">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unique Vendors</p>
            <p className="text-3xl font-bold mt-1">{byVendor.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spend by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byVendor} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="total" fill="hsl(220, 70%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const spend = order.items.reduce((s, i) => s + i.quantity * Number(i.unitCost), 0);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>{order.vendor.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.receivedAt ?? order.closedAt ?? order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">{order.items.length}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(spend)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import type { UsageLog, InventoryItem, User } from "@prisma/client";
import { DateRangeFilter } from "@/components/shared/date-range-filter";

type LogWithRelations = UsageLog & {
  item: InventoryItem;
  user: Pick<User, "id" | "name" | "email">;
};

interface Props {
  logs: LogWithRelations[];
  from?: string;
  to?: string;
}

export function UsageReport({ logs, from, to }: Props) {
  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    logs.forEach((log) => {
      const day = format(startOfDay(new Date(log.loggedAt)), "MMM d");
      byDay.set(day, (byDay.get(day) ?? 0) + log.quantity * Number(log.item.costPerUnit));
    });
    return Array.from(byDay.entries())
      .map(([date, cost]) => ({ date, cost }))
      .slice(-30);
  }, [logs]);

  const totalCost = logs.reduce((s, l) => s + l.quantity * Number(l.item.costPerUnit), 0);
  const totalQty = logs.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="space-y-6">
      <DateRangeFilter from={from} to={to} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Usage Cost</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Log Entries</p>
            <p className="text-3xl font-bold mt-1">{logs.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Usage Cost (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="cost" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Logged by</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const initials = log.user.name
                  ? log.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?";
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{log.user.name ?? log.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {log.quantity} {log.item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(log.quantity * Number(log.item.costPerUnit))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(log.loggedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.notes ?? "—"}
                    </TableCell>
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

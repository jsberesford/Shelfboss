"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { ExportButton } from "@/components/shared/export-button";
import { exportAuditLogCSV } from "@/actions/export";
import { loadMoreAuditLogs } from "@/actions/audit";
import { formatDateTime } from "@/lib/utils";
import { Search } from "lucide-react";
import type { AuditLogWithUser } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "info",
  UPDATE: "secondary",
  DELETE: "critical",
  SUBMIT: "warning",
  APPROVE: "success",
  RECEIVE: "success",
  CLOSE: "secondary",
  COUNT: "info",
  USAGE: "warning",
  IMPORT: "info",
};

interface AuditTableProps {
  initialLogs: AuditLogWithUser[];
  initialCursor: string | null;
  from?: string;
  to?: string;
}

export function AuditTable({ initialLogs, initialCursor, from, to }: AuditTableProps) {
  const [logs, setLogs] = useState<AuditLogWithUser[]>(initialLogs);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const { logs: newLogs, nextCursor } = await loadMoreAuditLogs(cursor, from, to);
      setLogs((prev) => [...prev, ...newLogs]);
      setCursor(nextCursor);
    });
  }

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        l.user.name?.toLowerCase().includes(q) ||
        l.user.email?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by action, entity, user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <DateRangeFilter from={from} to={to} />
        <ExportButton action={exportAuditLogCSV} filename="audit-log" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => {
                const initials = log.user.name
                  ? log.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?";
                const colorVariant = ACTION_COLORS[log.action] ?? "secondary";

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{log.user.name ?? log.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={colorVariant as "default"}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.entityType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length}{filtered.length !== logs.length ? ` of ${logs.length} loaded` : ""} entries
        </p>
        {cursor && (
          <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? "Loading…" : "Load more"}
          </Button>
        )}
      </div>
    </div>
  );
}

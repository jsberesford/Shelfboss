"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { updateUserRole, deactivateUser, reactivateUser } from "@/actions/users";
import { toast } from "sonner";
import type { User, Role } from "@prisma/client";

const ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "WAREHOUSE_STAFF", "VIEWER"];

interface UserTableProps { users: User[] }

export function UserTable({ users }: UserTableProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  function act(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        toast.success("User updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update user");
      }
    });
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUser = session?.user?.id === user.id;
            const initials = user.name
              ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : user.email?.[0].toUpperCase() ?? "?";

            return (
              <TableRow key={user.id} className={!user.active ? "opacity-60" : undefined}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name ?? "(no name)"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {isCurrentUser ? (
                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                  ) : (
                    <Select
                      defaultValue={user.role}
                      disabled={isPending}
                      onValueChange={(role) => act(() => updateUserRole(user.id, role as Role))}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? "success" : "secondary"}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  {!isCurrentUser && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className={user.active ? "text-destructive hover:text-destructive" : ""}
                          disabled={isPending}
                        >
                          {user.active ? "Deactivate" : "Reactivate"}
                        </Button>
                      }
                      title={user.active ? "Deactivate User" : "Reactivate User"}
                      description={
                        user.active
                          ? `Block ${user.name ?? user.email} from signing in?`
                          : `Allow ${user.name ?? user.email} to sign in again?`
                      }
                      confirmLabel={user.active ? "Deactivate" : "Reactivate"}
                      destructive={user.active}
                      onConfirm={() =>
                        act(() => (user.active ? deactivateUser(user.id) : reactivateUser(user.id)))
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

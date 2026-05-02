"use client";

import { useState } from "react";
import { devSignIn } from "@/actions/dev-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUICK_USERS = [
  { label: "Super Admin", email: "admin@premiumfood.dev", role: "SUPER_ADMIN" },
  { label: "Manager", email: "manager@premiumfood.dev", role: "MANAGER" },
  { label: "Warehouse Staff", email: "warehouse@premiumfood.dev", role: "WAREHOUSE_STAFF" },
  { label: "Viewer", email: "viewer@premiumfood.dev", role: "VIEWER" },
];

export function DevLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [role, setRole] = useState("SUPER_ADMIN");

  return (
    <div className="space-y-3">
      <p className="text-xs text-center font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        ⚠ Dev mode — no Azure AD required
      </p>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_USERS.map((u) => (
          <form key={u.role} action={devSignIn}>
            <input type="hidden" name="email" value={u.email} />
            <input type="hidden" name="role" value={u.role} />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <button
              type="submit"
              className="w-full text-left rounded-lg border p-2.5 hover:bg-accent transition-colors"
            >
              <p className="text-xs font-semibold">{u.label}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
            </button>
          </form>
        ))}
      </div>

      <form action={devSignIn} className="space-y-2">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Input
          name="email"
          placeholder="email@example.com"
          defaultValue="admin@premiumfood.dev"
          className="h-9 text-sm"
        />
        <Select name="role" value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="WAREHOUSE_STAFF">Warehouse Staff</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Sign in as custom user
        </Button>
      </form>
    </div>
  );
}

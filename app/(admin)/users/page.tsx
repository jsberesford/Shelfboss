import type { Metadata } from "next";
import { Info } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { UserTable } from "@/components/admin/user-table";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members and their access levels."
      />
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          New employees sign in with their Microsoft 365 account at{" "}
          <span className="font-medium">premiumsupply.vercel.app</span>. Their account will
          appear here as a <span className="font-medium">Viewer</span>. Update their role to
          grant access.
        </p>
      </div>
      <UserTable users={users} />
    </div>
  );
}

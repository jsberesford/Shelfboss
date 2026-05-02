import type { Metadata } from "next";
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
      <UserTable users={users} />
    </div>
  );
}

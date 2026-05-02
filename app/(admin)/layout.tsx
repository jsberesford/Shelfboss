import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import type { Role } from "@prisma/client";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role as Role)) redirect("/m");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={session.user.role as Role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user as { name?: string | null; email?: string | null; image?: string | null; role: Role }} />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

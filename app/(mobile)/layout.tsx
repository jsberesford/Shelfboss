import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/mobile/bottom-nav";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

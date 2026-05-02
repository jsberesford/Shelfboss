import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  redirect("/m");
}

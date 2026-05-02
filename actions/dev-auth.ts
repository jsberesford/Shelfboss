"use server";

import { signIn } from "@/lib/auth";

export async function devSignIn(formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  if (!email) return;
  await signIn("dev-login", { email, role, redirectTo: callbackUrl });
}

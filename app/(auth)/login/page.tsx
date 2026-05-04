import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";
import { DevLoginForm } from "@/components/shared/dev-login-form";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/";
  const isDev = (process.env.NODE_ENV as string) === "development";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">PremiumSupply</CardTitle>
          <CardDescription className="mt-1">Premium Food Service — Inventory Management</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchParams.error && (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {searchParams.error === "AccessDenied"
              ? "Your account has been deactivated. Contact your administrator."
              : "Sign in failed. Please try again."}
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
          }}
        >
          <Button type="submit" className="w-full gap-3" size="lg">
            <MicrosoftIcon />
            Sign in with Microsoft
          </Button>
        </form>

        {isDev && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <DevLoginForm callbackUrl={callbackUrl} />
          </>
        )}

        {!isDev && (
          <p className="text-center text-xs text-muted-foreground">
            Sign in with your Premium Food Service Microsoft 365 account.
            <br />
            Contact IT for access issues.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 21 21" className="h-5 w-5" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showSignOut?: boolean;
  backHref?: string;
}

export function MobileHeader({ title, subtitle, showSignOut }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-3 pwa-safe-top">
      <div className="flex items-center justify-between">
        <div>
          {subtitle && <p className="text-xs text-primary-foreground/70">{subtitle}</p>}
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
        </div>
        {showSignOut && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            onClick={() => (window.location.href = "/api/auth/signout")}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}

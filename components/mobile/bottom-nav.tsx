"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, ClipboardList, Minus, ShoppingBag, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/m", icon: ClipboardList, label: "Count", exact: true },
  { href: "/m/receive", icon: ShoppingBag, label: "Receive" },
  { href: "/m/usage", icon: Minus, label: "Usage" },
  { href: "/m/alerts", icon: TriangleAlert, label: "Alerts" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t bg-background pwa-safe-bottom">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("h-6 w-6", isActive && "text-primary")} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

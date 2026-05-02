"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Truck,
  ClipboardList,
  Package2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Role } from "@prisma/client";

const navigation = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Operations",
    items: [
      { href: "/inventory", icon: Package, label: "Inventory" },
      { href: "/orders", icon: ShoppingCart, label: "Orders" },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/reports", icon: BarChart3, label: "Reports" }],
    roles: ["SUPER_ADMIN", "MANAGER", "VIEWER"] as Role[],
  },
  {
    label: "Settings",
    items: [
      { href: "/vendors", icon: Truck, label: "Vendors", roles: ["SUPER_ADMIN", "MANAGER"] as Role[] },
      { href: "/users", icon: Users, label: "Users", roles: ["SUPER_ADMIN"] as Role[] },
      { href: "/audit-log", icon: ClipboardList, label: "Audit Log", roles: ["SUPER_ADMIN", "MANAGER"] as Role[] },
    ],
  },
];

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Package2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">PremiumSupply</p>
          <p className="text-xs text-muted-foreground">Premium Food Service</p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-3">
          {navigation.map((group) => {
            const visibleItems = group.items.filter((item) => {
              const itemRoles = "roles" in item ? item.roles : undefined;
              if (!itemRoles) return true;
              return itemRoles.includes(role);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

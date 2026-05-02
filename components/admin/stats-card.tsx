import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: { value: number; label: string };
}

export function StatsCard({ title, value, description, icon: Icon, iconClassName, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={cn("rounded-lg p-2.5", iconClassName ?? "bg-primary/10")}>
            <Icon className={cn("h-5 w-5", iconClassName ? "text-white" : "text-primary")} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function generateOrderNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  const seq = String(existingCount + 1).padStart(4, "0");
  return `PO-${year}-${seq}`;
}

export function generateSku(name: string, existing: string[] = []): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 8);

  let candidate = base;
  let counter = 1;
  while (existing.includes(candidate)) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export const CATEGORIES = [
  "Proteins",
  "Dairy",
  "Produce",
  "Dry Goods",
  "Grains & Starches",
  "Oils & Condiments",
  "Beverages",
  "Frozen Foods",
  "Cleaning Supplies",
  "Paper Goods",
  "Smallwares",
  "Other",
] as const;

export const UNITS = [
  "each",
  "case",
  "lb",
  "oz",
  "gallon",
  "quart",
  "pint",
  "bag",
  "box",
  "can",
  "bottle",
  "pack",
  "roll",
  "sheet",
  "pair",
] as const;

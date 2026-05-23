import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

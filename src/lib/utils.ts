import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

export { currencySymbol, formatCurrency } from './currency'

const VI_VARIANTS: Record<string, string> = {
  a: '[aăâàáảãạắặằẳẵấầẩẫậäåæ]',
  e: '[eêèéẻẽẹếềểễệë]',
  i: '[iìíỉĩịï]',
  o: '[oôơòóỏõọốồổỗộớờởỡợö]',
  u: '[uưùúủũụứừửữựü]',
  y: '[yỳýỷỹỵ]',
  d: '[dđ]',
}

// Normalizes each char to its ASCII base then expands to a Vietnamese variant
// class, so typing "phư" or "phu" both produce the same regex.
export function toViRegex(query: string): string {
  return query
    .toLowerCase()
    .replace(/[ưƯ]/g, 'u')
    .replace(/[ơƠ]/g, 'o')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((c) => VI_VARIANTS[c] ?? c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('')
}

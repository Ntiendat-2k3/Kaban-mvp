import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tiện ích kết hợp class Tailwind an toàn
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


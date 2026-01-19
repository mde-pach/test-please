import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Intelligently handles class conflicts and precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

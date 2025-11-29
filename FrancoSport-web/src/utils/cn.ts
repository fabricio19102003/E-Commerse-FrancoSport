import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * @example
 * cn('text-red-500', 'bg-blue-500') // 'text-red-500 bg-blue-500'
 * cn('text-red-500', condition && 'bg-blue-500') // conditional classes
 * cn('p-4', 'p-6') // 'p-6' (tailwind-merge resolves conflicts)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

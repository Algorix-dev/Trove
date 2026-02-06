import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanBookTitle(title: string) {
  if (!title) return '';
  return title
    .replace(/\.(pdf|epub|txt|mobi|azw3)$/i, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*\)/g, '')
    .trim();
}

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BREAKPOINTS } from './Constants';
import type { DebounceFn, ThrottleFn } from '@/types';

type ClassValue = string | number | boolean | undefined | null | { [key: string]: string | number | boolean | undefined | null };

/**
 * Combines class names with Tailwind CSS classes
 */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Delays execution for a specified time
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks if code is running on the client side
 */
const isClient = typeof window !== 'undefined';

/**
 * Checks if code is running on the server side
 */
const isServer = typeof window === 'undefined';

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 */
const debounce = <T extends unknown[]>(func: (...args: T) => void, wait: number): DebounceFn<T> => {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: T): void {
    const later = () => {
      clearTimeout(timeout);
      return func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ThrottleFn<T> {
  let inThrottle: boolean;
  let lastTime: number;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();

    if (!inThrottle) {
      const result = func(...args);
      lastTime = now;
      inThrottle = true;
      return result;
    } else {
      clearTimeout(lastResult as any);
      lastResult = setTimeout(() => {
        if (now - lastTime >= wait) {
          const result = func(...args);
          lastTime = now;
          return result;
        }
      }, Math.max(wait - (now - lastTime), 0)) as any;
      return lastResult as ReturnType<T>;
    }
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 */
const throttleNew = <T extends unknown[]>(func: (...args: T) => void, limit: number): ThrottleFn<T> => {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  return function(...args: T) {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Returns true if the current viewport matches the specified media query
 */
function useMediaQuery(query: string): boolean {
  if (!isClient) return false;

  const mediaQuery = window.matchMedia(query);
  return mediaQuery.matches;
}

/**
 * Returns true if the current viewport is mobile
 */
function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.MD})`);
}

/**
 * Returns true if the current viewport is tablet
 */
function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.MD}) and (max-width: ${BREAKPOINTS.LG})`
  );
}

/**
 * Returns true if the current viewport is desktop
 */
function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.LG})`);
}

/**
 * Formats a number as a file size string
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formats a duration in seconds to a human-readable string
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Generates a random string of specified length
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validates an email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncates a string to a specified length
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, '');
}

export {
  cn,
  delay,
  isClient,
  isServer,
  debounce,
  throttle,
  throttleNew,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  formatFileSize,
  formatDuration,
  generateRandomString,
  isValidEmail,
  truncateString,
  capitalizeFirstLetter,
  toPascalCase
};

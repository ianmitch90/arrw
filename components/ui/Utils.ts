const { clsx } = require('clsx');
const { twMerge } = require('tailwind-merge');
const { BREAKPOINTS } = require('./Constants');

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any };

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
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
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
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastTime: number;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): void {
    const now = Date.now();

    if (!inThrottle) {
      func(...args);
      lastTime = now;
      inThrottle = true;
    } else {
      clearTimeout(lastResult as any);
      lastResult = setTimeout(() => {
        if (now - lastTime >= wait) {
          func(...args);
          lastTime = now;
        }
      }, Math.max(wait - (now - lastTime), 0)) as any;
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
function isMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.MD})`);
}

/**
 * Returns true if the current viewport is tablet
 */
function isTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.MD}) and (max-width: ${BREAKPOINTS.LG})`
  );
}

/**
 * Returns true if the current viewport is desktop
 */
function isDesktop(): boolean {
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

module.exports = {
  cn,
  delay,
  isClient,
  isServer,
  debounce,
  throttle,
  useMediaQuery,
  isMobile,
  isTablet,
  isDesktop,
  formatFileSize,
  formatDuration,
  generateRandomString,
  isValidEmail,
  truncateString,
  capitalizeFirstLetter,
  toPascalCase
};

/**
 * Safely check if code is running in browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Safely get an item from localStorage with fallback
 */
export function safeLocalStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely set an item in localStorage
 */
export function safeSaveToLocalStorage<T>(key: string, data: T): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Execute a function only in browser environment
 */
export function onlyInBrowser<T>(fn: () => T, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  return fn();
}

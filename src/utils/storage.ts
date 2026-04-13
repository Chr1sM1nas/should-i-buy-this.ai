/**
 * Get a value from chrome.storage.local.
 */
export function localGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

/**
 * Set a value in chrome.storage.local.
 */
export function localSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Get a value from chrome.storage.sync.
 */
export function syncGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

/**
 * Set a value in chrome.storage.sync.
 */
export function syncSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, resolve);
  });
}

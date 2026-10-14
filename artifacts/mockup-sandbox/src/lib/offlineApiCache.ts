type CachedResponse<T> = { key: string; value: T; cachedAt: number };

const DB_NAME = "tricycle-conduct-api-cache";
const STORE_NAME = "responses";
const DB_VERSION = 1;
const CACHE_MAX_AGE = 60 * 24 * 60 * 60 * 1000;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline response storage."));
  });
}

export async function getOfflineApiResponse<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const entry = request.result as CachedResponse<T> | undefined;
        if (!entry || Date.now() - entry.cachedAt > CACHE_MAX_AGE) {
          resolve(null);
          return;
        }
        resolve(entry.value);
      };
      request.onerror = () => reject(request.error ?? new Error("Unable to read offline response storage."));
    });
  } finally {
    database.close();
  }
}

export async function saveOfflineApiResponse<T>(key: string, value: T) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put({ key, value, cachedAt: Date.now() } satisfies CachedResponse<T>);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Unable to save offline response."));
    });
  } finally {
    database.close();
  }
}

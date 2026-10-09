import { apiRequest, type ApiUser } from "./api";

export type OfflineDriver = { id: number; fullName: string; tricycleIdentifier: string; routeArea: string | null };
export type OfflineCategory = { id: number; name: string; description?: string };
export type OfflineAccountData = {
  user: ApiUser;
  profile: Record<string, unknown>;
  drivers: OfflineDriver[];
  categories: OfflineCategory[];
  reports: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  fetchedAt: string;
};

const DB_NAME = "tricycle-conduct-offline";
const STORE_NAME = "account-data";
const DB_VERSION = 3;
const ACCOUNT_KEY = "current-account";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("reports")) database.createObjectStore("reports", { keyPath: "localReportId" });
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline account storage."));
  });
}

async function saveAccountData(data: OfflineAccountData) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put({ id: ACCOUNT_KEY, ...data });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Unable to cache account data."));
  });
  database.close();
}

export async function getOfflineAccountData(): Promise<OfflineAccountData | null> {
  const database = await openDatabase();
  const data = await new Promise<OfflineAccountData | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(ACCOUNT_KEY);
    request.onsuccess = () => resolve((request.result as OfflineAccountData | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Unable to read cached account data."));
  });
  database.close();
  return data;
}

export async function cacheStudentOfflineData(user: ApiUser) {
  if (user.role !== "STUDENT") return { complete: true, failed: [] as string[] };
  const failed: string[] = [];
  const load = async <T>(name: string, request: () => Promise<T>, fallback: T) => {
    try {
      return await request();
    } catch {
      failed.push(name);
      return fallback;
    }
  };
  const [driverData, categoryData, profileData, reportData, notificationData] = await Promise.all([
    load("drivers", () => apiRequest<{ drivers: OfflineDriver[] }>("/drivers"), { drivers: [] }),
    load("categories", () => apiRequest<{ categories: OfflineCategory[] }>("/categories"), { categories: [] }),
    load("profile", () => apiRequest<{ profile: Record<string, unknown> }>("/me"), { profile: {} }),
    load("reports", () => apiRequest<{ complaints: Array<Record<string, unknown>> }>("/complaints"), { complaints: [] }),
    load("notifications", () => apiRequest<{ notifications: Array<Record<string, unknown>> }>("/notifications"), { notifications: [] }),
  ]);
  try {
    await saveAccountData({
      user,
      profile: profileData.profile,
      drivers: driverData.drivers,
      categories: categoryData.categories,
      reports: reportData.complaints,
      notifications: notificationData.notifications,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    failed.push("device storage");
  }
  return { complete: failed.length === 0, failed };
}

import { apiRequest } from "./api";

export type OfflineReport = {
  localReportId: string;
  driverId: string;
  categoryId: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  description: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationCapturedAt?: string;
  attachments: File[];
  status: "Saved offline" | "Uploading" | "Upload failed";
  savedAt: string;
  retryCount: number;
  lastError?: string;
};

const DB_NAME = "tricycle-conduct-offline";
const STORE_NAME = "reports";
const DB_VERSION = 3;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "localReportId" });
      if (!database.objectStoreNames.contains("account-data")) database.createObjectStore("account-data", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline storage."));
  });
}

export async function saveOfflineReport(report: OfflineReport) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(report);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Unable to save the report offline."));
  });
  database.close();
}

export async function listOfflineReports(): Promise<OfflineReport[]> {
  const database = await openDatabase();
  const reports = await new Promise<OfflineReport[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as OfflineReport[]).sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
    request.onerror = () => reject(request.error ?? new Error("Unable to read offline reports."));
  });
  database.close();
  return reports;
}

export async function deleteOfflineReport(localReportId: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(localReportId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Unable to delete the offline report."));
  });
  database.close();
}

export async function syncOfflineReports() {
  const reports = await listOfflineReports();
  const results: Array<{ localReportId: string; ok: boolean; error?: string }> = [];
  for (const report of reports) {
    try {
      await saveOfflineReport({ ...report, status: "Uploading", lastError: undefined });
      const body = new FormData();
      body.append("localReportId", report.localReportId);
      body.append("driverId", report.driverId);
      body.append("categoryId", report.categoryId);
      body.append("incidentDate", report.incidentDate);
      body.append("incidentTime", report.incidentTime);
      body.append("location", report.location);
      body.append("description", report.description);
      if (report.latitude !== undefined) body.append("latitude", String(report.latitude));
      if (report.longitude !== undefined) body.append("longitude", String(report.longitude));
      if (report.locationAccuracy !== undefined) body.append("locationAccuracy", String(report.locationAccuracy));
      if (report.locationCapturedAt) body.append("locationCapturedAt", report.locationCapturedAt);
      report.attachments.forEach((file) => body.append("attachments[]", file));
      await apiRequest(`/complaints`, { method: "POST", body });
      await deleteOfflineReport(report.localReportId);
      results.push({ localReportId: report.localReportId, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      await saveOfflineReport({
        ...report,
        status: "Upload failed",
        retryCount: report.retryCount + 1,
        lastError: message,
      }).catch(() => undefined);
      results.push({ localReportId: report.localReportId, ok: false, error: message });
    }
  }
  return results;
}

export function createLocalReportId() {
  return `offline-${crypto.randomUUID()}`;
}

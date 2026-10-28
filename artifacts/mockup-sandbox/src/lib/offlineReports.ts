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

export type SubmittedOfflineReport = {
  localReportId: string;
  trackingNumber: string;
  submittedAt: string;
};

const DB_NAME = "tricycle-conduct-offline";
const STORE_NAME = "reports";
const SUBMITTED_STORE = "submitted-reports";
const DB_VERSION = 4;
type SyncResult = Array<{ localReportId: string; ok: boolean; trackingNumber?: string; error?: string }>;
let activeSync: Promise<SyncResult> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "localReportId" });
      if (!database.objectStoreNames.contains("account-data")) database.createObjectStore("account-data", { keyPath: "id" });
      if (!database.objectStoreNames.contains(SUBMITTED_STORE)) database.createObjectStore(SUBMITTED_STORE, { keyPath: "localReportId" });
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

export async function listSubmittedOfflineReports(): Promise<SubmittedOfflineReport[]> {
  const database = await openDatabase();
  const reports = await new Promise<SubmittedOfflineReport[]>((resolve, reject) => {
    const request = database.transaction(SUBMITTED_STORE, "readonly").objectStore(SUBMITTED_STORE).getAll();
    request.onsuccess = () => resolve((request.result as SubmittedOfflineReport[]).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
    request.onerror = () => reject(request.error ?? new Error("Unable to read submitted report references."));
  });
  database.close();
  return reports;
}

async function saveSubmittedAndRemoveFromQueue(localReportId: string, trackingNumber: string) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, SUBMITTED_STORE], "readwrite");
      transaction.objectStore(SUBMITTED_STORE).put({ localReportId, trackingNumber, submittedAt: new Date().toISOString() } satisfies SubmittedOfflineReport);
      transaction.objectStore(STORE_NAME).delete(localReportId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to confirm the report upload."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Unable to confirm the report upload."));
    });
  } finally {
    database.close();
  }
}

async function performOfflineReportSync(): Promise<SyncResult> {
  const reports = await listOfflineReports();
  const results: SyncResult = [];
  for (const report of reports) {
    try {
      await saveOfflineReport({ ...report, status: "Uploading", lastError: undefined });
      const body = new FormData();
      body.append("localReportId", report.localReportId);
      body.append("queueSync", "1");
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
      const response = await apiRequest<{ complaint?: { referenceNumber?: unknown } }>(`/complaints`, { method: "POST", body });
      const trackingNumber = typeof response?.complaint?.referenceNumber === "string"
        ? response.complaint.referenceNumber.trim()
        : "";
      if (!trackingNumber) {
        throw new Error("The server did not return a valid tracking number. This report remains saved for retry.");
      }
      await saveSubmittedAndRemoveFromQueue(report.localReportId, trackingNumber);
      window.dispatchEvent(new CustomEvent("app:offline-report-synced", { detail: { localReportId: report.localReportId, trackingNumber } }));
      results.push({ localReportId: report.localReportId, ok: true, trackingNumber });
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

export function syncOfflineReports() {
  if (activeSync) return activeSync;
  activeSync = performOfflineReportSync().finally(() => { activeSync = null; });
  return activeSync;
}

export function createLocalReportId() {
  return `offline-${crypto.randomUUID()}`;
}

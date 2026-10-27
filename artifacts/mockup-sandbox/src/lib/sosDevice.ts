import { Capacitor, registerPlugin } from "@capacitor/core";

export type RegisteredSosIdentity = {
  deviceId: string;
  userId: string;
  studentId: string;
  fullName: string;
  contactNumber: string;
  registeredAt: string;
};

export type PendingSosAlert = {
  alertId: string;
  deviceId: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  driverId: number | null;
  message: string;
  smsConfirmed: boolean;
  automaticSmsAttempted?: boolean;
};

export function createSosDeviceId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (!bytes.some(Boolean)) bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type SosDeviceNative = {
  saveIdentity(options: { payload: string }): Promise<{ saved: boolean }>;
  getIdentity(): Promise<{ identity: RegisteredSosIdentity | null }>;
  clearIdentity(): Promise<{ cleared: boolean }>;
  savePendingAlert(options: { payload: string }): Promise<{ saved: boolean }>;
  getPendingAlert(): Promise<{ alert: PendingSosAlert | null }>;
  clearPendingAlert(): Promise<{ cleared: boolean }>;
  openSmsComposer(options: { number: string; message: string }): Promise<{ opened: boolean }>;
  checkSmsPermission(): Promise<{ granted: boolean }>;
  requestSmsPermission(): Promise<{ granted: boolean }>;
  sendSmsDirectly(options: { number: string; message: string }): Promise<{ sent: boolean }>;
  getLaunchAction(): Promise<{ openSos: boolean }>;
};

const nativeSos = registerPlugin<SosDeviceNative>("SosDevice");

function requireAndroidSos() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("Secure offline SOS registration is available in the Android app.");
  }
}

export function getConfiguredSosSmsNumber() {
  try {
    const saved = window.localStorage.getItem("sos_sms_destination");
    if (saved?.trim()) return saved.trim();
  } catch { /* Use the build-time default if local storage is unavailable. */ }
  return String(import.meta.env.VITE_SOS_SMS_NUMBER ?? "").trim();
}

export function saveConfiguredSosSmsNumber(number: string) {
  const normalized = number.trim();
  if (!normalized) throw new Error("Enter the emergency SMS destination number.");
  if (!/^\+?[0-9().\-\s]{7,25}$/.test(normalized) || normalized.replace(/\D/g, "").length < 7) {
    throw new Error("Enter a valid emergency SMS number, including the country code.");
  }
  window.localStorage.setItem("sos_sms_destination", normalized);
}

export async function saveRegisteredSosIdentity(identity: RegisteredSosIdentity) {
  requireAndroidSos();
  await nativeSos.saveIdentity({ payload: JSON.stringify(identity) });
}

export async function getRegisteredSosIdentity() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return null;
  return (await nativeSos.getIdentity()).identity;
}

export async function clearRegisteredSosIdentity() {
  requireAndroidSos();
  await nativeSos.clearIdentity();
}

export async function savePendingSosAlert(alert: PendingSosAlert) {
  requireAndroidSos();
  await nativeSos.savePendingAlert({ payload: JSON.stringify(alert) });
}

export async function getPendingSosAlert() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return null;
  return (await nativeSos.getPendingAlert()).alert;
}

export async function clearPendingSosAlert() {
  requireAndroidSos();
  await nativeSos.clearPendingAlert();
}

export async function openSosSmsComposer(number: string, message: string) {
  requireAndroidSos();
  await nativeSos.openSmsComposer({ number, message });
}

export async function checkDirectSosSmsPermission() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return false;
  return (await nativeSos.checkSmsPermission()).granted;
}

export async function requestDirectSosSmsPermission() {
  requireAndroidSos();
  return (await nativeSos.requestSmsPermission()).granted;
}

export async function sendDirectSosSms(number: string, message: string) {
  requireAndroidSos();
  await nativeSos.sendSmsDirectly({ number, message });
}

export async function consumeSosShortcutLaunch() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return false;
  return (await nativeSos.getLaunchAction()).openSos;
}

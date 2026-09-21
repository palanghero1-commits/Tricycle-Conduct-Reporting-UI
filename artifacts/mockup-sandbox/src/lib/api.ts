const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/index.php";
const IS_ONLINE_API = API_BASE.startsWith("/api") || !API_BASE.includes("localhost:8000");
const TOKEN_KEY = "tricycle_auth_token";
const USER_KEY = "tricycle_current_user";

export type ApiUser = {
  id: string;
  fullName: string;
  email: string | null;
  role: "STUDENT" | "DRIVER" | "TODA_PRESIDENT" | "AUTHORIZED_PERSONNEL" | "SUPERADMIN" | "PNP";
};

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): ApiUser | null {
  const stored = window.localStorage.getItem(USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ApiUser;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setCurrentUser(user: ApiUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUserInitials(user: Pick<ApiUser, "fullName" | "email"> | null) {
  const source = user?.fullName?.trim() || user?.email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatPhilippineDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatPhilippineDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function philippineDateKey(value: string | Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function fetchProfilePhoto() {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/me/photo?account=${encodeURIComponent(getCurrentUser()?.id ?? "unknown")}&t=${Date.now()}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("No profile photo uploaded.");
  return response.blob();
}

export async function uploadProfilePhoto(file: File) {
  const body = new FormData();
  body.append("photo", file);
  return apiRequest<{ ok: boolean }>("/me/photo", { method: "POST", body });
}

export function deleteProfilePhoto() {
  return apiRequest<{ ok: boolean }>("/me/photo", { method: "DELETE" });
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error(IS_ONLINE_API ? "Cannot reach the online API. Check the deployment and API environment variables." : "Cannot reach the PHP API. Start it with: php -S localhost:8000 -t api-php");
  }
  const rawBody = await response.text();
  let data: any = {};
  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new Error(IS_ONLINE_API ? `The online API returned an invalid response (HTTP ${response.status}).` : `The PHP API returned an invalid response (HTTP ${response.status}). Check that the PHP API is running.`);
  }
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed.");
  }
  return data as T;
}

export async function openAttachment(attachmentId: string) {
  const blob = await fetchAttachment(attachmentId);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function fetchAttachment(attachmentId: string) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/attachments/${attachmentId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error("Unable to open the evidence file.");
  return response.blob();
}

export async function login(email: string, password: string) {
  const data = await apiRequest<{ user: ApiUser; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!data?.user || typeof data.token !== "string" || !data.token) {
    throw new Error(IS_ONLINE_API ? "The online API returned an incomplete login response." : "The PHP API returned an incomplete login response. Check the API terminal for the database error.");
  }
  setAuthToken(data.token);
  setCurrentUser(data.user);
  return data;
}

export async function registerStudent(input: {
  role: "STUDENT" | "DRIVER";
  fullName: string;
  studentId?: string;
  driverCode?: string;
  tricycleIdentifier?: string;
  email: string;
  password: string;
  confirmPassword: string;
  program?: string;
  yearLevel?: string;
  routeArea?: string;
}) {
  const data = await apiRequest<{ user: ApiUser; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!data?.user || typeof data.token !== "string" || !data.token) {
    throw new Error(IS_ONLINE_API ? "The online API returned an incomplete registration response." : "The PHP API returned an incomplete registration response. Check the API terminal for the database error.");
  }
  setAuthToken(data.token);
  setCurrentUser(data.user);
  return data;
}

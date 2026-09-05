const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/index.php";
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
    throw new Error("Cannot reach the PHP API. Start it with: php -S localhost:8000 -t api-php");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed.");
  }
  return data as T;
}

export async function login(email: string, password: string) {
  const data = await apiRequest<{ user: ApiUser; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!data?.user || !data?.token) throw new Error("The PHP API returned an incomplete login response. Check that the database and API are running.");
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
  if (!data?.user || !data?.token) throw new Error("The PHP API returned an incomplete registration response. Check that the database schema is imported and the API is running.");
  setAuthToken(data.token);
  setCurrentUser(data.user);
  return data;
}

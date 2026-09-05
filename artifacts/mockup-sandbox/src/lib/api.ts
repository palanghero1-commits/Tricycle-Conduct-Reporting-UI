const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/index.php";
const TOKEN_KEY = "tricycle_auth_token";

export type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "DRIVER" | "TODA_OFFICER" | "ADMIN" | "PNP";
};

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
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
  setAuthToken(data.token);
  return data;
}

export async function registerStudent(input: {
  fullName: string;
  studentId: string;
  email: string;
  password: string;
  confirmPassword: string;
  program?: string;
  yearLevel?: string;
}) {
  const data = await apiRequest<{ user: ApiUser; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAuthToken(data.token);
  return data;
}

const NODE_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
type Options = { method?: string; body?: unknown; skip401?: boolean };
export const TOKEN_KEY = "jobpilot_token";
export const TOKEN_EXPIRES_KEY = "jobpilot_token_expires_at";
export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRES_KEY, String(Date.now() + TOKEN_TTL_MS));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
}

export function hasValidToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));
  if (!token || !expiresAt || Date.now() >= expiresAt) {
    clearSession();
    return false;
  }
  return true;
}

export async function apiFetch<T>(
  path: string,
  options: Options = {},
): Promise<T> {
  const headers: HeadersInit = {};
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) body = options.body;
  else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(`${NODE_API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
  if (response.status === 401 && !options.skip401) {
    clearSession();
    window.dispatchEvent(new CustomEvent("jobpilot:logout"));
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message ?? payload.error ?? payload.detail ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

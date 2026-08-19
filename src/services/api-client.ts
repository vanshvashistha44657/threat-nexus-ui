/**
 * Thin typed HTTP client for the FastAPI backend.
 *
 * The base URL comes from a single environment variable: VITE_API_BASE_URL.
 * When it is not configured, the app runs in DEMO MODE and the service layer
 * serves the seeded dataset instead. No localhost URLs are hard-coded.
 */

export const API_BASE_URL: string = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export const IS_LIVE_BACKEND = API_BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "sentinelops.access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function messageFor(status: number) {
  switch (status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 422:
      return "The request payload failed validation.";
    case 429:
      return "Rate limit exceeded. Please slow down and retry shortly.";
    case 500:
      return "The backend encountered an internal error.";
    default:
      return `Request failed with status ${status}.`;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!IS_LIVE_BACKEND) {
    throw new ApiError(503, "No backend configured (VITE_API_BASE_URL is empty).");
  }
  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, "Network failure — the SentinelOps backend is unreachable.");
  }
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = undefined;
    }
    throw new ApiError(res.status, messageFor(res.status), detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

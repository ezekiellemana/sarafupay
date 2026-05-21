import type { ApiResponse } from "@/types";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  errorCode?: string;
  status?: number;
  payload?: unknown;

  constructor(message: string, options: { errorCode?: string; status?: number; payload?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.errorCode = options.errorCode;
    this.status = options.status;
    this.payload = options.payload;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({
    success: false,
    message: "Unexpected server response.",
    errorCode: "BAD_RESPONSE"
  }));
  if (!response.ok) {
    // 401 interceptor — redirect expired/deactivated sessions to the login page.
    // Condition: only fire when the store is already hydrated with a user, which
    // means this is a mid-session expiry and NOT the initial /api/auth/me call
    // (that fires before hydrated is set to true, so user is null at that point).
    if (response.status === 401 && typeof window !== "undefined") {
      const store = useAuthStore.getState();
      const onAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";
      if (!onAuthPage && store.hydrated && store.user !== null) {
        store.setUser(null);
        store.setHydrated(true);
        window.location.replace("/login?error=session_expired");
      }
    }

    const message = typeof payload?.message === "string" ? payload.message : "Request failed.";
    throw new ApiError(message, {
      errorCode: typeof payload?.errorCode === "string" ? payload.errorCode : undefined,
      status: response.status,
      payload
    });
  }
  return payload;
}

export const apiUrl = API_URL;

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && error.message !== "[object Object]") return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

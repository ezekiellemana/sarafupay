import type { ApiResponse } from "@/types";

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

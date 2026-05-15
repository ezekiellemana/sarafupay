import { api } from "@/lib/api";
import type { User } from "@/types";

export const authApi = {
  me: () => api<{ user: User }>("/api/auth/me"),
  login: (payload: { identifier: string; password: string }) =>
    api<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload: { fullName: string; phoneNumber: string; email: string; password: string; confirmPassword: string }) =>
    api<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
  updateProfile: (payload: Partial<User>) => api<{ user: User }>("/api/auth/profile", { method: "PATCH", body: JSON.stringify(payload) })
};

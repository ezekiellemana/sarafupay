"use client";

import { useEffect } from "react";
import { authApi } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Guard: LoginForm and RegisterForm call setHydrated(true) immediately after
    // a successful login/register, so the store may already be hydrated before
    // this effect fires on a soft navigation back to the root layout. Skip if so.
    if (useAuthStore.getState().hydrated) return;

    authApi
      .me()
      .then((res) => useAuthStore.getState().setUser(res.data.user))
      .catch(() => useAuthStore.getState().setUser(null))
      .finally(() => useAuthStore.getState().setHydrated(true));
  }, []); // intentionally empty — this component mounts once per page load at the root

  return <>{children}</>;
}

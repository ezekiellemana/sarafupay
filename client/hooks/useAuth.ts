"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const router = useRouter();
  const { user, hydrated, setHydrated, setUser } = useAuthStore();

  useEffect(() => {
    if (hydrated) return;
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setHydrated(true));
  }, [hydrated, setHydrated, setUser]);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  return { user, hydrated, setUser, logout };
};

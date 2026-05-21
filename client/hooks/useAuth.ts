"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const router = useRouter();
  const { user, hydrated, setUser } = useAuthStore();

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  return { user, hydrated, setUser, logout };
};

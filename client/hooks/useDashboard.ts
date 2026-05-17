"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AdminDashboardData, DashboardData } from "@/types";

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("/api/dashboard/member")
      .then((res) => setData(res.data))
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};

export const useAdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api<AdminDashboardData>("/api/dashboard/admin")
      .then((res) => {
        setData(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load admin dashboard."));
        setLoading(false);
      });
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey((k) => k + 1);
  };

  return { data, loading, error, refresh };
};

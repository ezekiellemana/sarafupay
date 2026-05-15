"use client";

import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import type { Payment } from "@/types";

export const usePayments = (query = "") => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ payments: Payment[] }>(`/api/payments/my-payments${query}`)
      .then((res) => {
        setPayments(res.data.payments);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load payments.")))
      .finally(() => setLoading(false));
  }, [query]);

  return { payments, loading, error };
};

"use client";

import { useEffect, useState } from "react";
import { collectionsApi } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import type { Collection, CollectionSummary, Payment } from "@/types";

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    collectionsApi.getMyCollections()
      .then((res) => { setCollections(res.data.collections); setError(""); })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load collections.")))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  return { collections, loading, error, reload: load };
};

export const useCollectionSummary = (id: string) => {
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!id) return;
    setLoading(true);
    collectionsApi.getSummary(id)
      .then((res) => { setSummary(res.data); setError(""); })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load summary.")))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [id]);

  return { summary, loading, error, reload: load };
};

export const useCollectionPayments = (id: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    collectionsApi.getPayments(id)
      .then((res) => setPayments(res.data.payments))
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load payments.")))
      .finally(() => setLoading(false));
  }, [id]);

  return { payments, loading, error };
};

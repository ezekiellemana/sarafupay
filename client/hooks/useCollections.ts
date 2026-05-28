"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collectionsApi } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import type { Collection, CollectionActivity, CollectionSummary, Payment, WithdrawalRecord, WithdrawalSummary } from "@/types";

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
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState("");
  const loadedIdRef = useRef<string | null>(null);

  const load = () => {
    if (!id) return;
    if (loadedIdRef.current === id) {
      setReloading(true);
    } else {
      setLoading(true);
    }
    collectionsApi.getSummary(id)
      .then((res) => { setSummary(res.data); setError(""); loadedIdRef.current = id; })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load summary.")))
      .finally(() => { setLoading(false); setReloading(false); });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [id]);

  return { summary, loading, reloading, error, reload: load };
};

export const useCollectionActivity = () => {
  const [activity, setActivity] = useState<CollectionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    collectionsApi.getActivity()
      .then((res) => { setActivity(res.data.activity); setError(""); })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load activity.")))
      .finally(() => setLoading(false));
  }, []);

  return { activity, loading, error };
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

export const useWithdrawalData = (collectionId: string) => {
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!collectionId) return;
    setLoading(true);
    Promise.all([
      collectionsApi.getWithdrawalSummary(collectionId),
      collectionsApi.getWithdrawals(collectionId),
    ])
      .then(([summaryRes, withdrawalsRes]) => {
        setSummary(summaryRes.data);
        setWithdrawals(withdrawalsRes.data.withdrawals);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load withdrawal data.")))
      .finally(() => setLoading(false));
  }, [collectionId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [collectionId]);

  return { summary, withdrawals, loading, error, reload: load };
};

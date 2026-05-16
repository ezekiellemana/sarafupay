"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { collectionsApi } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import type { Collection } from "@/types";

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    collectionsApi.getById(id)
      .then((res) => setCollection(res.data.collection))
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load collection.")))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <Link href={`/dashboard/collections/${id}`}>
            <Button variant="ghost" className="gap-2 rounded-2xl text-muted-foreground hover:text-[#071a0e]">
              <ArrowLeft className="size-4" /> Back to Collection
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#071a0e]">Edit Project / Event</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your collection details below.</p>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {collection && (
          <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <CollectionForm
              collection={collection}
              onSuccess={(updated) => {
                router.push(`/dashboard/collections/${updated._id}`);
              }}
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

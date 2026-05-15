"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Folders, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradientButton } from "@/components/shared/GradientButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { useCollections } from "@/hooks/useCollections";

export default function CollectionsPage() {
  const { collections, loading, error, reload } = useCollections();

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Your workspace"
          title="My Projects & Events"
          description="Create and manage your money collection projects. Each project gets a unique payment link you can share."
          action={
            <Link href="/dashboard/collections/new">
              <GradientButton>
                <Plus className="size-4" /> Create Project/Event
              </GradientButton>
            </Link>
          }
        />

        {loading && <LoadingState />}
        {error && (
          <ErrorState
            message={error}
            action={<Button className="rounded-2xl" variant="outline" onClick={reload}>Retry</Button>}
          />
        )}

        {!loading && !error && collections.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <EmptyState
              icon={<Folders className="size-10 text-muted-foreground/40" />}
              title="No projects yet."
              description="Create your first project or event to start collecting money and sharing a payment link."
              action={
                <Link href="/dashboard/collections/new">
                  <GradientButton>
                    <Plus className="size-4" /> Create your first project
                  </GradientButton>
                </Link>
              }
            />
          </motion.div>
        )}

        {!loading && collections.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <CollectionCard collection={c} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

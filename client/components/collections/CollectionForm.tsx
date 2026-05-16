"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collectionsApi, COLLECTION_TYPE_EMOJIS, COLLECTION_TYPE_LABELS } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import type { Collection } from "@/types";

const COLLECTION_TYPES = Object.keys(COLLECTION_TYPE_LABELS);

type FormValues = {
  title: string;
  description: string;
  collectionType: string;
  targetAmount: string;
  suggestedAmount: string;
  minimumAmount: string;
  currency: string;
  allowCustomAmount: boolean;
  startDate: string;
  endDate: string;
  visibility: string;
  paymentPurpose: string;
  thankYouMessage: string;
};

export function CollectionForm({
  onSuccess,
  collection
}: {
  onSuccess: (collection: Collection) => void;
  collection?: Collection;
}) {
  const isEdit = Boolean(collection);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: collection?.title ?? "",
      description: collection?.description ?? "",
      collectionType: collection?.collectionType ?? "custom",
      targetAmount: collection?.targetAmount?.toString() ?? "",
      suggestedAmount: collection?.suggestedAmount?.toString() ?? "",
      minimumAmount: collection?.minimumAmount?.toString() ?? "",
      currency: collection?.currency ?? "TZS",
      allowCustomAmount: collection?.allowCustomAmount !== false,
      startDate: collection?.startDate ? collection.startDate.split("T")[0] : "",
      endDate: collection?.endDate ? collection.endDate.split("T")[0] : "",
      visibility: collection?.visibility ?? "public",
      paymentPurpose: collection?.paymentPurpose ?? "",
      thankYouMessage: collection?.thankYouMessage ?? ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        collectionType: values.collectionType,
        targetAmount: values.targetAmount ? Number(values.targetAmount) : undefined,
        suggestedAmount: values.suggestedAmount ? Number(values.suggestedAmount) : undefined,
        minimumAmount: values.minimumAmount ? Number(values.minimumAmount) : undefined,
        currency: values.currency,
        allowCustomAmount: values.allowCustomAmount,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        visibility: values.visibility,
        paymentPurpose: values.paymentPurpose || undefined,
        thankYouMessage: values.thankYouMessage || undefined
      };
      let res;
      if (isEdit && collection) {
        res = await collectionsApi.update(collection._id, payload);
        toast.success("Project/event updated successfully!");
      } else {
        res = await collectionsApi.create(payload);
        toast.success("Project/event created successfully!");
      }
      onSuccess(res.data.collection);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, isEdit ? "Failed to update collection." : "Failed to create collection."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Project/Event title *</Label>
        <Input id="title" placeholder="e.g. Wedding of John & Anna" {...register("title", { required: "Title is required." })} className="rounded-2xl" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea id="description" rows={3} placeholder="Tell contributors what this is about..." {...register("description")}
          className="rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
      </div>

      {/* Collection type */}
      <div className="flex flex-col gap-2">
        <Label>Collection Type *</Label>
        <Controller name="collectionType" control={control} render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              {COLLECTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {COLLECTION_TYPE_EMOJIS[type]} {COLLECTION_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </div>

      {/* Amounts grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetAmount">Target Amount (optional)</Label>
          <Input id="targetAmount" type="number" placeholder="e.g. 500000" {...register("targetAmount")} className="rounded-2xl" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="suggestedAmount">Suggested Amount</Label>
          <Input id="suggestedAmount" type="number" placeholder="e.g. 10000" {...register("suggestedAmount")} className="rounded-2xl" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="minimumAmount">Minimum Amount</Label>
          <Input id="minimumAmount" type="number" placeholder="e.g. 1000" {...register("minimumAmount")} className="rounded-2xl" />
        </div>
      </div>

      {/* Currency + visibility */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Controller name="currency" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="TZS">TZS — Tanzanian Shilling</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                <SelectItem value="UGX">UGX — Ugandan Shilling</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Visibility</Label>
          <Controller name="visibility" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="public">🌍 Public — anyone with link can pay</SelectItem>
                <SelectItem value="private">🔒 Private — link only for trusted people</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      {/* Allow custom amount toggle */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur-sm">
        <input
          id="allowCustomAmount"
          type="checkbox"
          {...register("allowCustomAmount")}
          className="size-4 rounded accent-[#16a34a]"
        />
        <div>
          <Label htmlFor="allowCustomAmount" className="cursor-pointer font-medium">Allow custom amount</Label>
          <p className="text-xs text-muted-foreground">Payers can enter their own amount. If off, the suggested amount is fixed.</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...register("startDate")} className="rounded-2xl" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" {...register("endDate")} className="rounded-2xl" />
        </div>
      </div>

      {/* Payment purpose */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="paymentPurpose">Payment Purpose / Description for payers</Label>
        <Input id="paymentPurpose" placeholder="e.g. Contribution towards our wedding celebration" {...register("paymentPurpose")} className="rounded-2xl" />
      </div>

      {/* Thank you message */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="thankYouMessage">Thank-you message (shown after payment)</Label>
        <textarea
          id="thankYouMessage"
          rows={2}
          placeholder="e.g. Thank you for your generous support — it means the world to us!"
          {...register("thankYouMessage")}
          className="rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 rounded-2xl bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] text-white shadow-lg shadow-green-700/20 hover:brightness-105"
      >
        {loading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Project/Event")}
      </Button>
    </form>
  );
}

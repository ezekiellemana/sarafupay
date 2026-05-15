import { Schema, Types, model } from "mongoose";

export interface IContributionPlan {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  monthlyAmount: number;
  startDate?: Date;
  endDate?: Date;
  status: "active" | "paused" | "completed";
}

const contributionPlanSchema = new Schema<IContributionPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    monthlyAmount: { type: Number, default: 5000 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["active", "paused", "completed"], default: "active" }
  },
  { timestamps: true }
);

contributionPlanSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const ContributionPlan = model<IContributionPlan>("ContributionPlan", contributionPlanSchema);

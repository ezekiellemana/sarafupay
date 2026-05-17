export type Role = "member" | "admin";
export type PaymentStatus = "pending" | "completed" | "failed" | "expired" | "cancelled" | "unpaid";

export type CollectionType =
  | "monthly_contribution"
  | "event"
  | "wedding"
  | "birthday"
  | "charity"
  | "emergency"
  | "school"
  | "church"
  | "mosque"
  | "trip"
  | "business"
  | "custom";

export type CollectionStatus = "draft" | "active" | "paused" | "completed" | "closed";

export type User = {
  id: string;
  _id?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: Role;
  isActive: boolean;
  businessName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type Member = User & {
  _id: string;
  totalPaid?: number;
  paidMonths?: string[];
  collectionsCount?: number;
};

export type MemberDetail = {
  user: Member;
  collections: Project[];
  totalCollectedByCollections: number;
  recentPayments: Payment[];
};

export type Collection = {
  _id: string;
  ownerId: string;
  title: string;
  slug: string;
  description?: string;
  collectionType: CollectionType;
  targetAmount?: number;
  suggestedAmount?: number;
  minimumAmount?: number;
  currency: string;
  allowCustomAmount: boolean;
  startDate?: string;
  endDate?: string;
  status: CollectionStatus;
  visibility: "public" | "private";
  coverImageUrl?: string;
  paymentPurpose?: string;
  thankYouMessage?: string;
  showContributors?: boolean;
  recentContributors?: { name: string; amount: number; paidAt?: string }[];
  ownerName?: string | null;
  publicPaymentLink?: string;
  totalCollected: number;
  contributorCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  _id: string;
  title: string;
  description?: string;
  targetAmount?: number;
  monthlyContributionAmount: number;
  suggestedAmount?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "paused" | "completed" | "closed" | "draft";
  rules?: string[];
  createdAt?: string;
};

export type Payment = {
  _id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  snippeReference?: string;
  externalReference: string;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  payerMessage?: string;
  monthPaidFor: string;
  paidAt?: string;
  createdAt: string;
  projectId?: Project | Collection | string;
  userId?: User | string;
  ownerId?: string;
};

export type DashboardData = {
  project: Project;
  totalPaid: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  lastPayment: Payment | null;
  currentMonthPaymentStatus: PaymentStatus;
  nextDueDate: string;
  remainingAmount: number;
  contributionProgressPercentage: number;
  missedMonths: string[];
  recentPayments: Payment[];
};

export type RecentUser = {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type AdminDashboardData = {
  // existing fields
  totalCollected: number;
  totalMembers: number;
  paidMembersThisMonth: number;
  unpaidMembersThisMonth: number;
  pendingPayments: number;
  failedPayments: number;
  monthlyChart: { month: string; total: number }[];
  latestPayments: Payment[];
  projects: Project[];
  // platform-wide KPIs
  totalUsers: number;
  activeUsers: number;
  totalCollections: number;
  activeCollections: number;
  totalPayments: number;
  completedPayments: number;
  // status breakdowns
  paymentsByStatus: { status: string; count: number }[];
  projectsByStatus: { status: string; count: number }[];
  // recent activity
  recentUsers: RecentUser[];
  latestCompletedPayments: Payment[];
};

export type AuditCheckStatus = "passed" | "warning" | "missing" | "failed";

export type AuditCheck = {
  key: string;
  label: string;
  status: AuditCheckStatus;
  note: string | null;
};

export type SystemAuditData = {
  checks: AuditCheck[];
};

export type AdminPaymentDetail = {
  _id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  snippeReference?: string;
  externalReference: string;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  payerMessage?: string;
  monthPaidFor: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  payer: { fullName: string; email: string; phoneNumber: string } | null;
  collection: { title: string; slug?: string } | null;
  collectionOwner: { fullName: string; email: string } | null;
  webhookReceived: boolean;
};

export type AdminCollection = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  collectionType?: CollectionType;
  targetAmount?: number;
  monthlyContributionAmount: number;
  suggestedAmount?: number;
  minimumAmount?: number;
  currency: string;
  allowCustomAmount: boolean;
  startDate?: string;
  endDate?: string;
  status: "active" | "paused" | "completed" | "closed" | "draft";
  visibility: "public" | "private";
  coverImageUrl?: string;
  publicPaymentLink?: string;
  totalCollected: number;
  contributorCount: number;
  createdAt: string;
  updatedAt: string;
  owner: { _id: string; fullName: string; email: string } | null;
};

export type AdminCollectionDetail = {
  collection: AdminCollection;
  recentPayments: Payment[];
};

export type CollectionSummary = {
  collection: Collection;
  totalCollected: number;
  contributorCount: number;
  avgAmount: number;
  progress: number;
  recentPayments: Payment[];
  monthlyChart: { month: string; total: number; count: number }[];
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
};

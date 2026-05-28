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
  phoneNumber?: string | null;
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
  paidMonths: string[];
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
  // top collections by revenue
  topCollections: { title: string; slug: string; total: number; count: number }[];
  // platform revenue (fee-tracked payments only)
  revenueSummary: {
    grossContributionVolume: number;
    grossPlatformFees: number;
    providerCosts: number;
    netPlatformRevenue: number;
    grossPlatformFeesThisMonth: number;
    providerCostsThisMonth: number;
    netPlatformRevenueThisMonth: number;
    feePaymentCount: number;
    unknownChannelCount: number;
    byChannel: { channel: string; count: number; serviceFee: number; providerFee: number; netRevenue: number }[];
  };
};

export type ActivityEventType = "user_registered" | "collection_created" | "payment_completed";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  description: string;
  meta: Record<string, unknown>;
};

export type ActivityFeedData = {
  events: ActivityEvent[];
};

export type PlatformSettings = {
  clientUrl: string;
  serverUrl: string;
  snippeBaseUrl: string;
  webhookUrl: string;
  returnUrl: string;
  webhookEndpoint: string;
  environment: string;
  cookieName: string;
  jwtExpiresIn: string;
  supportEmail: string | null;
  appVersion: string | null;
  jwtSecretConfigured: boolean;
  snippeApiKeyConfigured: boolean;
  snippeWebhookSecretConfigured: boolean;
  mongoConfigured: boolean;
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
  contributionAmount: number;
  serviceFee: number;
  totalChargedAmount?: number;
  providerFee: number;
  paymentChannel: string;
  feeVersion: number;
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

export type CollectionActivity = {
  _id: string;
  collectionId: string | null;
  collectionTitle: string;
  collectionSlug: string;
  collectionStatus: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerName: string | null;
  paymentMethod: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "failed"
  | "cancelled";

export type WithdrawalSummary = {
  completedContributions: number;
  lockedWithdrawals: number;
  paidWithdrawals: number;
  availableForWithdrawal: number;
  withdrawalFee: number;
  minimumWithdrawalAmount: number;
  minimumBalanceRequired: number;
};

export type WithdrawalRecord = {
  id: string;
  status: WithdrawalStatus;
  requestedAmount: number;
  withdrawalFee: number;
  totalDeducted: number;
  ownerReceives: number;
  currency: string;
  destinationType: "mobile_money" | "bank";
  recipientName: string;
  maskedRecipientPhone?: string;
  maskedBankAccountNumber?: string;
  bankName?: string;
  requestedAt: string;
  approvedAt?: string;
  processingAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  payoutReference?: string;
};

export type FeePreview = {
  feesEnabled: boolean;
  contributionAmount: number;
  serviceFee: number;
  totalChargedAmount: number;
  ownerReceivableAmount: number;
  feeRate: number;
  feeMin: number;
  feeMax: number | null;
  feeVersion: number;
  paymentChannel: "mobile_money" | "card" | "unknown";
};

export type AdminWithdrawalListItem = {
  id: string;
  status: WithdrawalStatus;
  requestedAmount: number;
  withdrawalFee: number;
  totalDeducted: number;
  ownerReceives: number;
  currency: string;
  destinationType: "mobile_money" | "bank";
  ownerName: string;
  ownerEmail: string;
  collectionTitle: string;
  collectionSlug?: string;
  maskedRecipientPhone?: string;
  maskedBankAccountNumber?: string;
  requestedAt: string;
  approvedAt?: string;
  processingAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
};

export type AdminWithdrawalDetail = {
  id: string;
  status: WithdrawalStatus;
  requestedAmount: number;
  withdrawalFee: number;
  providerFee: number;
  totalDeducted: number;
  ownerReceives: number;
  currency: string;
  destinationType: "mobile_money" | "bank";
  recipientName: string;
  recipientPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ownerNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  payoutReference?: string;
  owner: { id: string; fullName: string; email: string; phoneNumber?: string };
  collection: { id: string; title: string; slug?: string };
  balanceSnapshot: { completedContributions: number; lockedWithdrawals: number; paidWithdrawals: number; availableForWithdrawal: number };
  liveBalance: { completedContributions: number; lockedWithdrawals: number; paidWithdrawals: number; availableForWithdrawal: number };
  approvedBy?: string;
  rejectedBy?: string;
  paidBy?: string;
  requestedAt: string;
  approvedAt?: string;
  processingAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
};

export type AdminWithdrawalSummary = {
  pendingCount: number;
  activeCount: number;
  paidCount: number;
  totalRequested: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
};

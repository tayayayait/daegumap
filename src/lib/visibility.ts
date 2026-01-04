import { ListingStatus, UserRole, VisibilityLevel } from "@/types/listing";

type VisibilityField =
  | "premium"
  | "deposit"
  | "monthlyRent"
  | "ownerContact"
  | "addressDetail"
  | "contractNotes"
  | "closingDate";

type MoneyField = "premium" | "deposit" | "monthlyRent";

const baseVisibility: Record<VisibilityField, Record<UserRole, VisibilityLevel>> = {
  premium: {
    guest: "masked",
    member: "masked",
    partner: "full",
    staff: "full",
    master: "full",
  },
  deposit: {
    guest: "range",
    member: "range",
    partner: "full",
    staff: "full",
    master: "full",
  },
  monthlyRent: {
    guest: "range",
    member: "full",
    partner: "full",
    staff: "full",
    master: "full",
  },
  ownerContact: {
    guest: "hidden",
    member: "hidden",
    partner: "masked",
    staff: "full",
    master: "full",
  },
  addressDetail: {
    guest: "hidden",
    member: "hidden",
    partner: "full",
    staff: "full",
    master: "full",
  },
  contractNotes: {
    guest: "summary",
    member: "summary",
    partner: "full",
    staff: "full",
    master: "full",
  },
  closingDate: {
    guest: "hidden",
    member: "hidden",
    partner: "masked",
    staff: "full",
    master: "full",
  },
};

const applyNegotiationOverrides = (
  field: VisibilityField,
  role: UserRole,
  level: VisibilityLevel
): VisibilityLevel => {
  if (role !== "partner") return level;

  if (field === "premium") return "masked";
  if (field === "ownerContact") return "hidden";
  if (field === "closingDate") return "hidden";

  return level;
};

export const getFieldVisibility = (
  field: VisibilityField,
  role: UserRole,
  status: ListingStatus
): VisibilityLevel => {
  const baseLevel = baseVisibility[field][role];
  if (status === "negotiation") {
    return applyNegotiationOverrides(field, role, baseLevel);
  }
  return baseLevel;
};

const formatMoneyFull = (value: number) => {
  if (value >= 10000) {
    const billions = Math.floor(value / 10000);
    const remainder = value % 10000;
    if (remainder === 0) return `${billions}억`;
    if (remainder >= 1000) return `${billions}억${Math.floor(remainder / 1000)}천`;
    return `${billions}억${remainder}만`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}천만`;
  }
  return `${value}만`;
};

const formatPremiumMasked = (value: number) => {
  if (value >= 10000) {
    return `${Math.floor(value / 10000)}.x억`;
  }
  if (value >= 1000) {
    return `${Math.floor(value / 1000)}천만대`;
  }
  return `${value}만대`;
};

const formatDepositRange = (value: number) => {
  if (value >= 10000) {
    return `${Math.floor(value / 10000)}억대`;
  }
  return `${Math.floor(value / 1000)}천만대`;
};

const formatRentRange = (value: number) => {
  const bucket = Math.floor(value / 100) * 100;
  return `${bucket}만대`;
};

const formatMoneyByVisibility = (
  value: number,
  field: MoneyField,
  visibility: VisibilityLevel
) => {
  if (visibility === "hidden") return null;
  if (visibility === "full") return formatMoneyFull(value);

  if (field === "premium") return formatPremiumMasked(value);
  if (field === "deposit") return formatDepositRange(value);
  return formatRentRange(value);
};

const maskContact = (value: string) => {
  const trimmed = value.trim();
  const normalized = trimmed.replace(/[^0-9]/g, "");
  if (normalized.length < 8) return "010-****-****";
  const prefix = normalized.slice(0, 3);
  const suffix = normalized.slice(-4);
  return `${prefix}-****-${suffix}`;
};

const summarizeText = (value: string, maxLength = 32) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
};

const formatDateValue = (value: Date | string) => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value);
};

export const getVisibleFieldValue = (
  field: VisibilityField,
  value: unknown,
  role: UserRole,
  status: ListingStatus
): string | null => {
  if (value === undefined || value === null) return null;
  const visibility = getFieldVisibility(field, role, status);
  if (visibility === "hidden") return null;

  switch (field) {
    case "premium":
    case "deposit":
    case "monthlyRent":
      if (typeof value !== "number") return null;
      return formatMoneyByVisibility(value, field, visibility);
    case "ownerContact":
      if (typeof value !== "string") return null;
      return visibility === "masked" ? maskContact(value) : value;
    case "addressDetail":
      return visibility === "full" ? String(value) : null;
    case "contractNotes":
      if (typeof value !== "string") return null;
      return visibility === "summary" ? summarizeText(value) : value;
    case "closingDate":
      if (visibility === "masked") return "협의중";
      return formatDateValue(value as Date | string);
    default:
      return null;
  }
};

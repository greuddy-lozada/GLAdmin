export const SUBSCRIPTION_STATUS = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
} as const;

export const SubscriptionStatus = [
  SUBSCRIPTION_STATUS.INACTIVE,
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE,
] as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[number];

export const GRACE_PERIOD_DAYS = 7;
export const SUBSCRIPTION_DURATION_DAYS = 30;

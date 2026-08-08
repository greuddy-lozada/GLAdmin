/** Mirrors POS PaymentMethod ints. */
export const PaymentMethod = {
  Cash: 1,
  PagoMovil: 2,
  Transfer: 3,
  Card: 4,
  Mixed: 5,
  Credit: 6,
} as const;

export type PaymentMethodValue =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** AR/AP open vs paid (schema status Int). */
export const ArApStatus = {
  Open: 0,
  Paid: 1,
} as const;

export const DEFAULT_DUE_DAYS = 30;

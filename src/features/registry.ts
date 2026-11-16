/**
 * The ONLY place that says what is switched on. Adding a feature = one line here.
 *
 *   live        renders the real thing
 *   comingSoon  renders the screen or control visibly but inert ("Coming soon")
 *   hidden      renders nothing
 *
 * Discount codes are not gated: they are live (cart voucher endpoints exist).
 * Sign up, OTP and password reset are not gated: the API serves them.
 * Every key set to comingSoon needs an entry in BACKEND_ASKS.md.
 */
export type FeatureState = 'live' | 'comingSoon' | 'hidden';

export const FEATURES = {
  /** Screens 31-33 and the wallet entry in Account. No wallet in the API. */
  wallet: 'comingSoon',
  /** Map, rider card and distance on Track order. Timeline itself is live. */
  liveTracking: 'comingSoon',
  /** Google, Apple and Facebook sign-in. Not in the API. */
  socialAuth: 'comingSoon',
  /** Camera icon on Home search. */
  imageSearch: 'comingSoon',
  /** Microphone icon on Home search. */
  voiceSearch: 'comingSoon',
  /** Promos tab in Inbox. */
  inboxPromos: 'comingSoon',
  /** Coupons tab in Inbox. No endpoint lists a customer's vouchers. */
  inboxCoupons: 'comingSoon',
  /** Price drop tab in Inbox. */
  inboxPriceDrops: 'comingSoon',
  /** Saved cards, screens 29-30. No payment provider, so no token. */
  savedCards: 'comingSoon',
  /** FAQ rows on Product details. Not in the product payload. */
  productFaq: 'comingSoon',
  /** Card, PayPal, Apple Pay and Google Pay. No payment provider. */
  onlinePayments: 'comingSoon',
  /**
   * Cash on delivery at checkout. The owner wants it live, but the API has no
   * cash_on_delivery method yet. Waits for the backend proposal (BACKEND_ASKS.md).
   */
  cashOnDelivery: 'comingSoon',
  /**
   * Buyer chat (/me/conversations). Live on the backend, but every call needs a
   * sign-in token, so it is built with the account slice, not before it.
   */
  buyerChat: 'comingSoon',
} as const satisfies Record<string, FeatureState>;

export type FeatureKey = keyof typeof FEATURES;

export type FeatureTable = Record<FeatureKey, FeatureState>;

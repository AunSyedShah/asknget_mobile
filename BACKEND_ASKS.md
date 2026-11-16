# Backend asks

Things the mobile app needs from the backend, or gaps where a screen cannot be real yet.
Each gap is also a key in `src/features/registry.ts` set to `comingSoon`.
The backend session (`docs/api-changes.md` in the backend repository) answers these.

## Answered (2026-11-16, checked against the live `openapi.json`)

1. **Environment.** `https://asknget.co.za/api/v1` is the only backend and is the EC2 *test* server. It is not production: no payments, no real customers, data can be reset. Mail and OTP are **not delivered**. Codes and reset links only go to the server log, and SMS is not implemented. A tester will never receive a code unless the owner sets up SMTP, or the backend session reads the log for them (only if the owner says so). `POST /auth/register` and `POST /auth/login` need no mail. Resend returns 429 during a cooldown. `password_reset` never reveals whether an e-mail exists. The seeded `@asknget.demo` accounts are disabled. **The owner must share a customer login** through a git-ignored `.env.local`.
2. **Changelog.** No contract change since the 2026-10-27 entry in `docs/api-changes.md`. That entry went live on 2026-10-29, touches seller and admin endpoints only, and is not breaking for the app. The old "234 operations" figure was stale. The live document has **244 operations in 213 paths**, and the backend corrected the count. Take the first snapshot from the live `openapi.json`.
3. **Checkout payment.** `CheckoutIn.payment_method_type` is `card | bank_transfer | paypal | google_pay | apple_pay`. **There is no cash-on-delivery value.** Every order starts `pending_payment` / `unpaid`, and sellers only see it after staff confirm it. Send `CheckoutIn.channel = "mobile_app"` (enum `web | mobile_app | other`). There is no endpoint listing the methods a market accepts. `GET /site-info` has `accepted_payments`, a free list of display strings that is currently empty. `GET /me/payment-methods` is only saved cards.
4. **Buyer chat.** **Live for ZA customers, no feature flag.** Endpoints: `GET`/`POST /me/conversations`, `GET /me/conversations/{id}`, `GET`/`POST .../messages` (poll with `after=<message id>`), `POST .../read`, `GET /me/chat/summary`. A token is required. Opening a conversation needs **no order id**: `ConversationOpenIn = {store_id | store_slug, order_id?, subject, body}`. The store must be active and in the buyer's market (`X-Region`), else 404. Limits: 30 messages per minute (429), empty or over-long body (422). WebSocket is off; poll.
5. **Login roles.** `POST /auth/login` returns `AuthOut = {user, tokens}`. `user` has `is_seller` and `is_staff`. The backend lets seller and staff accounts sign in on the same endpoint. Refusing them is an app rule, to be done from those flags.
6. **Order tracking.** `POST /orders/track` needs **both** `order_number` and `email`, with no auth. Response `TrackOut = {order_number, status, status_label, placed_at, delivery_method, items[], events[]}`. Each event is `{status, label, note, location, created_at}`. Statuses: `pending_payment`, `confirmed`, `processing`, `packed`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`, `returned`, `refunded`. **No courier, tracking number, ETA, rider or map fields.** Signed-in buyers use `GET /me/orders/{id}` (`OrderDetailOut`, same events plus totals, address, `voucher_code`, `can_cancel`, `can_reorder`, `return_eligible_until`), `POST /me/orders/{id}/cancel | reorder | returns`, and `GET /me/orders/{id}/returnable`.
7. **Lookups.** **No province list exists.** Addresses take `province` as free text. A market has only `region_label` and `postal_code_regex` on `GET /regions/current`. `GET /returns/policy` is public and scoped by `X-Region`: `PolicyOut = {country, accepts_returns, change_of_mind_days, defect_days, restocking_fee_bps, summary, terms, url, reasons[], max_photos, allow_escalation, courier}`.
8. **Vouchers.** No endpoint lists a customer's vouchers, and none is planned. The app applies a code the buyer types: `POST /cart/voucher {code}` (200, 404 unknown, 409 not usable, 422), `DELETE /cart/voucher`. Demo codes on the test server: `SAVE20` (20 percent, minimum subtotal) and `WELCOME5` (fixed 500 cents, once per user).

## Proposed backend work (waiting for the owner's yes)

The backend session will not build these until the owner agrees.

| Proposal | What it gives the app | App status |
|---|---|---|
| Add `cash_on_delivery` to the payment enum. A COD order goes straight to `confirmed` with `payment_status = unpaid`, is collected at delivery and marked paid on delivery. Visible to the seller. | Cash on delivery at checkout. | `cashOnDelivery` is `comingSoon` until it lands. |
| `GET /payment-methods` (public, market-scoped), returning `[{type, label, available, reason}]`. | The app shows card, PayPal, Apple Pay and Google Pay as coming soon from the server, not hard-coded. | `onlinePayments` is `comingSoon`. |
| A per-market list of provinces, exposed on `GET /regions/current`. | A province picker for the ZA address form. | Free-text field until the owner decides. |

### Owner's direction (2026-11-16, sent to the backend session)

- **Payment methods come from the server.** Cash on delivery is one entry in `GET /payment-methods`, next to card, bank transfer, PayPal, Apple Pay and Google Pay. Each entry is `{type, label, available, reason}`. The app shows `available: false` entries as "Coming soon". This replaces the hard-coded `onlinePayments` and `cashOnDelivery` keys at checkout.
- **Provinces come from a pre-approved list.** The app shows a picker and does not accept free text for new addresses. Proposed: the nine ZA provinces as ISO 3166-2 codes with labels (`ZA-EC` Eastern Cape, `ZA-FS` Free State, `ZA-GP` Gauteng, `ZA-KZN` KwaZulu-Natal, `ZA-LP` Limpopo, `ZA-MP` Mpumalanga, `ZA-NC` Northern Cape, `ZA-NW` North West, `ZA-WC` Western Cape). Admins can change labels, not codes. Address writes must use a listed code (422 otherwise). Existing free-text rows need a mapping rule.
- **Open:** the backend's answer on the endpoint choice (`/regions/current` or `GET /provinces?country=ZA`), the enum values and `reason` format, the migration of existing addresses, and whether the owner must approve first.

## Gaps (comingSoon in the registry)

| Key | Screen | What is missing in the API |
|---|---|---|
| `wallet` | 31-33 My wallet, Add money, Top up; wallet entry in Account | No wallet, balance, top-up or cashback endpoints. |
| `liveTracking` | 19 Track order: map, rider card, distance | No courier, rider or ETA fields (see answer 6). The timeline is live through `/orders/track`. |
| `socialAuth` | 05 and 06: Google, Apple, Facebook | No social sign-in provider. WhatsApp sign-in exists at `/auth/whatsapp` (not in the design). |
| `imageSearch` | 11 Home: camera icon | No image search. |
| `voiceSearch` | 11 Home: microphone icon | No voice search. |
| `inboxPromos` | 15 Inbox: Promos tab | Notifications only have `tab=orders|returns|all`. |
| `inboxCoupons` | 15 Inbox: Coupons tab | No endpoint lists vouchers (answer 8). |
| `inboxPriceDrops` | 15 Inbox: Price drop tab | No price-drop notifications. |
| `savedCards` | 29-30 Payment methods, Add new card | `/me/payment-methods` stores a provider token and last four digits. No provider is integrated. The app must never send or store raw card numbers. |
| `productFaq` | 14 Product details: FAQ rows | `ProductDetailOut` has no FAQ field. |
| `onlinePayments` | 29 Payment methods: card, PayPal, Apple Pay, Google Pay | No payment provider (see proposal 2). |
| `cashOnDelivery` | Checkout: cash on delivery | No COD value in the API (see proposal 1). |
| `buyerChat` | Track order "Contact Support", Inbox support | Live on the backend (answer 4), but needs sign-in. Built with the account slice. |

## Decisions that are not backend asks

- The app is customer-only. Seller and staff accounts are refused at sign-in, from `is_seller` and `is_staff` (answer 5). This is built with the account slice.
- Sign up, OTP and password reset are live in the app as the owner asked. A code will not reach a tester until mail or SMS is set up (answer 1). Screens must show a clear message when no code arrives.
- The market is ZA only. The API origin is one build variable, `EXPO_PUBLIC_API_ORIGIN`, default `https://asknget.co.za`.
- Later option, not built: let the server override the registry per market (a capabilities endpoint). The registry is shaped so this is a drop-in.

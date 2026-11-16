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

### Backend answer (2026-11-16): designed, NOT built, waiting for the owner's yes in the backend chat

Estimate: about 1.5 to 2 working days, as one PR into `main` that the owner merges. The backend will message the app when the owner decides and again when it is deployed. Until then the app keeps COD and the payment list `comingSoon` and uses a free-text province field.

**Payment methods**
- Types (snake_case): `card`, `bank_transfer`, `paypal`, `google_pay`, `apple_pay` (existing), plus `cash_on_delivery` (new).
- `GET /payment-methods` (public, scoped by `X-Region`) returns `[{type, label, available, reason}]`, ordered by `sort_order`. `label` is display text in the request language. `reason` is a **machine code**, null when available: `coming_soon`, `not_configured`, `disabled`. The app maps codes to its own copy.
- Every market lists every type. Availability is per market, set by staff, and also limited by what the code can really do. Card, PayPal, Apple Pay and Google Pay stay unavailable until a provider exists.
- Checkout rejects an unavailable type with `409 payment_method_unavailable`.
- COD: the order goes straight to `confirmed`, `payment_status` stays `unpaid`, becomes paid when the order is marked delivered, and sellers see it. Sellers no longer hide only `pending_payment` orders.
- Owner decisions still open (they change the app copy): a maximum COD order value (optional `limits: {max_cents}` on the entry); whether `bank_transfer` is offered without bank details to show the buyer; refunds for COD orders (a manual step, since there is no original payment); whether COD needs a verified phone.
- `/site-info` `accepted_payments` stays as footer text. The app ignores it.

**Subdivisions: WITHDRAWN (2026-11-16).** The backend will not build a province list. Nothing in the backend owns one, and nothing is planned. The earlier design (`subdivisions` on `GET /regions/current`, ISO codes) is void.

**Address form (backend answer, 2026-11-16)**
- An address is `full_name`, `phone`, `street_address`, `unit_floor` (optional), `city`, `province`, `postal_code`, `country`, `delivery_instructions` (optional).
- `province` is **optional free text**, max 100 characters. There is no list. Pricing and delivery do not depend on it. Whether ZA couriers need it is a business question for the owner.
- Label the `province` input with `region_label` from `GET /regions` or `GET /regions/current` (`country.region_label`: "Province" for ZA and PK, staff-editable). The word is not hard-coded. Naming clash: in the API, "region" means the market (`X-Region`).
- **Send `country` explicitly** on saved addresses (`POST`/`PATCH /me/addresses`), using the market code from `GET /regions` (e.g. `ZA`). The schema defaults `country` to `PK` today, so an omitted value would store Pakistan. The backend will fix the default with its next PR, once the owner says go. Checkout's inline address may leave `country` blank: blank means the shopping market.
- **Postal code is not checked by the server** beyond 2 to 20 characters. The app validates it client-side with the market's `postal_code_regex` (ZA: `^\d{4}$`) from `GET /regions/current`.
- **Phone** uses the server's `PhoneStr` validator. Use the market's `phone_prefix` from `/regions` for the input hint.

**Owner's direction (2026-11-16, sent to the backend session)**

- **Payment methods come from the server.** Cash on delivery is one entry in `GET /payment-methods`, next to card, bank transfer, PayPal, Apple Pay and Google Pay. Each entry is `{type, label, available, reason}`. The app shows `available: false` entries as "Coming soon". This replaces the hard-coded `onlinePayments` and `cashOnDelivery` keys at checkout.
- **Region means the market (country), not a province.** The app runs in several countries, so "region" is the market the buyer is in. It is chosen from the server's list of active regions (`GET /regions`, currently ZA only) and carried by `X-Region`. The earlier province proposal (ISO 3166-2 codes, `GET /provinces`) is **withdrawn**. Do not build it.
- **Open:** the enum values and `reason` format for `GET /payment-methods` (answered above: machine codes). The owner must still decide whether ZA addresses need a province at all.

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

Buyer chat is **not** a gap any more: it is `live` in the registry (answer 4). One piece stays out: the Track order "Contact Support" button. A chat needs a store id or slug, and an order item carries only a store name, so the app cannot open a chat from an order. **Ask:** add `store_id` (or `store_slug`) to `OrderItemOut`, or confirm a platform-support chat is planned. Until then, that button is shown as coming soon.

## Decisions that are not backend asks

- The app is customer-only. Seller and staff accounts are refused at sign-in, from `is_seller` and `is_staff` (answer 5). Built.
- Sign up, OTP and password reset are live in the app as the owner asked. A code will not reach a tester until mail or SMS is set up (answer 1). The screens say so when no code arrives.
- Checkout stops before payment: cash on delivery and online payments are coming soon, so "Place order" is inert and nothing is submitted. Checkout needs a sign-in, because the app has no inline guest address form yet (the API supports guest checkout).
- Backend features with no Figma screen are not built: returns requests (`/me/orders/{id}/returns`), writing a review, WhatsApp sign-in, saved-card creation.
- Figma features with no backend are coming soon, one registry key each (table above). Onboarding screens (02-04) and the share button on Product details are not built.
- The market is ZA only. The API origin is one build variable, `EXPO_PUBLIC_API_ORIGIN`, default `https://asknget.co.za`.
- Later option, not built: let the server override the registry per market (a capabilities endpoint). The registry is shaped so this is a drop-in.

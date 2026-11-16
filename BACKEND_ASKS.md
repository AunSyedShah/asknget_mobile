# Backend asks

Things the mobile app needs from the backend, or gaps where a screen cannot be real yet.
Each gap is also a key in `src/features/registry.ts` set to `comingSoon`.
The backend session (`docs/api-changes.md` in the backend repository) answers these.

Status: **open** until the answer is written in the row, then **answered** with the date.

## Open questions sent 2026-11-16

| # | Question | Status |
|---|---|---|
| 1 | Is `https://asknget.co.za/api/v1` production now, or the test server? Are OTP and password-reset mails sent there? The owner says customers are seeded in production. | open |
| 2 | List every contract change since 2026-10-27 (the live spec has 244 operations; `api-changes.md` says 234). Which are breaking? | open |
| 3 | Which `CheckoutIn` value selects cash on delivery? Does such an order go straight to placed/confirmed? Is there a customer endpoint listing accepted payment methods for ZA? | open |
| 4 | Buyer chat (`/me/conversations`, `/me/chat/summary`, messages) answers 401 without a token, so it is deployed. Confirm it is live for ZA customers, not behind a flag, and needs no order id. | open |
| 5 | Does `POST /auth/login` return the account role, so a seller or staff login can be refused in the customer app with a clear message? | open |
| 6 | What does `POST /orders/track` return (timeline events, status names, shipment fields)? Is email required for guest tracking? | open |
| 7 | Is there a customer-readable list of ZA provinces for the address form? Is `/returns/policy` readable by a customer? | open |
| 8 | No endpoint lists a customer's available vouchers. Planned, or should the app only apply a code the buyer types? | open |

## Gaps (comingSoon in the registry)

| Key | Screen | What is missing in the API |
|---|---|---|
| `wallet` | 31-33 My wallet, Add money, Top up; wallet entry in Account | No wallet, balance, top-up or cashback endpoints. |
| `liveTracking` | 19 Track order: map, rider card, distance | No courier location or rider data. The timeline itself is live through `/orders/track`. |
| `socialAuth` | 05 and 06: Google, Apple, Facebook | No social sign-in provider. WhatsApp sign-in exists at `/auth/whatsapp` (not in the design). |
| `imageSearch` | 11 Home: camera icon | No image search. |
| `voiceSearch` | 11 Home: microphone icon | No voice search. |
| `inboxPromos` | 15 Inbox: Promos tab | Notifications have only `tab=orders|returns|all`. |
| `inboxCoupons` | 15 Inbox: Coupons tab | No endpoint lists a customer's vouchers (see question 8). |
| `inboxPriceDrops` | 15 Inbox: Price drop tab | No price-drop notifications. |
| `savedCards` | 29-30 Payment methods, Add new card | `/me/payment-methods` stores a provider token and last four digits, and no payment provider is integrated. The app must never send or store raw card numbers. |
| `productFaq` | 14 Product details: FAQ rows | `ProductDetailOut` has no FAQ field. |
| `onlinePayments` | 29 Payment methods: card, PayPal, Apple Pay, Google Pay | No payment provider. Cash on delivery is live (question 3). |

## Decisions that are not backend asks

- The app is customer-only. Seller and staff accounts are refused at sign-in (question 5).
- The market is ZA only. The API origin is one build variable, `EXPO_PUBLIC_API_ORIGIN`, default `https://asknget.co.za`.
- Buyer chat is in the registry as `comingSoon` until question 4 is answered. If it is live, switch the key to `live` and build the chat screens.
- Later option, not built: let the server override the registry per market (a capabilities endpoint). The registry is shaped so this is a drop-in.

# Aurevo backend

Real endpoints for movie/music-video search, checkout, and webhook-verified
payments. Nothing here is simulated — every route talks to a real provider,
a public blockchain explorer, or Firestore.

## One-time setup

1. **Firebase service account** — Firebase Console -> Project settings ->
   Service accounts -> "Generate new private key". Either save the file as
   `server/serviceAccountKey.json` (local/Termux, gitignored) or paste its
   full contents into the `FIREBASE_SERVICE_ACCOUNT_JSON` env var (Render).

2. **Firestore security rules** — Firebase Console -> Firestore Database ->
   Rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /payments/{paymentId} { allow read, write: if false; }
       match /paymentReviews/{reviewId} { allow read, write: if false; }
     }
   }
   ```
   (Both payment collections are backend-only — the Admin SDK bypasses
   these rules on purpose, since only your verified server should ever
   write a "confirmed payment".)

3. **Install and run:**
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Register the Paystack webhook** (source of truth for card payments —
   the redirect-based verify is only a same-session fallback):
   Paystack dashboard -> Settings -> API Keys & Webhooks -> Webhook URL ->
   `https://YOUR-DEPLOYED-BACKEND/api/v1/webhooks/paystack`

## USDT payments — how confirmation actually works

There's no payment processor involved. The flow:
1. `POST /api/v1/checkout/usdt-manual` returns your wallet address + the
   exact amount for the chosen plan
2. The user pays from their own wallet, then submits the transaction ID
3. `POST /api/v1/checkout/usdt-manual/confirm` looks that txid up on
   **Tronscan** (a public, free, keyless TRON blockchain explorer API) and
   checks: is it confirmed, did it send USDT (not just TRX), did it go to
   *your* address, was the amount enough. All of that is publicly
   verifiable — nobody can fake a blockchain record.
4. If the user genuinely can't get a copyable txid, `submit-proof` queues
   it in Firestore's `paymentReviews` collection instead — this does
   **not** auto-confirm (an image alone proves nothing), it just waits for
   you to approve it by hand:
   ```bash
   curl -X POST https://YOUR-BACKEND/api/v1/admin/payments/REVIEW_ID/approve \
     -H "X-Admin-Secret: your-admin-secret"
   ```

## Health check (for UptimeRobot)

`GET /healthz` returns `{ status: "ok" }` with no auth required — point an
uptime monitor at `https://YOUR-DEPLOYED-BACKEND/healthz` every 5 minutes
to keep a free-tier host from spinning down.

## What's real now

- Every user identity comes from a verified Firebase ID token — never
  trusted from the request body
- `db.js` writes real Firestore documents: `users/{uid}` (profile +
  subscription expiry), `payments/{reference}` (one per confirmed payment,
  idempotent by provider reference / txid), `paymentReviews/{id}` (pending
  manual approvals)
- Paystack webhook signatures are verified before any data is trusted
- USDT payments are verified against the actual TRON blockchain, not
  trusted on the user's word
- A successful payment extends `subscriptionExpiresAt` on the user's
  profile by the plan's billing period

## Still not wired

- No route yet actually checks `subscriptionExpiresAt` to gate access to
  paid content — `isSubscriptionActive(uid)` in `db.js` is ready to be
  called from wherever that gate belongs
- No deployment beyond what `render.yaml` sets up — see the repo root
  README for the Render walkthrough

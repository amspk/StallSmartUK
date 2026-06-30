# Smart Stall

A mobile-and-tablet-friendly app for small food/product stalls (1–10 items).

Two sides:
- **Customer app** (`/`) — browse the menu, see allergy info and stock, add to basket, pay (mock myPOS), and track order status live.
- **Owner app** (`/owner`) — secure login, see incoming orders, accept/reject/mark ready/complete, and manage the menu (add/edit items, price, image, description, allergies, stock, out-of-stock toggle).

Built with React + Vite, Supabase (Postgres + Realtime + Edge Functions).

---

## 1. How the pieces fit together

- **Database**: Supabase Postgres. Tables: `stalls`, `owners`, `menu_items`, `orders`, `order_items`. See `supabase/migrations/0001_init.sql`.
- **Owner auth**: a custom `owners` table (email + bcrypt password hash), not Supabase Auth, as requested. Login and all owner writes go through two Supabase Edge Functions so the password hash and write access never touch the browser directly:
  - `owner-login` — checks email/password against the bcrypt hash, returns a signed session token.
  - `owner-action` — every owner-only write (accept/reject orders, add/edit/delete menu items, toggle stock) requires that token.
  - `owner-create` — one-time use to create your first owner account (protected by a secret you set yourself).
- **Customer writes** (placing an order) use the Supabase anon key directly, allowed by Row Level Security policies that let anyone INSERT an order but never read/write the `owners` table or arbitrarily edit other people's orders.
- **Realtime**: both the owner orders dashboard and the customer order-tracking page subscribe to Postgres changes, so updates appear live without refreshing.
- **Payment**: `src/lib/mockMyPos.js` simulates myPOS — swap its internals for the real myPOS Checkout API call later without touching any UI code. Cards ending in `0000` simulate a decline, for testing.

---

## 2. Supabase setup (one-time)

### a. Run the database migration
In your Supabase project dashboard → SQL Editor, paste and run the contents of `supabase/migrations/0001_init.sql`. (Or with the Supabase CLI: `supabase db push`.)

This creates the tables, sets up Row Level Security, and seeds one demo stall.

### b. Install the Supabase CLI (if you don't have it)
```bash
npm install -g supabase
```

### c. Link your project and deploy the Edge Functions
```bash
cd smart-stall
supabase login
supabase link --project-ref efdzpbbteieuzdyztvde

# Set secrets the functions need (pick your own long random strings for these two):
supabase secrets set OWNER_SESSION_SECRET="a-long-random-string-you-make-up"
supabase secrets set OWNER_SETUP_SECRET="a-different-long-random-string"

# Deploy
supabase functions deploy owner-login
supabase functions deploy owner-action
supabase functions deploy owner-create
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available to your functions — you don't need to set those yourself.

### d. Create your first owner login
Call the `owner-create` function once (e.g. with `curl`, replacing the secret and your real email/password):

```bash
curl -X POST https://efdzpbbteieuzdyztvde.supabase.co/functions/v1/owner-create \
  -H "Content-Type: application/json" \
  -d '{
    "setup_secret": "the-OWNER_SETUP_SECRET-you-set-above",
    "email": "owner@yourstall.com",
    "password": "choose-a-strong-password",
    "stall_id": "00000000-0000-0000-0000-000000000001"
  }'
```

That's your login for `/owner/login`. You can create more owner accounts the same way later, or remove the `owner-create` function once you're done using it, for extra safety.

---

## 3. Run it locally

```bash
npm install
npm run dev
```

Your `.env` already has your Supabase URL and anon key filled in — do not commit `.env` (it's gitignored).

- Customer app: `http://localhost:5173/`
- Owner login: `http://localhost:5173/owner/login`

---

## 4. Deploy (recommended: Vercel)

This is the easiest, most maintainable path long-term: free tier, auto-deploys whenever you push to GitHub, real HTTPS URL, easy custom domain later.

1. Push this project to your GitHub repo (`amspk/StallSmartUK`).
2. Go to vercel.com, "Add New Project", import that repo.
3. Vercel auto-detects Vite. Before deploying, add your environment variables in the Vercel project settings (Settings -> Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Every future `git push` to your main branch auto-redeploys.

(Netlify works the same way if you prefer it.)

---

## 5. Going live with real myPOS payments later

Replace the body of `mockMyPosPay` in `src/lib/mockMyPos.js` with a real call to the myPOS Checkout API (this typically means creating a payment session server-side, e.g. another Supabase Edge Function, since myPOS API credentials must never sit in frontend code). The calling code in `CheckoutPage.jsx` only expects `{ success, reference, error? }` back, so the rest of the app doesn't need to change.

---

## 6. Notes / things you may want to adjust

- **Multiple stalls**: right now everything is scoped to one seeded `stall_id`. If you want to support multiple stalls under one app later, you'd make the stall id dynamic (e.g. from a URL like `/s/your-stall-slug`) instead of the fixed constant in `src/lib/supabaseClient.js`.
- **Refunds**: a failed/rejected order is marked as such in the database, but no real refund is issued automatically (mock payments have nothing to refund). When you wire up real myPOS, you'll want a refund call triggered on reject.
- **Owner password reset**: there's no self-service "forgot password" flow yet -- re-run `owner-create` (it will fail on duplicate email; you'd add an `owner-reset-password` function following the same bcrypt pattern if you need this).

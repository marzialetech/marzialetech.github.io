# Pay Button Setup (Stripe + Supabase)

The Pay button uses **Stripe** for card processing and a **Supabase Edge Function** to create PaymentIntents. Money goes to your connected Stripe account (and then to your Brex or bank via Stripe payouts).

## 1. Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) and sign in.
2. Get your **Publishable key** (starts with `pk_test_` or `pk_live_`) from [API Keys](https://dashboard.stripe.com/apikeys).
3. Get your **Secret key** (starts with `sk_test_` or `sk_live_`) — you’ll use this in Supabase.
4. In `index.html`, replace `pk_test_YOUR_STRIPE_PUBLISHABLE_KEY` with your publishable key:
   ```javascript
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_xxxxxxxxxxxx';  // or pk_live_ for production
   ```

## 2. Supabase Edge Function

**One-time: log in to Supabase** (opens browser):

```bash
cd /Users/jjmarzia/marzialetech.github.io
npx supabase login
```

**Deploy the function** (run from project root):

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxx ./scripts/deploy-pay-function.sh
```

Replace `sk_test_xxxxxxxx` with your Stripe secret key from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys). The script will link the project, set the secret, and deploy.

## 3. Verify

1. Open the site and click the Pay button.
2. Enter an amount, name, email, and card details.
3. Use [Stripe test cards](https://docs.stripe.com/testing#cards) (e.g. `4242 4242 4242 4242`) when using a test key.

## 4. Production

- Switch to live keys: `pk_live_...` and `sk_live_...`.
- Complete [Stripe account activation](https://dashboard.stripe.com/account/onboarding) so you can receive payouts.
- Configure payouts in Stripe to send funds to your Brex or bank account.

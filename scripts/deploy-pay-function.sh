#!/bin/bash
# Deploy the Pay button Edge Function to Supabase.
# Prerequisites:
#   1. Run once: npx supabase login   (opens browser)
#   2. Have your Stripe secret key ready (sk_test_... from dashboard.stripe.com/apikeys)
#
# Usage:
#   STRIPE_SECRET_KEY=sk_test_xxxx ./scripts/deploy-pay-function.sh
#   Or: ./scripts/deploy-pay-function.sh   (will prompt for key)

set -e
cd "$(dirname "$0")/.."

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Enter your Stripe secret key (sk_test_... or sk_live_...):"
  read -s STRIPE_SECRET_KEY
  echo
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Error: STRIPE_SECRET_KEY is required"
  exit 1
fi

echo "Linking project..."
npx supabase link --project-ref qvrrlfzogtuahmvsbvmu

echo "Setting STRIPE_SECRET_KEY secret..."
npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

echo "Deploying create-payment-intent function..."
npx supabase functions deploy create-payment-intent

echo "Done! The Pay button should now work."

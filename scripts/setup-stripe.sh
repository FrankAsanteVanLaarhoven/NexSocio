#!/usr/bin/env bash
# Stripe setup for NexSocio subscriptions
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> NexSocio Stripe setup"
echo ""
echo "Create two recurring products in Stripe Dashboard (https://dashboard.stripe.com/products):"
echo ""
echo "  1. NexSocio Business Tools — £19/month recurring"
echo "     → copy Price ID → STRIPE_BUSINESS_PRICE_ID"
echo ""
echo "  2. NexSocio Corporate Networking — £49/month recurring"
echo "     → copy Price ID → STRIPE_CORPORATE_PRICE_ID"
echo ""
echo "Then in Stripe → Developers → Webhooks → Add endpoint:"
echo "  URL: https://professional.nexsocio.com/api/v1/billing/webhook"
echo "  Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted"
echo "  → copy Signing secret → STRIPE_WEBHOOK_SECRET"
echo ""
echo "API keys → Developers → API keys:"
echo "  STRIPE_SECRET_KEY=sk_live_..."
echo "  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  (Vercel only)"
echo ""

if command -v stripe >/dev/null 2>&1 && [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "==> Stripe CLI detected — creating products..."
  biz=$(stripe prices create \
    --unit-amount=1900 --currency=gbp \
    -d "recurring[interval]=month" \
    -d "product_data[name]=NexSocio Business Tools" 2>/dev/null | grep -o 'price_[^"]*' | head -1 || true)
  corp=$(stripe prices create \
    --unit-amount=4900 --currency=gbp \
    -d "recurring[interval]=month" \
    -d "product_data[name]=NexSocio Corporate Networking" 2>/dev/null | grep -o 'price_[^"]*' | head -1 || true)
  [[ -n "${biz}" ]] && echo "STRIPE_BUSINESS_PRICE_ID=${biz}"
  [[ -n "${corp}" ]] && echo "STRIPE_CORPORATE_PRICE_ID=${corp}"
else
  echo "(Install Stripe CLI + export STRIPE_SECRET_KEY to auto-create prices)"
fi

echo ""
echo "Add secrets to .env.prod on API host (see .env.prod.example)"
echo "Sync publishable key to Vercel: ./scripts/vercel-env-sync.sh"
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}/infrastructure/cdk"

echo "==> Synthesizing NexusStagingStack..."
npx cdk synth NexusStagingStack

echo ""
echo "==> To deploy (requires AWS credentials):"
echo "    npx cdk deploy NexusStagingStack"
echo ""
echo "==> Post-deploy checklist:"
echo "  1. Update nexus/staging/database secret (DATABASE_URL)"
echo "  2. Update nexus/staging/vapid secret (generate: npx web-push generate-vapid-keys)"
echo "  3. Update nexus/staging/turn secret (coturn or Metered credentials)"
echo "  4. Set NEXT_PUBLIC_* URLs in apps/web for staging domain"
echo "  5. ArgoCD sync: infrastructure/k8s/staging"
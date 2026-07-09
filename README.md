# Nexus

**Repository:** [github.com/FrankAsanteVanLaarhoven/NExusio](https://github.com/FrankAsanteVanLaarhoven/NExusio)

**World-Leading SOTA Socio-Technical Platform** — Production-grade monorepo implementing zero-trust security, ZKP-based age-adaptive modes, unified professional-personal context, and architecturally complete Robot/Embodied Agent integration.

*Blueprint Version 1.0 | 09 July 2026*

## Architecture

```
nexus/
├── apps/web/           # Next.js 15 + React 19 (Ephemeral Precision UI)
├── packages/ui/        # Shared design system
├── packages/types/     # Shared TypeScript types
├── packages/contracts/ # OpenAPI contracts
├── services/           # FastAPI bounded contexts (DDD structure)
├── libs/nexus-common/  # Shared Python libraries
├── infrastructure/     # AWS CDK + Kubernetes + Istio
└── tests/              # Contract & integration tests
```

## Bounded Contexts

| Service | Port | Status |
|---------|------|--------|
| Identity & Verification | 8001 | **MVP** — ZKP, registration, profiles, search |
| Social Graph | 8002 | **MVP** — Connect, accept, connection feed |
| Content & Media | 8003 | **MVP** — Posts, global/connections/professional feeds |
| Professional Networking | 8004 | **MVP** — Dashboard, professional profile |
| Safety & Moderation | 8005 | **MVP** — Moderation engine, reports, dashboard |
| Robot & Embodied Agent | 8006 | **MVP** — Digital twins, safety commands |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 1. Install dependencies

```bash
cd nexus
npm install
pip install -r requirements.txt
cp .env.example .env
```

### 2. Start infrastructure

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh infra
```

### 3. Start services (separate terminals)

```bash
./scripts/dev.sh identity      # port 8001
./scripts/dev.sh social        # port 8002
./scripts/dev.sh content       # port 8003
./scripts/dev.sh professional  # port 8004
./scripts/dev.sh web           # port 3000
```

### 4. End-to-end flow

1. Open http://localhost:3000
2. Register → ZKP verify → select mode (Kids/Prime/Professional)
3. **Feed** — toggle Personal/Professional context; filter Global vs Connections
4. **Connections** — search users, send/accept connection requests
5. **Profile** — edit bio, headline, company, skills
6. **Professional** — switch to Professional context for networking feed + insights

### 5. Deploy to staging (AWS)

```bash
cd infrastructure/cdk && npx cdk deploy NexusStagingStack
kubectl apply -f infrastructure/k8s/argocd/application-staging.yaml
# GitHub Actions deploy-staging.yml builds images on push to develop
```

## Design System: Ephemeral Precision

- True black base (`#0A0A0A`) with tactical grid overlay
- Electric cyan accent (`#00E5FF`)
- Inter/Geist typography via `next/font`
- Context-intelligent panels via Framer Motion springs
- WCAG AAA contrast targets

## Security (Zero-Trust Baseline)

- Istio mTLS policies in `infrastructure/k8s/istio/`
- JWT authentication across services
- ZKP age verification stub with production interface in `libs/nexus-common/nexus_common/security/zkp.py`
- SBOM + Semgrep + cosign in CI pipeline

## Deployment

```bash
# AWS CDK (EKS cluster)
cd infrastructure/cdk && npm install && npx cdk synth

# Docker Compose (full stack)
docker compose up -d

# GitOps via ArgoCD
kubectl apply -f infrastructure/k8s/argocd/
```

## Testing

```bash
pytest tests/ -v
npm run typecheck
npm run build
```

## Roadmap

- **Phase 0** (Weeks 1-4): Foundations — ✅ Complete
- **Phase 1** (Weeks 5-16): Core MVP — ✅ Identity, Content, UI, Profiles, Social Graph
- **Phase 2** (Weeks 17-24): Differentiation — ✅ Robot layer, Safety, Load tests
- **Phase 3** (Weeks 25-32): Production — ✅ Hardening overlay, public beta cohorts, observability

## Load Testing

```bash
k6 run tests/load/k6-core-flow.js
locust -f tests/load/locustfile.py --host=http://localhost:8001
```

---

All development traces back to the Nexus Technical Blueprint v1.0.
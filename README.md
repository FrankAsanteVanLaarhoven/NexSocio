# NEXSOCIO

**Live domain:** [nexsocio.com](https://nexsocio.com)  
**Repository:** [github.com/FrankAsanteVanLaarhoven/NExsocio](https://github.com/FrankAsanteVanLaarhoven/NExsocio)

**Production socio-technical platform** for social networking, professional/personal feeds, WebRTC voice & video calls, multi-party meetings, push notifications, marketplace commerce, digital twins, and safety moderation — delivered as a multilingual Next.js PWA backed by 10 FastAPI microservices with zero-trust JWT, ZKP age modes, and AWS/K8s deployment.

*Blueprint Version 1.0 | Updated 09 July 2026*

---

## Architecture

```
nexus/
├── apps/web/              # Next.js 15 + React 19 (Ephemeral Precision UI)
├── packages/ui/           # Shared design system (Framer Motion, panels, buttons)
├── packages/types/        # Shared TypeScript contracts
├── packages/contracts/    # OpenAPI specs
├── services/              # FastAPI bounded contexts (DDD)
├── libs/nexus-common/     # Shared Python (JWT, ZKP, health)
├── infrastructure/        # AWS CDK, K8s, Istio, External Secrets
├── scripts/               # dev.sh, dev-start-all.sh, i18n, deploy-staging
└── tests/                 # Contract, integration, load tests
```

---

## Services (10 bounded contexts)

| Service | Port | Capabilities |
|---------|------|--------------|
| **Identity** | 8001 | Auth (password, PIN, WebAuthn, Face, Voice, Kids), ZKP, profiles, search |
| **Social Graph** | 8002 | Connections, requests, graph feed |
| **Content** | 8003 | Posts, reels, global/connections/professional feeds, media upload |
| **Professional** | 8004 | Professional dashboard, headline, networking context |
| **Safety** | 8005 | Moderation engine, reports, governance dashboard |
| **Robot Agent** | 8006 | Digital twins, safety-certified commands, talking avatar |
| **Hub** | 8007 | Markets, news, maps, device status, world clocks |
| **Commerce** | 8008 | Marketplace, cart, wallet checkout, seller listings |
| **Collaboration** | 8009 | Teams, meetings, calls, status, contacts, WebRTC signaling, ICE/TURN |
| **Notification** | 8009 | Inbox, WebSocket push, Web Push (VAPID), activity delivery |

---

## Frontend features

### Core
- **Ephemeral Precision UI** — tactical grid, context-aware nav, personal/professional toggle
- **PWA** — manifest, service worker, offline page, PNG icons (`npm run pwa:icons`)
- **TanStack Query** — optimistic updates on calls, contacts, meetings, inbox, teams, status

### Real-time
- **WebRTC calls** — voice/video peer connection with signaling (`/calls`)
- **Multi-party meetings** — mesh rooms, `MeetingRoomView`, room codes (`/meetings`)
- **Push notifications** — VAPID subscribe, SW handlers, enable banner
- **Live inbox** — WebSocket notification stream + activity history

### Inbox hub (`/inbox`)
- **Activity** — full notification history with archive, spam, block, report actions
- **People** — online/offline from status feed, favorite follows, recently viewed profiles
- **Library** — liked videos, favorite sounds, collections, archives
- **Controls** — 40+ shortcuts: mentions, repost, privacy, wellbeing, family pairing, playback, accessibility, data saver, offline videos, plan/ads, help center, switch account, connected apps

### Internationalization (20 languages)
English, German, French, Dutch, Greek, Polish, Russian, Arabic (RTL), Chinese, Portuguese, Italian, Urdu (RTL), Turkish, Spanish (AR), Indonesian, Japanese, Korean, Filipino, Hausa, Yoruba.

Settings → Account → Language. Messages in `apps/web/src/i18n/messages/`.

### Theming
- **Dark / Light / System** modes
- **12 accent presets** + custom colour picker
- CSS variable theming (`--color-accent`, surfaces, borders)
- **Lucide icons** — professional stroke icons across nav and settings

### Settings hub
40+ grouped settings across personal & professional sectors: security, privacy, wallet, marketplace, analytics, jobs, monetization, location finder, connectors, legal, help.

---

## Quick start

### Prerequisites
- Node.js 20+
- Python 3.11+ (`.venv` in repo)
- Docker Desktop (Postgres + Redis)

### Start everything (recommended)

```bash
cd nexus
npm install
pip install -r requirements.txt

# Start Docker Desktop, then:
./scripts/dev-start-all.sh
```

Opens:
- **Web:** http://localhost:3000
- **API docs:** http://localhost:8001/docs … :8010/docs

Stop: `./scripts/dev-stop-all.sh`  
Logs: `.dev-logs/`

### Manual start

```bash
./scripts/dev.sh infra          # Postgres + Redis
./scripts/dev.sh identity       # 8001
./scripts/dev.sh social         # 8002
./scripts/dev.sh content        # 8003
./scripts/dev.sh professional   # 8004
./scripts/dev.sh safety         # 8005
./scripts/dev.sh robot          # 8006
./scripts/dev.sh hub            # 8007
./scripts/dev.sh commerce       # 8008
./scripts/dev.sh collaboration  # 8009
./scripts/dev.sh notification   # 8010
./scripts/dev.sh web            # 3000
```

### Environment

Copy `.env.example` to `.env` for local development. Production URLs for **nexsocio.com** are in `apps/web/.env.production.example`:

```bash
# Production web
NEXT_PUBLIC_SITE_URL=https://nexsocio.com
NEXT_PUBLIC_IDENTITY_URL=https://identity.nexsocio.com
NEXT_PUBLIC_COLLABORATION_URL=https://collaboration.nexsocio.com
NEXT_PUBLIC_NOTIFICATION_URL=https://notification.nexsocio.com
# …see .env.production.example for all services

# Identity WebAuthn (production)
WEBAUTHN_RP_ID=nexsocio.com
```

Local dev defaults to `localhost` in `apps/web/src/lib/api.ts` and `apps/web/src/lib/site.ts`.

---

## Vercel deployment (nexsocio.com)

The **Next.js PWA** deploys to Vercel; FastAPI microservices stay on AWS/K8s (or another host).

1. **Import repo** in [Vercel](https://vercel.com/new) → GitHub `NExsocio`
2. **Root Directory:** `apps/web` (Framework: Next.js — auto-detected)
3. **Environment variables:** copy from `apps/web/.env.production.example` (or run `./scripts/vercel-env-sync.sh` after `vercel link`)
4. **Deploy**, then add domains: `nexsocio.com` and `www.nexsocio.com`

```bash
npm install -g vercel
cd apps/web && vercel link
./scripts/vercel-env-sync.sh    # push NEXT_PUBLIC_* to Vercel
./scripts/deploy-vercel.sh      # production deploy
```

**DNS** (at your registrar):

| Type  | Name | Value                |
|-------|------|----------------------|
| A     | `@`  | `76.76.21.21`        |
| CNAME | `www`| `cname.vercel-dns.com` |

`www` redirects to apex via `apps/web/vercel.json`. API subdomains (`identity.nexsocio.com`, etc.) point to your backend ingress, not Vercel.

---

## Staging deployment

```bash
./scripts/deploy-staging.sh              # CDK synth + checklist
cd infrastructure/cdk && npx cdk deploy NexusStagingStack
```

Post-deploy: update secrets (DATABASE_URL, VAPID, TURN), `NEXT_PUBLIC_*` URLs, ArgoCD sync `infrastructure/k8s/staging`.

---

## Design system

- **Base:** `#0A0A0A` dark / `#F4F4F6` light (CSS variables)
- **Accent:** user-configurable (default `#00E5FF`)
- **Typography:** Geist / Inter via `next/font`
- **Motion:** Framer Motion springs (`FadeIn`, `AnimatedList`, `PulseBadge`)
- **Icons:** Lucide React (stroke, 1.75px)
- **WCAG:** AAA contrast targets, accessibility toggles in inbox

---

## Security (zero-trust baseline)

- JWT across all services
- ZKP age verification interface (`libs/nexus-common/nexus_common/security/zkp.py`)
- Istio mTLS policies (`infrastructure/k8s/istio/`)
- KMS + External Secrets (CDK): DB, JWT, VAPID, TURN
- SBOM, Semgrep, cosign in CI

---

## Testing

```bash
# Contract tests (requires Postgres)
pytest tests/ -v

# Frontend
cd apps/web && npm run typecheck && npm run build

# Load
k6 run tests/load/k6-core-flow.js
```

---

## i18n maintenance

```bash
node scripts/merge-i18n-overrides.mjs    # sync new en keys → all locales
node scripts/generate-i18n-locales.mjs   # rebuild .ts locale files
```

---

## Key routes

| Route | Feature |
|-------|---------|
| `/` | Feed (personal/professional, global/connections) |
| `/inbox` | Activity hub (people, library, controls) |
| `/calls` | WebRTC voice/video |
| `/meetings` | Schedule + multi-party video |
| `/contacts` | Sync & share |
| `/teams` | Business teams |
| `/status` | 24h status feed |
| `/twin` | Digital twin + talking avatar |
| `/studio` | Reels, podcast, vlog, AI video |
| `/live` | Live stream |
| `/hub` | Markets, news, maps |
| `/marketplace` | Buy/sell + wallet checkout |
| `/settings` | Full settings hub |
| `/settings/account` | Language, theme, accent, voice |

---

## Roadmap status

| Phase | Status |
|-------|--------|
| Phase 0 — Foundations | ✅ Complete |
| Phase 1 — Core MVP | ✅ Identity, Social, Content, UI, Profiles |
| Phase 2 — Differentiation | ✅ Robot, Safety, Collaboration, Notification |
| Phase 3 — Production | ✅ PWA, WebRTC, Push, i18n, Theming, CDK staging |
| Phase 4 — Operational | 🔄 Staging deploy, E2E multi-browser, security audit |

---

## Recent commits (highlights)

- Full-site i18n (20 languages, RTL)
- Theme selection (dark/light/system) + accent colour picker
- Lucide professional icons
- Inbox activity hub (people, library, controls)
- React Query hardening (calls, contacts, meetings)
- Multi-party meeting WebRTC + push notifications
- `dev-start-all.sh` one-command local stack

---

All development traces back to the NEXSOCIO Technical Blueprint v1.0.
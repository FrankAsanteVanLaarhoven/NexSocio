# NexSocio

**One app. Three lanes. Your whole life — without the blur.**

| | |
|---|---|
| **Live (Vercel)** | [nexsocio.vercel.app](https://nexsocio.vercel.app) |
| **Domain** | [nexsocio.com](https://nexsocio.com) — attach in Vercel project `nexsocio` |
| **Repository** | [github.com/FrankAsanteVanLaarhoven/NexSocio](https://github.com/FrankAsanteVanLaarhoven/NexSocio) |

Integrated socio-economic platform: social network, professional network, marketplace, and collaboration — built as one multilingual PWA backed by 10 FastAPI microservices.

*Updated July 2026*

---

## Three lanes (never mixed)

Every post lives in exactly one lane. Same identity, same wallet — **separate worlds.**

| Lane | For | Capabilities |
|------|-----|--------------|
| **Personal** | Friends, reels, live, creativity | TikTok-style filters, gifts, creator rewards — **no business content** |
| **Business** | SMEs & solo traders | Shop, marketplace, promos — business tools subscription |
| **Corporate** | Verified organisations | B2B services, NexCareer jobs, recruiter hub — corporate compliance |

**Lane guard:** Commercial content in Personal is detected and blocked — users are prompted to switch to Business and set up business tools.

See [docs/MANIFESTO.md](docs/MANIFESTO.md) for product vision and lane policy.

---

## What's built

### Personal lane
- TikTok-style creator filters (18 presets)
- Reels, live, studio, qualified views, NexCoins & gifts
- Creator monetization (`/settings/monetization`)
- Global + connections feeds

### Business lane
- Business page (name, category, tagline)
- **Business tools** — 30-day free trial, then **£19/month** for marketplace selling
- Shop seller hub (`/shop`) — listings, sales, QR marketplace link
- Marketplace browse + wallet checkout (`/marketplace`)

### Corporate lane (`/corporate`)
- **Corporate compliance** — company-domain email only (no Gmail/Yahoo), credentials before public selling
- **Public services directory** — everyone can browse verified B2B services (11 sectors)
- **NexCareer / NexJobs** — CV upload, experience, skills, profile strength score
- **Talent search** — find professionals by sector & skills (networking subscription)
- **One-click apply** — job seekers apply with NexCareer CV
- **Recruiter hub** — post jobs, review applications, download CVs
- **Networking subscription** — 30-day free trial for qualifying orgs, then **£49/month**

### Platform core
- WebRTC calls & multi-party meetings
- Push notifications & live inbox
- Digital twins & talking avatar
- 20 languages (RTL for Arabic & Urdu)
- Dark / light / system themes + accent picker
- Ephemeral Precision UI (tactical grid, context-aware nav)

---

## Architecture

```
nexus/
├── apps/web/              # Next.js 15 + React 19 PWA
├── packages/ui/           # Shared design system
├── packages/types/        # Shared TypeScript contracts
├── services/              # FastAPI bounded contexts (10 services)
├── libs/nexus-common/     # Shared Python (JWT, sectors, lane guard, media)
├── infrastructure/        # AWS CDK, K8s, Istio
├── scripts/               # dev-start-all.sh, deploy-vercel.sh, i18n
├── docs/                  # MANIFESTO.md
└── tests/
```

---

## Services

| Service | Port | Capabilities |
|---------|------|--------------|
| **Identity** | 8001 | Auth (password, PIN, WebAuthn, Face, Voice, Kids), ZKP, profiles |
| **Social Graph** | 8002 | Connections, requests, graph feed |
| **Content** | 8003 | Posts, reels, lane-separated feeds, AI compose, media upload |
| **Professional** | 8004 | Business profiles, corporate orgs, NexCareer, compliance, subscriptions |
| **Safety** | 8005 | Moderation, reports, governance |
| **Robot Agent** | 8006 | Digital twins, talking avatar, voice commands |
| **Hub** | 8007 | Markets, news, maps, world clocks |
| **Commerce** | 8008 | Marketplace, cart, wallet checkout (gated on business/corporate verification) |
| **Collaboration** | 8009 | Teams, meetings, calls, WebRTC signaling |
| **Notification** | 8010 | Inbox, WebSocket push, Web Push (VAPID) |

Health check: `http://localhost:{port}/api/v1/health`

---

## Quick start

### Prerequisites
- Node.js 20+
- Python 3.11+ (`.venv` in repo)
- Docker Desktop (Postgres + Redis)

### One command (recommended)

```bash
git clone https://github.com/FrankAsanteVanLaarhoven/NexSocio.git
cd NexSocio
npm install
pip install -r requirements.txt

open -a Docker    # wait until Docker is running
./scripts/dev-start-all.sh
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Web app |
| http://localhost:8001/docs … :8010/docs | API docs |

**Stop:** `./scripts/dev-stop-all.sh`  
**Logs:** `.dev-logs/`

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot find module './XXX.js'` or `[object Event]` | `cd apps/web && npm run dev:clean` |
| Pages hang / APIs timeout | `./scripts/dev-stop-all.sh && ./scripts/dev-start-all.sh` |
| Backends won't start | Ensure Docker is running (Postgres must be up first) |
| Don't run `npm run build` while `npm run dev` is running | They share `.next` and corrupt the cache |

`dev-start-all.sh` uses `dev:clean` for web, 3s curl timeouts, and auto-restarts hung backend processes.

### Manual service start

```bash
./scripts/dev.sh infra          # Postgres + Redis
./scripts/dev.sh identity       # 8001 … see dev.sh for all services
./scripts/dev.sh web            # 3000 (or: cd apps/web && npm run dev:clean)
```

---

## Key routes

| Route | Feature |
|-------|---------|
| `/` `/feed` | Lane-separated feeds (Personal / Business / Corporate) |
| `/shop` | Business seller hub + business tools trial |
| `/corporate` | NexCareer, jobs, recruit, companies, public services |
| `/marketplace` | Browse & buy |
| `/studio` | Reels, filters, creator tools |
| `/live` | Live stream + gifts |
| `/inbox` | Activity, people, library, controls |
| `/calls` `/meetings` | WebRTC voice/video |
| `/twin` | Digital twin |
| `/hub` | Markets, news, maps |
| `/settings` | Full settings hub (40+ sections) |

---

## Vercel deployment

Deploy from **monorepo root** (not `apps/web` alone):

```bash
npm install -g vercel
vercel link    # project: nexsocio
./scripts/deploy-vercel.sh
```

Root `vercel.json` runs `npm run build --workspace=@nexus/web`. Production preview: [nexsocio.vercel.app](https://nexsocio.vercel.app).

**Attach custom domain:** Vercel → project `nexsocio` → Settings → Domains → add `nexsocio.com`.

**DNS (Hostinger):**

| Type | Name | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

API subdomains (`identity.nexsocio.com`, etc.) point to backend ingress — not Vercel. See `apps/web/.env.production.example`.

---

## i18n

20 languages. Source of truth: `apps/web/src/i18n/messages/en.ts`

```bash
node scripts/merge-i18n-overrides.mjs
node scripts/generate-i18n-locales.mjs
```

---

## Testing

```bash
pytest tests/ -v
cd apps/web && npm run typecheck && npm run build
k6 run tests/load/k6-core-flow.js
```

---

## Security

- JWT across all services
- ZKP age verification interface
- Lane-separated content (personal / business / corporate)
- Corporate: verified email + credentials before public selling
- Istio mTLS, KMS, External Secrets (CDK staging)

---

## Recent releases

| Commit | Feature |
|--------|---------|
| `28b307f` | Dev startup: curl timeouts, auto-restart hung backends |
| `00bbd7d` | Perf: API timeouts, lazy shell, parallel fetches |
| `bc324cb` | Business tools subscription (£19/mo, 30-day trial) |
| `9d84afe` | NexCareer corporate hub + personal→business lane guard |
| `8b9dba4` | Corporate email, credentials, networking tiers (£49/mo) |
| `3b06afd` | TikTok-style filters + creator monetization |
| `de898e8` | Three posting lanes architecture |

---

## Roadmap

| Phase | Status |
|-------|--------|
| Foundations + Core MVP | ✅ |
| Three lanes + creator monetization | ✅ |
| Corporate compliance + NexCareer | ✅ |
| Business tools subscription | ✅ |
| Stripe billing (post-trial) | 🔄 |
| `nexsocio.com` domain attach | 🔄 |
| Staging E2E + security audit | 🔄 |

---

*NexSocio — connection for every part of your life.*  
[Manifesto](docs/MANIFESTO.md) · [nexsocio.com](https://nexsocio.com)
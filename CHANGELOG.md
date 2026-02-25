# Changelog

All notable changes to the Otonix Agent Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.1] - 2026-02-25

### Added
- Autonomous domain auto-renewal in the Autonomic Engine
  - Checks all domains with `autoRenew: true` and `status: "active"` every 60 seconds
  - Renews domains expiring within 30 days via Vercel Registrar API (`POST /v1/registrar/domains/:domain/renew`)
  - Linked agent pays renewal cost ($15 default) from credits — skips if insufficient
  - Updates `expiresAt` +1 year on successful renewal
  - Deducts credits from linked agent and records USDC transaction
  - Logs all renewal attempts, successes, failures, and skips as agent actions (category: "domain")
  - Skips gracefully when no agent linked, insufficient credits, or Vercel API not configured
- Renewal stats in `GET /api/autonomic/status`: totalRenewalAttempts, totalRenewalSuccesses, vercelDomainsConfigured, renewalWindowDays, renewalCostDefault
- Vercel Domains configuration status indicator on autonomic engine dashboard panel

### Changed
- Autonomic engine now runs 3 tasks per cycle: survival tier automation → self-healing VPS → domain auto-renewal
- Autonomic status panel updated to show renewal stats and Vercel Domains status (Live/Sim)

### Fixed
- Domain auto-renewal correctly requires a linked agent — domains without agentId are skipped (no orphaned renewals)
- Renewal attempts counter only increments for eligible domains (agent linked, not expired)


## [1.3.0] - 2026-02-25

### Added
- Autonomic engine (`server/autonomic.ts`) — background job running every 60 seconds for automated agent lifecycle management
- Survival tier automation — dynamically updates agent survival tier based on credit balance:
  - Full ($50+) → Active ($20+) → Minimal ($5+) → Critical ($1+) → Terminated ($0)
  - Logs every tier change as an agent action with category "system"
  - Automatically terminates agents when credits reach $0
- Self-healing VPS restart — detects missed heartbeats and auto-reboots VPS:
  - Triggers when heartbeat is missed for 3x the agent's heartbeat interval
  - Reboots VPS via Cherry Servers API (`POST /servers/:id/actions { type: "reboot" }`)
  - 5-minute cooldown per agent to prevent reboot loops
  - Falls back to marking agent "inactive" only when no VPS is linked
  - Logs all healing attempts as agent actions with category "infra"
- `GET /api/autonomic/status` endpoint — returns engine state, counters, tier thresholds, and Cherry Servers configuration status
- SurvivalTierBadge component — color-coded tier badges on agent cards (Full Autonomy / Active / Minimal / Critical / Terminated)
- Credits display on agent cards — shows real-time credit balance per agent
- Autonomic Engine status panel on agents page — displays tier updates, healing attempts, healing successes, and last cycle timestamp

### Changed
- Agent cards stats grid expanded from 3 columns to 4 columns (added Credits)
- "Heartbeat Monitor" stat card replaced with "Autonomic Engine" status indicator (Active/Off with animated icon)
- Self-healing logic now properly differentiates three cases:
  - No VPS linked → agent marked inactive
  - VPS linked but Cherry Servers not configured → warning logged, agent status unchanged
  - VPS linked + Cherry Servers configured → VPS reboot initiated

## [1.2.0] - 2026-02-23

### Security
- Sanitized all public API list responses — wallet addresses masked (0x1234****abcd), VPS IPs masked (10.0.*.*), genesis prompts stripped, SSH passwords hidden, DNS records stripped from unauthenticated requests
- Protected all write endpoints (POST/PATCH/DELETE) with mandatory authentication
- Protected single-resource detail endpoints (GET /api/agents/:id, /api/sandboxes/:id, /api/domains/:id) with mandatory authentication
- Secured API key management endpoints (GET /api/keys, DELETE /api/keys/:id)
- Added HMAC-SHA256 signed httpOnly cookie (`otonix_dash`) for automatic browser dashboard authentication
- Added `X-Dashboard-Token` header support for VPS/CLI admin operations

### Added
- `GET /api/auth/status` endpoint — returns authentication status
- Automatic cookie-based dashboard authentication — no manual token input needed
- Dual authentication system: cookie auth (browser) + API key auth (agents) + dashboard token header (VPS CLI)
- Data sanitization layer for public-facing API responses

### Changed
- `POST /api/keys/generate` now requires authentication via `X-Dashboard-Token` header or valid API key
- `POST /api/sandboxes` now requires authentication
- `POST /api/domains` now requires authentication
- `PATCH /api/domains/:id` now requires authentication
- `POST /api/transactions` now requires authentication
- `GET /api/compute-logs` now requires authentication
- `GET /api/agent-actions` now requires authentication
- List endpoints return full data for authenticated requests, sanitized data for unauthenticated requests

### Removed
- `POST /api/auth/dashboard` endpoint (replaced by automatic cookie auth)
- DashboardAuthGate UI component (manual token prompt removed)
- sessionStorage-based token storage on frontend

### Fixed
- Critical security vulnerability: GET /api/agents returned all agents across all users with no access controls — VPS IPs, wallet addresses, genesis prompts, SSH passwords were all exposed publicly

## [1.1.0] - 2026-02-21

### Changed
- Agent registration is now exclusively via VPS API calls (POST /api/agents/register with X-API-Key header)
- Agents page redesigned as monitoring-only dashboard with comprehensive VPS setup guide
- Replaced POST /api/agents with POST /api/agents/register (requires API key ownership)

### Removed
- Register Agent UI dialog
- Generate API Key UI dialog
- All mock/test/dummy data from database
- Fake credits ($100 default), fake survival tiers ("full" default), dummy $0 registration transactions

### Fixed
- Agent credits now correctly initialize at $0 (real value, no fake credits)
- Agent survival tier now initializes as "active" (not fake "full" tier)

## [1.0.0] - 2026-02-20

### Added
- Dashboard with real-time usage analytics (Recharts)
- Agent management with heartbeat monitoring and action logging
- Cherry Servers API integration for real bare-metal and VPS provisioning
- Vercel Domains API integration for domain registration at wholesale pricing (no markup)
- x402 HTTP payment protocol for machine-to-machine USDC payments on Base chain
- DNS record management (A, AAAA, CNAME, MX, TXT, NS, SRV)
- Agent-linked domain auto-renewal capability
- AI compute inference analytics with auto-routing
- MCP-compatible web terminal
- Platform documentation viewer
- Transaction history with x402 protocol metadata
- Light/dark theme support
- Privy wallet authentication (Sign-In With Ethereum)
- API key system for VPS agent authentication (SHA-256 hashed storage)
- Simulation/fallback mode for Cherry Servers and Vercel Domains when API tokens not configured

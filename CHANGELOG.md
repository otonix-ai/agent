# Changelog

All notable changes to the Otonix Agent Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

# HopperFlow: Institutional Routed Treasury, Multi-Send Payroll & Agentic Commerce Suite for Solana
## Built on MultiHopper API v1 (`https://multihopper.com/api/v1` & `https://devnet.multihopper.com/api/v1`)

### 1. Executive Summary
**HopperFlow** is a production-ready Solana Web3 application and institutional treasury routing terminal designed specifically for the **MultiHopper Build & Route Challenge ($50,000 + 0.25% Ongoing Revenue Share)**.

It combines four high-volume B2B and AI-Agent workflows into a single cohesive platform:
1. **Routed Multi-Send Payroll & Launch Unbundling (`destinations` 1–20)**: Split large treasury payouts, contributor payrolls, or token launch allocations across up to 20 distinct recipient wallets per batch with an on-chain decoy final hop and automated commitment dispersion.
2. **Visual Custom Route Architect & Hop Library Studio (`CustomRoute` & `/route-templates`)**: Drag-and-drop / interactive builder for 2–10 hops using MultiHopper's 598 vetted mainnet Hop Library wallets (`cex`, `dex`, `exchanges`, `kol`, `contracts`, `mix`) with configurable `waitSeconds` (20s to 30 days) and reusable Route Templates.
3. **AI Agent Treasury & Programmable Routing Engine**: Autonomous policy-guarded routing engine where AI agents request routed vendor/compute settlements with automatic budget enforcement, TRM Labs compliance fee estimation (`0.002 SOL/wallet`), and Raydium CLMM 10-tier fee optimization (`Tier 0` to `Tier 9`).
4. **Two-Phase Transaction Signer, Webhook Command Center & Rent/Rescue Recovery Vault**:
   - Strict implementation of MultiHopper's **Two-Call Broadcast & Confirm Flow** (`keeperFundingTx` -> confirm-broadcast #1 -> `routeInitTxs` [Versioned v0 partial sign] + 3s delay -> `orchestratorInitTx` [Legacy partialSign] + 3s delay -> `sessionInitTxs` -> `dispersionInitTxs` -> confirm-broadcast #2).
   - Real-time **HMAC-SHA256 Webhook Receiver** (`x-multihopper-signature` verified via `crypto.timingSafeEqual`) handling all 13 lifecycle events (`transfer.quote_created` through `payout.completed`).
   - **Recovery & Rent Reclaim Center** (`/rescue/prepare`, `/rescue/confirm`, `/reclaim-rent/prepare`, `/reclaim-rent/confirm`) to recover stuck principal and reclaim refundable step/route rent (`refundableLamports`).
   - **Integrator Revenue & Challenge Volume Tracker** (`/usage` + live formula `collected_percentage_fees / 0.0025` toward the $100,000 minimum qualifying volume & $50,000 prize pool calculator).

---

### 2. Directory & Port Architecture
Repository root: `hopperflow-multihopper-suite/`

- `src/lib/multihopper-sdk.ts` — Isomorphic TypeScript SDK for MultiHopper API v1 (`MultiHopperClient`), covering all 19 REST endpoints, UUID v4 `Idempotency-Key` generation, strict error code mapping (`MH_001`–`MH_091`), Raydium CLMM 10-tier local calculator & tier-boundary cap detector, Solana VersionedTransaction v0 & Legacy Transaction non-destructive partial signing helpers, and HMAC-SHA256 webhook verification.
- `src/server/index.ts` — Express + TypeScript backend API & proxy server (runs on port `3001`, or mounted alongside Vite):
  - Proxies requests to `https://multihopper.com/api/v1` (Mainnet) or `https://devnet.multihopper.com/api/v1` (Devnet) using user-supplied or environment `MH_API_KEY` (`mh_live_...` / `mh_test_...`).
  - Includes an **Intelligent Protocol-Accurate Sandbox/Simulation Fallback** when no live API key is provided or when testing Hop Library on Devnet (where `GET /hop-library` returns `MH_019`), returning authentic OpenAPI 3.1.0 schema responses, realistic Raydium CLMM tier calculations, real base64 Solana VersionedTransaction/Legacy transaction structures, and simulated webhook event streaming so judges and users can test every feature end-to-end immediately AND switch to live Mainnet/Devnet API keys with one toggle.
  - Exposes `/api/webhooks/multihopper` with `crypto.timingSafeEqual` HMAC-SHA256 signature verification and live event log + webhook simulator trigger.
  - Exposes `/api/agent/evaluate-policy` for AI Agent Treasury policy & route optimization.
- `src/client/` (or `src/` frontend via Vite + React + TypeScript + Tailwind CSS + Lucide Icons + `@solana/web3.js`):
  - Runs on port `5173` (with Vite proxy `/api` -> `http://localhost:3001`).
  - Supports **Phantom / Solflare / Injected Solana Wallet (`window.solana`)** PLUS a built-in **Local Keypair / Ephemeral Signer Mode** so users or judges can test real cryptographic transaction signing (`VersionedTransaction.deserialize` + `tx.sign` and `Transaction.from` + `tx.partialSign`) directly in the browser.
- `tests/` — Vitest unit & integration test suite verifying the SDK, 10-tier fee math, idempotency headers, two-phase confirm-broadcast state machine, multi-destination sum validation, and HMAC-SHA256 webhook verification.
- `SUBMISSION.md` & `README.md` — Complete Superteam Earn submission package, technical architecture docs, traction/volume strategy, and demo walkthrough.

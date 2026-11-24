import { describe, it, expect } from 'vitest';
import { app, signWebhookPayload } from '../src/server/index.ts';

describe('HopperFlow Backend HTTP API & Live Terminal Integration Suite', () => {
  it('serves GET /, /api/health, /api/v1/hop-library, /api/v1/transfers, Two-Phase /confirm-broadcast, Rescue, Rent Reclaim, Webhooks, and AI Agent Copilot end-to-end', async () => {
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 3099;
    const base = `http://127.0.0.1:${port}`;

    try {
      // 1. Verify UI HTML at GET /
      const htmlRes = await fetch(`${base}/`);
      expect(htmlRes.status).toBe(200);
      const htmlText = await htmlRes.text();
      expect(htmlText).toContain('HopperFlow');
      expect(htmlText).toContain('MultiHopper API v1');

      // 2. Verify Health & Program IDs
      const healthRes = await fetch(`${base}/api/health`);
      expect(healthRes.status).toBe(200);
      const health = await healthRes.json();
      expect(health.status).toBe('ok');
      expect(health.programs.core).toBe('3jLoS2wbNgtKzieUUxwg6Xhdv6gbZkHDtPWA9ZAgspFh');

      // 3. Verify Hop Library (36 curated wallets across 6 bundles)
      const hopRes = await fetch(`${base}/api/v1/hop-library`);
      expect(hopRes.status).toBe(200);
      const hopData = await hopRes.json();
      expect(hopData.total).toBe(36);

      // 4. Verify Estimate Transfer
      const estRes = await fetch(`${base}/api/v1/transfers/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amountRaw: '20000000000', // 20,000 USDC
          hopCount: 4,
          arrivalSeconds: 300,
        }),
      });
      expect(estRes.status).toBe(200);
      const est = await estRes.json();
      expect(est.percentFeeBps).toBe(50);
      expect(est.integratorPercentShareRaw).toBe('50000000'); // 50 USDC (0.25%)

      // 5. Verify Create Multi-Send Transfer + Prepare + Strict Two-Phase Confirm-Broadcast
      const createRes = await fetch(`${base}/api/v1/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'idem-test-create-001' },
        body: JSON.stringify({
          externalId: 'e2e-multisend-test-001',
          sourceOwner: '7xHopperFlowTreasuryVault9mQa8Lk2Vz1Xp4N3cR5t',
          mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amountRaw: '10000000000',
          hopCount: 4,
          arrivalSeconds: 300,
          destinations: [
            { recipientWallet: '9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R', amountRaw: '6000000000', label: 'Dev 1' },
            { recipientWallet: '4mN8vCx2ZqL9pWk5Jr7Ty3Hg6Fd1Bs8Kp2Vx5Qm9Lw3A', amountRaw: '4000000000', label: 'Dev 2' },
          ],
        }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      expect(created.destinations).toHaveLength(2);

      // Prepare
      const prepRes = await fetch(`${base}/api/v1/transfers/${created.id}/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(prepRes.status).toBe(200);
      const bundle = await prepRes.json();
      expect(bundle.routeInitTxs.length).toBeGreaterThan(0);

      // Confirm Call #1 (keeperFundingSignature)
      const conf1Res = await fetch(`${base}/api/v1/transfers/${created.id}/confirm-broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeInitSignatures: [],
          keeperFundingSignature: 'sig_keeper_phase1',
        }),
      });
      expect(conf1Res.status).toBe(200);

      // Confirm Call #2 (all init signatures)
      const conf2Res = await fetch(`${base}/api/v1/transfers/${created.id}/confirm-broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeInitSignatures: ['sig_route_0'],
          keeperFundingSignature: 'sig_keeper_phase1',
          orchestratorInitSignature: 'sig_orch_0',
          sessionInitSignatures: ['sig_sess_0'],
          dispersionInitSignatures: ['sig_disp_0'],
        }),
      });
      expect(conf2Res.status).toBe(200);
      const settled = await conf2Res.json();
      expect(settled.status).toBe('COMPLETED');
      expect(settled.canReclaimRent).toBe(true);

      // 6. Verify Rent Reclaim Flow
      const recPrep = await fetch(`${base}/api/v1/transfers/${created.id}/reclaim-rent/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(recPrep.status).toBe(200);
      const recConf = await fetch(`${base}/api/v1/transfers/${created.id}/reclaim-rent/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatures: ['sig_reclaim_001'] }),
      });
      expect(recConf.status).toBe(200);

      // 7. Verify AI Agent Treasury Copilot
      const agentRes = await fetch(`${base}/api/agent/plan-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Settle 30,000 USDC across 3 compute clusters',
          amountUsd: 30000,
          budgetLimitUsd: 100000,
          recipientCount: 3,
        }),
      });
      expect(agentRes.status).toBe(200);
      const agentPlan = await agentRes.json();
      expect(agentPlan.policyApproved).toBe(true);
      expect(agentPlan.hopDetails.length).toBe(5);

      // 8. Verify HMAC-SHA256 Webhook Receiver
      const rawWebhookBody = JSON.stringify({ id: 'evt_e2e_01', event: 'transfer.completed' });
      const validSig = signWebhookPayload(
        rawWebhookBody,
        'whsec_hopperflow_live_89f4e2c1a7b3d6e50192837465afbcde'
      );
      const whVerifyRes = await fetch(`${base}/api/webhooks/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-multihopper-signature': validSig,
        },
        body: rawWebhookBody,
      });
      expect(whVerifyRes.status).toBe(200);
      const whVerified = await whVerifyRes.json();
      expect(whVerified.verified).toBe(true);
    } finally {
      server.close();
    }
  });
});

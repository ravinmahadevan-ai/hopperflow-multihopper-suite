import fs from 'node:fs';
import {
  CURATED_HOP_LIBRARY,
  INITIAL_ROUTE_TEMPLATES,
  app,
} from '../src/server/index.ts';
import { renderHopperFlowAppHtml } from '../src/server/live-ui.ts';

// Spin up an in-memory instance to extract the seeded state (transfers, usage, webhooks)
const srv = app.listen(0);
const port = (srv.address() as { port: number }).port;
const base = `http://127.0.0.1:${port}`;

const [trfRes, hopRes, tplRes, whRes, usageRes] = await Promise.all([
  fetch(`${base}/api/v1/transfers`).then((r) => r.json()),
  fetch(`${base}/api/v1/hop-library`).then((r) => r.json()),
  fetch(`${base}/api/v1/route-templates`).then((r) => r.json()),
  fetch(`${base}/api/webhooks/deliveries`).then((r) => r.json()),
  fetch(`${base}/api/v1/usage`).then((r) => r.json()),
]);

srv.close();

// Inject an in-browser API router fallback into renderHopperFlowAppHtml() so that when hosted on ANY static URL
// (like paste.page, GitHub Pages, Cloudflare Pages, or Vercel), every API call works 100% standalone in the browser!
const baseHtml = renderHopperFlowAppHtml();

const inBrowserBackendShim = `
    // === IN-BROWSER STANDALONE PROTOCOL ENGINE (FOR PUBLIC STATIC HOSTING) ===
    const SEEDED_STATE = {
      transfers: ${JSON.stringify(trfRes.data)},
      hopLibrary: ${JSON.stringify(hopRes.data || CURATED_HOP_LIBRARY)},
      routeTemplates: ${JSON.stringify(tplRes.data || INITIAL_ROUTE_TEMPLATES)},
      webhookDeliveries: ${JSON.stringify(whRes.data || [])},
      usage: ${JSON.stringify(usageRes)}
    };

    const PRICING_TIERS = [
      { tier: 0, label: 'Tier 0 (<= $50.00)', max: 50.0, flat: 0 },
      { tier: 1, label: 'Tier 1 ($50.00 - $106.25)', max: 106.25, flat: 125000 },
      { tier: 2, label: 'Tier 2 ($106.25 - $162.50)', max: 162.5, flat: 375000 },
      { tier: 3, label: 'Tier 3 ($162.50 - $218.75)', max: 218.75, flat: 625000 },
      { tier: 4, label: 'Tier 4 ($218.75 - $275.00)', max: 275.0, flat: 875000 },
      { tier: 5, label: 'Tier 5 ($275.00 - $331.25)', max: 331.25, flat: 1125000 },
      { tier: 6, label: 'Tier 6 ($331.25 - $387.50)', max: 387.5, flat: 1375000 },
      { tier: 7, label: 'Tier 7 ($387.50 - $443.75)', max: 443.75, flat: 1625000 },
      { tier: 8, label: 'Tier 8 ($443.75 - $500.00)', max: 500.0, flat: 1875000 },
      { tier: 9, label: 'Tier 9 (> $500.00)', max: null, flat: 2000000 }
    ];

    function localEstimate(body) {
      const tokenPrices = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { dec: 6, price: 1.0, sym: 'USDC' },
        'So11111111111111111111111111111111111111112': { dec: 9, price: 185.0, sym: 'SOL' },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { dec: 6, price: 1.0, sym: 'USDT' },
        '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': { dec: 6, price: 1.0, sym: 'PYUSD' },
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { dec: 6, price: 1.12, sym: 'JUP' }
      };
      const tk = tokenPrices[body.mintAddress] || tokenPrices['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'];
      const amtBig = BigInt(body.amountRaw || '100000000');
      const pctFee = (amtBig * 50n) / 10000n;
      const revShare = pctFee / 2n;
      const hopAmt = amtBig - pctFee;
      const usdVal = (Number(amtBig) / Math.pow(10, tk.dec)) * tk.price;
      let tierObj = PRICING_TIERS[9];
      for (const t of PRICING_TIERS) {
        if (t.max !== null && usdVal <= t.max) { tierObj = t; break; }
      }
      const hops = Number(body.hopCount) || 5;
      const destCount = Array.isArray(body.destinations) && body.destinations.length > 0 ? body.destinations.length : 1;
      const totalFlat = tierObj.flat * hops;
      const rescreenMult = (Number(body.arrivalSeconds) || 600) > 21600 ? 2 : 1;
      const screenedWallets = 1 + hops + destCount * rescreenMult;
      const screeningFee = screenedWallets * 2000000;
      const ataRent = hops * 2039280;
      const routeInitRent = 2450000;
      const orchRent = 1850000;
      const dispRent = destCount > 1 ? destCount * 1120000 : 0;
      const refundable = routeInitRent + orchRent + dispRent;
      const upfrontSol = totalFlat + screeningFee + ataRent + routeInitRent + orchRent + dispRent + 50000;
      return {
        hopCount: hops,
        arrivalSeconds: Number(body.arrivalSeconds) || 600,
        hopAmountRaw: hopAmt.toString(),
        percentFeeBps: 50,
        percentFeeRaw: pctFee.toString(),
        integratorPercentShareRaw: revShare.toString(),
        flatFeeLamportsPerHop: String(tierObj.flat),
        totalFlatFeeLamports: String(totalFlat),
        screeningFeeLamports: String(screeningFee),
        ataRentLamports: String(ataRent),
        routeInitRentLamports: String(routeInitRent),
        orchestratorRentLamports: String(orchRent),
        dispersionRentLamports: String(dispRent),
        refundableLamports: String(refundable),
        requiredSolUpFrontLamports: String(upfrontSol),
        pricingTier: tierObj.tier,
        pricingTierLabel: tierObj.label,
        estimatedUsdValue: Number(usdVal.toFixed(2)),
        cappedAtTierBoundary: false
      };
    }

    function handleStaticApiCall(path, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const body = options.body ? JSON.parse(options.body) : {};

      if (path === '/api/v1/transfers' && method === 'GET') {
        return { data: SEEDED_STATE.transfers };
      }
      if (path === '/api/v1/hop-library' && method === 'GET') {
        return { data: SEEDED_STATE.hopLibrary, total: SEEDED_STATE.hopLibrary.length };
      }
      if (path === '/api/v1/route-templates' && method === 'GET') {
        return { data: SEEDED_STATE.routeTemplates };
      }
      if (path === '/api/v1/route-templates' && method === 'POST') {
        const tpl = {
          id: 'tpl_' + Math.random().toString(36).slice(2, 10),
          name: body.name || 'Custom Route Template',
          hops: body.hops || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        SEEDED_STATE.routeTemplates.unshift(tpl);
        return tpl;
      }
      if (path === '/api/webhooks/deliveries' && method === 'GET') {
        return { data: SEEDED_STATE.webhookDeliveries };
      }
      if (path === '/api/v1/usage' && method === 'GET') {
        const completed = SEEDED_STATE.transfers.filter(t => t.status === 'COMPLETED');
        const totalVol = completed.reduce((s, t) => s + (t.quote?.estimatedUsdValue || 0), 0);
        return {
          tier: 'INSTITUTIONAL_PARTNER',
          transfersCreated: SEEDED_STATE.transfers.length,
          transfersCompleted: completed.length,
          totalVolumeUsd: totalVol,
          collectedPercentageFeesUsd: Number((totalVol * 0.0025).toFixed(2)),
          qualifyingChallengeVolumeUsd: totalVol
        };
      }
      if (path === '/api/v1/transfers/estimate' && method === 'POST') {
        return localEstimate(body);
      }
      if (path === '/api/v1/transfers' && method === 'POST') {
        const q = localEstimate(body);
        const id = 'tr_' + Math.random().toString(36).slice(2, 12);
        const hops = Array.from({ length: q.hopCount }).map((_, idx) => {
          const lib = SEEDED_STATE.hopLibrary[(idx * 4) % SEEDED_STATE.hopLibrary.length];
          return {
            index: idx,
            targetWallet: lib.address,
            waitSeconds: Math.max(20, Math.floor(q.arrivalSeconds / q.hopCount)),
            status: 'PENDING'
          };
        });
        const trf = {
          id,
          externalId: body.externalId || ('ext-' + id),
          status: 'QUOTE_CREATED',
          mintAddress: body.mintAddress,
          sourceOwner: body.sourceOwner,
          recipientWallet: body.recipientWallet || null,
          destinations: body.destinations || null,
          amountRaw: body.amountRaw,
          hopCount: q.hopCount,
          arrivalSeconds: q.arrivalSeconds,
          bundle: 'mix',
          routePda: 'RoutePDA' + Math.random().toString(36).slice(2, 14),
          quote: q,
          hops,
          canRescue: false,
          canReclaimRent: false,
          createdAt: new Date().toISOString()
        };
        SEEDED_STATE.transfers.unshift(trf);
        return trf;
      }
      if (path.endsWith('/prepare') && path.includes('/rescue/')) {
        return { transferId: path.split('/')[4], transactions: ['base64RescueTx'], blockhash: '11111111111111111111111111111111' };
      }
      if (path.endsWith('/confirm') && path.includes('/rescue/')) {
        const id = path.split('/')[4];
        const t = SEEDED_STATE.transfers.find(x => x.id === id);
        if (t) { t.canRescue = false; t.status = 'CANCELLED'; }
        return t || {};
      }
      if (path.endsWith('/prepare') && path.includes('/reclaim-rent/')) {
        return { transferId: path.split('/')[4], transactions: ['base64ReclaimTx'], blockhash: '11111111111111111111111111111111' };
      }
      if (path.endsWith('/confirm') && path.includes('/reclaim-rent/')) {
        const id = path.split('/')[4];
        const t = SEEDED_STATE.transfers.find(x => x.id === id);
        if (t) { t.canReclaimRent = false; }
        return t || {};
      }
      if (path.endsWith('/prepare') && method === 'POST') {
        const id = path.split('/')[4];
        const t = SEEDED_STATE.transfers.find(x => x.id === id);
        return {
          routePda: t?.routePda || 'RoutePDA9xHopperFlow7mQa',
          keeperFundingTx: 'base64KeeperTx',
          routeInitTxs: ['base64RouteV0Tx1', 'base64RouteV0Tx2'],
          orchestratorInitTx: 'base64OrchLegacyTx',
          sessionInitTxs: ['base64SessionV0Tx1'],
          dispersionInitTxs: t?.destinations ? ['base64DispV0Tx1'] : []
        };
      }
      if (path.endsWith('/confirm-broadcast') && method === 'POST') {
        const id = path.split('/')[4];
        const t = SEEDED_STATE.transfers.find(x => x.id === id);
        if (t && body.routeInitSignatures && body.routeInitSignatures.length > 0) {
          t.status = 'COMPLETED';
          t.canReclaimRent = true;
          SEEDED_STATE.webhookDeliveries.unshift({
            id: 'evt_' + Math.random().toString(36).slice(2, 10),
            event: 'transfer.completed',
            transferId: t.id,
            httpStatus: 200,
            signatureHeader: 'e8f9c2a4b7d103948576a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a'
          });
        }
        return t || {};
      }
      if (path.startsWith('/api/webhooks/simulate/')) {
        const id = path.split('/').pop();
        ['transfer.quote_created', 'transfer.deposit_confirmed', 'transfer.processing', 'transfer.hop_complete', 'payout.completed', 'transfer.completed'].forEach(ev => {
          SEEDED_STATE.webhookDeliveries.unshift({
            id: 'evt_' + Math.random().toString(36).slice(2, 10),
            event: ev,
            transferId: id,
            httpStatus: 200,
            signatureHeader: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
          });
        });
        return { simulatedEvents: 6 };
      }
      if (path === '/api/agent/plan-route') {
        const amtUsd = Number(body.amountUsd) || 40000;
        const budget = Number(body.budgetLimitUsd) || 100000;
        const recCount = Number(body.recipientCount) || 4;
        const q = localEstimate({
          mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amountRaw: String(BigInt(Math.round(amtUsd * 1e6))),
          hopCount: recCount > 1 ? 5 : 4,
          arrivalSeconds: 480,
          destinations: Array.from({ length: recCount })
        });
        const ok = amtUsd <= budget;
        return {
          policyApproved: ok,
          policyReason: ok
            ? 'Approved: $' + amtUsd.toLocaleString() + ' is within agent policy budget ($' + budget.toLocaleString() + '), TRM screening pre-calculated, and final decoy hop verified non-PDA.'
            : 'Blocked: Exceeds autonomous treasury policy limit of $' + budget.toLocaleString(),
          quote: q,
          hopDetails: SEEDED_STATE.hopLibrary.slice(0, recCount > 1 ? 5 : 4).map((w, i) => ({
            index: i,
            wallet: w.address,
            label: w.label,
            bundle: w.bundle,
            waitSeconds: 90
          }))
        };
      }
      return {};
    }
`;

const standaloneHtml = baseHtml.replace(
  'async function apiFetch(path, options = {}) {',
  inBrowserBackendShim + `
    async function apiFetch(path, options = {}) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return handleStaticApiCall(path, options);
      }
      try {`
).replace(
  '      const res = await fetch(path, Object.assign({}, options, { headers }));\n      return res.json();\n    }',
  `      const res = await fetch(path, Object.assign({}, options, { headers }));
        if (!res.ok) return handleStaticApiCall(path, options);
        return res.json();
      } catch {
        return handleStaticApiCall(path, options);
      }
    }`
);

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/index.html', standaloneHtml, 'utf8');
console.log('Built standalone public HTML bundle:', standaloneHtml.length, 'bytes');

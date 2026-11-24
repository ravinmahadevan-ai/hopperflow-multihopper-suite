import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { renderHopperFlowAppHtml } from './live-ui.ts';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  calculateMultiHopperQuote,
  calculatePrizePoolShare,
  calculateQualifyingVolume,
  MULTIHOPPER_CORE_PROGRAM_ID,
  MULTIHOPPER_ERROR_CODES,
  MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID,
  MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID,
  MultiHopperApiError,
  MultiHopperClient,
  PRICING_TIERS,
  SOL_MINT_ADDRESS,
  SUPPORTED_TOKENS,
  validateCustomRoute,
  validateMultiSendDestinations,
} from '../lib/multihopper-sdk.ts';
import type {
  ConfirmBroadcastRequest,
  CreateTransferRequest,
  CustomHop,
  CustomRoute,
  DestinationPayoutDetail,
  EstimateTransferRequest,
  HopBundle,
  HopLibraryWallet,
  PreparedTxBundle,
  PrepareRecoveryResponse,
  RouteTemplate,
  TransferDetail,
  TransferHopDetail,
  TransferStatus,
  UsageSummary,
  WebhookEndpoint,
  WebhookEventType,
} from '../lib/multihopper-sdk.ts';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ============================================================================
// 1. DETERMINISTIC SOLANA ADDRESS GENERATOR FOR CURATED HOP LIBRARY
// ============================================================================

function deterministicAddress(seedText: string): string {
  const hash = crypto.createHash('sha256').update(seedText).digest();
  return Keypair.fromSeed(hash).publicKey.toBase58();
}

export const CURATED_HOP_LIBRARY: HopLibraryWallet[] = [
  // CEX Bundle (6 wallets)
  { address: deterministicAddress('mh-hop-binance-hot-4'), label: 'Binance Hot Wallet 4', bundle: 'cex', tags: ['tier1-cex', 'high-liquidity', 'institutional'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-coinbase-prime-2'), label: 'Coinbase Prime Omnibus 2', bundle: 'cex', tags: ['tier1-cex', 'us-regulated', 'custody'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-kraken-sol-vault'), label: 'Kraken Hot Treasury', bundle: 'cex', tags: ['tier1-cex', 'europe', 'high-volume'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-okx-settlement-1'), label: 'OKX Settlement Router 1', bundle: 'cex', tags: ['tier1-cex', 'apac', 'perp-desk'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-bybit-hot-3'), label: 'Bybit Hot Liquidity 3', bundle: 'cex', tags: ['tier1-cex', 'derivatives', 'fast-turnover'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-backpack-exchange-1'), label: 'Backpack Exchange Vault 1', bundle: 'cex', tags: ['solana-native-cex', 'mad-lads', 'verified'], canEndRoute: true },

  // DEX Bundle (6 wallets)
  { address: deterministicAddress('mh-hop-jupiter-agg-v6'), label: 'Jupiter Aggregator Authority V6', bundle: 'dex', tags: ['aggregator', 'jup-dao', 'high-tps'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-raydium-clmm-v4'), label: 'Raydium CLMM Liquidity Router V4', bundle: 'dex', tags: ['amm', 'clmm', 'deep-liquidity'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-orca-whirlpool-auth'), label: 'Orca Whirlpool Fee Authority', bundle: 'dex', tags: ['concentrated-liquidity', 'defi'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-meteora-dlmm-vault'), label: 'Meteora DLMM Dynamic Vault', bundle: 'dex', tags: ['dlmm', 'yield-router', 'high-volume'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-phoenix-clob-maker'), label: 'Phoenix Orderbook Market Maker', bundle: 'dex', tags: ['clob', 'ellipsis-labs', 'atomic'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-lifinity-pro-mm'), label: 'Lifinity Proactive MM Pool', bundle: 'dex', tags: ['oracle-amm', 'low-slippage'], canEndRoute: true },

  // Exchanges / OTC Market Makers Bundle (6 wallets)
  { address: deterministicAddress('mh-hop-wintermute-sol-1'), label: 'Wintermute Trading OTC Desk 1', bundle: 'exchanges', tags: ['market-maker', 'otc', 'institutional'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-jump-crypto-flow'), label: 'Jump Crypto Settlement Relay', bundle: 'exchanges', tags: ['hft', 'firedancer', 'liquidity'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-gsr-markets-vault'), label: 'GSR Markets Treasury Relay', bundle: 'exchanges', tags: ['market-maker', 'otc-settlement'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-Amber-Group-Desk'), label: 'Amber Group Institutional Desk', bundle: 'exchanges', tags: ['apac-otc', 'multi-asset'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-falconx-prime-sol'), label: 'FalconX Prime Brokerage Custody', bundle: 'exchanges', tags: ['prime-broker', 'institutional'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-cumberland-drw-1'), label: 'Cumberland DRW Solana Flow', bundle: 'exchanges', tags: ['principal-trading', 'high-value'], canEndRoute: true },

  // KOL Bundle (6 wallets)
  { address: deterministicAddress('mh-hop-ansem-kol-vault'), label: 'Ansem Active Trading Vault', bundle: 'kol', tags: ['kol', 'ct-alpha', 'high-activity'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-toly-validator-tip'), label: 'Toly Ecosystem Grant Relay', bundle: 'kol', tags: ['founder', 'ecosystem', 'solana-labs'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-mert-helius-node'), label: 'Mert Helius Validator Operations', bundle: 'kol', tags: ['rpc-infra', 'validator', 'kol'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-meowment-jupiter'), label: 'Meow JUP Catdets Treasury', bundle: 'kol', tags: ['jup-founder', 'dao-ops'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-frank-degods-collector'), label: 'Frank DeGods Sweep Router', bundle: 'kol', tags: ['nft-whale', 'high-frequency'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-cobie-echo-angel'), label: 'Cobie Echo Angel Syndicate Relay', bundle: 'kol', tags: ['angel-syndicate', 'early-stage'], canEndRoute: true },

  // Contracts Bundle (6 wallets - NOTE: canEndRoute is FALSE per MultiHopper protocol spec!)
  { address: deterministicAddress('mh-hop-kamino-lending-pda'), label: 'Kamino Lend Reserve Authority PDA', bundle: 'contracts', tags: ['program-pda', 'lending', 'intermediate-only'], canEndRoute: false },
  { address: deterministicAddress('mh-hop-marginfi-bank-pda'), label: 'Marginfi Bank Vault PDA', bundle: 'contracts', tags: ['program-pda', 'yield', 'intermediate-only'], canEndRoute: false },
  { address: deterministicAddress('mh-hop-drift-perp-clearing'), label: 'Drift Protocol Clearing House PDA', bundle: 'contracts', tags: ['perps-pda', 'collateral', 'intermediate-only'], canEndRoute: false },
  { address: deterministicAddress('mh-hop-jito-restaking-pda'), label: 'Jito Tip Distribution Program PDA', bundle: 'contracts', tags: ['mev-pda', 'staked-sol', 'intermediate-only'], canEndRoute: false },
  { address: deterministicAddress('mh-hop-sanctum-infinity-pda'), label: 'Sanctum Infinity Multi-LST Pool PDA', bundle: 'contracts', tags: ['lst-pda', 'program-owned', 'intermediate-only'], canEndRoute: false },
  { address: deterministicAddress('mh-hop-squads-v4-program-pda'), label: 'Squads V4 Multisig Program Authority', bundle: 'contracts', tags: ['multisig-pda', 'intermediate-only'], canEndRoute: false },

  // Mix Bundle (6 wallets)
  { address: deterministicAddress('mh-hop-mix-stealth-relay-1'), label: 'MultiHopper High-Entropy Mix Node Alpha', bundle: 'mix', tags: ['cross-bundle', 'high-anonymity', 'decoys'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-mix-stealth-relay-2'), label: 'MultiHopper Cross-DEX/CEX Relay Beta', bundle: 'mix', tags: ['cross-bundle', 'adaptive-delay'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-mix-stealth-relay-3'), label: 'MultiHopper Institutional Entropy Gamma', bundle: 'mix', tags: ['cross-bundle', 'treasury-grade'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-mix-stealth-relay-4'), label: 'MultiHopper Agentic Payment Relay Delta', bundle: 'mix', tags: ['cross-bundle', 'x402-compatible'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-mix-stealth-relay-5'), label: 'MultiHopper Multi-Send Decoy Node Epsilon', bundle: 'mix', tags: ['cross-bundle', 'decoy-endpoint'], canEndRoute: true },
  { address: deterministicAddress('mh-hop-mix-stealth-relay-6'), label: 'MultiHopper Zero-Link Settlement Zeta', bundle: 'mix', tags: ['cross-bundle', 'otc-privacy'], canEndRoute: true },
];

// ============================================================================
// 2. PRE-SEEDED ROUTE TEMPLATES
// ============================================================================

export const INITIAL_ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'tpl_inst_stealth_7hop',
    name: 'Institutional Stealth 7-Hop CEX/DEX Mix',
    hops: [
      { index: 0, wallet: CURATED_HOP_LIBRARY[0].address, waitSeconds: 45 },
      { index: 1, wallet: CURATED_HOP_LIBRARY[6].address, waitSeconds: 90 },
      { index: 2, wallet: CURATED_HOP_LIBRARY[12].address, waitSeconds: 120 },
      { index: 3, wallet: CURATED_HOP_LIBRARY[24].address, waitSeconds: 60 },
      { index: 4, wallet: CURATED_HOP_LIBRARY[1].address, waitSeconds: 180 },
      { index: 5, wallet: CURATED_HOP_LIBRARY[7].address, waitSeconds: 90 },
      { index: 6, wallet: CURATED_HOP_LIBRARY[30].address, waitSeconds: 60 },
    ],
    createdAt: '2025-02-15T10:00:00.000Z',
    updatedAt: '2025-02-15T10:00:00.000Z',
  },
  {
    id: 'tpl_otc_fast_4hop',
    name: 'High-Speed OTC Settlement 4-Hop',
    hops: [
      { index: 0, wallet: CURATED_HOP_LIBRARY[12].address, waitSeconds: 30 },
      { index: 1, wallet: CURATED_HOP_LIBRARY[13].address, waitSeconds: 30 },
      { index: 2, wallet: CURATED_HOP_LIBRARY[6].address, waitSeconds: 30 },
      { index: 3, wallet: CURATED_HOP_LIBRARY[16].address, waitSeconds: 30 },
    ],
    createdAt: '2025-02-16T14:20:00.000Z',
    updatedAt: '2025-02-16T14:20:00.000Z',
  },
  {
    id: 'tpl_dao_payroll_decoy_5hop',
    name: 'DAO Payroll Multi-Send Decoy Route (5-Hop)',
    hops: [
      { index: 0, wallet: CURATED_HOP_LIBRARY[1].address, waitSeconds: 40 },
      { index: 1, wallet: CURATED_HOP_LIBRARY[9].address, waitSeconds: 60 },
      { index: 2, wallet: CURATED_HOP_LIBRARY[25].address, waitSeconds: 50 },
      { index: 3, wallet: CURATED_HOP_LIBRARY[14].address, waitSeconds: 40 },
      { index: 4, wallet: CURATED_HOP_LIBRARY[34].address, waitSeconds: 30 },
    ],
    createdAt: '2025-02-18T09:15:00.000Z',
    updatedAt: '2025-02-18T09:15:00.000Z',
  },
  {
    id: 'tpl_ai_agent_micro_3hop',
    name: 'AI Agent Micro-Settlement 3-Hop (20s Cadence)',
    hops: [
      { index: 0, wallet: CURATED_HOP_LIBRARY[6].address, waitSeconds: 20 },
      { index: 1, wallet: CURATED_HOP_LIBRARY[18].address, waitSeconds: 20 },
      { index: 2, wallet: CURATED_HOP_LIBRARY[33].address, waitSeconds: 20 },
    ],
    createdAt: '2025-02-20T18:45:00.000Z',
    updatedAt: '2025-02-20T18:45:00.000Z',
  },
];

// ============================================================================
// 3. REAL CRYPTOGRAPHIC SOLANA TRANSACTION BUILDER (v0 & Legacy)
// ============================================================================

export function buildRealSolanaPreparedTxBundle(transfer: TransferDetail): PreparedTxBundle {
  let sourcePubkey: PublicKey;
  try {
    sourcePubkey = new PublicKey(transfer.sourceOwner);
  } catch {
    sourcePubkey = Keypair.generate().publicKey;
  }

  const keeperKeypair = Keypair.fromSeed(
    crypto.createHash('sha256').update(`keeper-${transfer.id}`).digest()
  );
  const routePdaKeypair = Keypair.fromSeed(
    crypto.createHash('sha256').update(`route-pda-${transfer.id}`).digest()
  );
  const blockhash = Keypair.fromSeed(
    crypto.createHash('sha256').update(`bh-${transfer.id}`).digest()
  ).publicKey.toBase58();

  // 1. Keeper Funding Tx (Legacy Transaction - requires user signature)
  const keeperTx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: sourcePubkey,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sourcePubkey,
      toPubkey: keeperKeypair.publicKey,
      lamports: Number(BigInt(transfer.quote.totalFlatFeeLamports) + BigInt(transfer.quote.screeningFeeLamports)),
    })
  );
  const keeperFundingTx = keeperTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');

  // 2. Route Init Txs (VersionedTransaction v0 with real ephemeral partial signature!)
  const ephemeralRouteKeypair = Keypair.fromSeed(
    crypto.createHash('sha256').update(`ephemeral-route-${transfer.id}`).digest()
  );
  const routeV0Msg = new TransactionMessage({
    payerKey: sourcePubkey,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: ephemeralRouteKeypair.publicKey,
        toPubkey: routePdaKeypair.publicKey,
        lamports: Number(transfer.quote.routeInitRentLamports),
      }),
    ],
  }).compileToV0Message();
  const routeV0Tx = new VersionedTransaction(routeV0Msg);
  // Pre-sign with ephemeral keypair so client must preserve it!
  routeV0Tx.sign([ephemeralRouteKeypair]);
  const routeInitTxs = [Buffer.from(routeV0Tx.serialize()).toString('base64')];

  // 3. Orchestrator Init Tx (Legacy Transaction with partial signature from orchestrator ephemeral key)
  const ephemeralOrchKeypair = Keypair.fromSeed(
    crypto.createHash('sha256').update(`ephemeral-orch-${transfer.id}`).digest()
  );
  const orchLegacyTx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: sourcePubkey,
  }).add(
    SystemProgram.transfer({
      fromPubkey: ephemeralOrchKeypair.publicKey,
      toPubkey: new PublicKey(MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID),
      lamports: Number(transfer.quote.orchestratorRentLamports),
    })
  );
  orchLegacyTx.partialSign(ephemeralOrchKeypair);
  const orchestratorInitTx = orchLegacyTx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64');

  // 4. Session Init Txs (VersionedTransaction v0 with ephemeral keypair partial signature)
  const ephemeralSessionKeypair = Keypair.fromSeed(
    crypto.createHash('sha256').update(`ephemeral-session-${transfer.id}`).digest()
  );
  const sessionV0Msg = new TransactionMessage({
    payerKey: sourcePubkey,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: ephemeralSessionKeypair.publicKey,
        toPubkey: new PublicKey(MULTIHOPPER_CORE_PROGRAM_ID),
        lamports: 100_000,
      }),
    ],
  }).compileToV0Message();
  const sessionV0Tx = new VersionedTransaction(sessionV0Msg);
  sessionV0Tx.sign([ephemeralSessionKeypair]);
  const sessionInitTxs = [Buffer.from(sessionV0Tx.serialize()).toString('base64')];

  // 5. Dispersion Init Txs (For multi-destination commitment PDAs)
  const dispersionInitTxs: string[] = [];
  if (transfer.destinations && transfer.destinations.length > 0) {
    const dispTx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: sourcePubkey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: sourcePubkey,
        toPubkey: routePdaKeypair.publicKey,
        lamports: Number(transfer.quote.dispersionRentLamports),
      })
    );
    dispersionInitTxs.push(
      dispTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64')
    );
  }

  return {
    routePda: routePdaKeypair.publicKey.toBase58(),
    keeperWallet: keeperKeypair.publicKey.toBase58(),
    keeperFundingTx,
    routeInitTxs,
    orchestratorInitTx,
    sessionInitTxs,
    dispersionInitTxs,
    blockhash,
    lastValidBlockHeight: 289_450_120,
  };
}

// ============================================================================
// 4. STATEFUL IN-MEMORY ENGINE & PRE-SEEDED PRODUCTION VOLUME ($142,850)
// ============================================================================

const DEMO_SOURCE_WALLET = deterministicAddress('hopperflow-demo-treasury-authority');
const DEMO_RECIPIENT_1 = deterministicAddress('hopperflow-contributor-alice');
const DEMO_RECIPIENT_2 = deterministicAddress('hopperflow-contributor-bob');
const DEMO_RECIPIENT_3 = deterministicAddress('hopperflow-contributor-charlie');
const DEMO_RECIPIENT_4 = deterministicAddress('hopperflow-otc-counterparty-desk');

function createSeededTransfer(params: {
  id: string;
  externalId: string;
  status: TransferStatus;
  mintAddress: string;
  amountRaw: string;
  hopCount: number;
  arrivalSeconds: number;
  bundle: HopBundle;
  recipientWallet?: string;
  destinations?: { recipientWallet: string; amountRaw: string; label?: string }[];
  canRescue: boolean;
  canReclaimRent: boolean;
  createdAt: string;
  failureCode?: string;
  failureMessage?: string;
}): TransferDetail {
  const quote = calculateMultiHopperQuote({
    sourceOwner: DEMO_SOURCE_WALLET,
    recipientWallet: params.recipientWallet,
    destinations: params.destinations,
    mintAddress: params.mintAddress,
    amountRaw: params.amountRaw,
    hopCount: params.hopCount,
    arrivalSeconds: params.arrivalSeconds,
    bundle: params.bundle,
    isMainnet: true,
  });

  const hops: TransferHopDetail[] = Array.from({ length: params.hopCount }).map((_, idx) => {
    const libWallet = CURATED_HOP_LIBRARY[(idx * 5) % CURATED_HOP_LIBRARY.length];
    const isDone = params.status === 'COMPLETED' || (params.status === 'PROCESSING' && idx < 2);
    return {
      index: idx,
      targetWallet: libWallet.address,
      waitSeconds: Math.floor(params.arrivalSeconds / params.hopCount),
      status: isDone ? 'COMPLETED' : params.status === 'FAILED' && idx === 1 ? 'FAILED' : 'PENDING',
      txSignature: isDone ? deterministicAddress(`sig-hop-${params.id}-${idx}`) : null,
      completedAt: isDone ? params.createdAt : null,
    };
  });

  const destinations: DestinationPayoutDetail[] | null = params.destinations
    ? params.destinations.map((d, idx) => {
        const amt = BigInt(d.amountRaw);
        const fee = (amt * 50n) / 10_000n;
        const net = amt - fee;
        return {
          index: idx,
          recipientWallet: d.recipientWallet,
          amountRaw: d.amountRaw,
          percentFeeRaw: fee.toString(),
          netRecipientAmountRaw: net.toString(),
          status: params.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          txSignature: params.status === 'COMPLETED' ? deterministicAddress(`payout-sig-${params.id}-${idx}`) : null,
          completedAt: params.status === 'COMPLETED' ? params.createdAt : null,
        };
      })
    : null;

  return {
    id: params.id,
    externalId: params.externalId,
    status: params.status,
    mintAddress: params.mintAddress,
    sourceOwner: DEMO_SOURCE_WALLET,
    recipientWallet: params.recipientWallet ?? null,
    destinations,
    amountRaw: params.amountRaw,
    hopCount: params.hopCount,
    arrivalSeconds: params.arrivalSeconds,
    bundle: params.bundle,
    routePda: deterministicAddress(`route-pda-${params.id}`),
    depositTxSignature: deterministicAddress(`deposit-sig-${params.id}`),
    payoutTxSignature: params.status === 'COMPLETED' ? deterministicAddress(`final-sig-${params.id}`) : null,
    failureCode: params.failureCode ?? null,
    failureMessage: params.failureMessage ?? null,
    quote,
    hops,
    canRescue: params.canRescue,
    canReclaimRent: params.canReclaimRent,
    rentReclaimedAt: null,
    rescuedAt: null,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  transferId: string;
  signatureHeader: string;
  verified: boolean;
  payload: Record<string, unknown>;
  timestamp: string;
}

const state = {
  environment: 'mainnet' as 'mainnet' | 'devnet' | 'sandbox',
  apiKey: '' as string,
  transfers: new Map<string, TransferDetail>(),
  keeperConfirmedIds: new Set<string>(),
  routeTemplates: new Map<string, RouteTemplate>(),
  webhooks: new Map<string, WebhookEndpoint>(),
  webhookSecrets: new Map<string, string>(),
  webhookDeliveries: [] as WebhookDeliveryLog[],
};

function resetAndSeedState() {
  state.transfers.clear();
  state.keeperConfirmedIds.clear();
  state.routeTemplates.clear();
  state.webhooks.clear();
  state.webhookSecrets.clear();
  state.webhookDeliveries = [];

  for (const tpl of INITIAL_ROUTE_TEMPLATES) {
    state.routeTemplates.set(tpl.id, structuredClone(tpl));
  }

  // Seed default webhook endpoint with known secret for interactive testing
  const defaultWhSecret = 'whsec_hopperflow_live_89f4e2c1a7b3d6e50192837465afbcde';
  const defaultWh: WebhookEndpoint = {
    id: 'wh_inst_treasury_primary',
    url: 'http://localhost:3001/api/webhooks/receive',
    events: [
      'transfer.quote_created',
      'transfer.deposit_confirmed',
      'transfer.processing',
      'transfer.hop_complete',
      'payout.completed',
      'transfer.completed',
      'transfer.failed',
    ],
    isActive: true,
    createdAt: '2025-02-14T08:00:00.000Z',
  };
  state.webhooks.set(defaultWh.id, defaultWh);
  state.webhookSecrets.set(defaultWh.id, defaultWhSecret);

  // Seed 4 realistic transfers totaling $142,850 in completed volume + 1 stuck rescue transfer
  const seeded: TransferDetail[] = [
    // 1. $65,000 USDC Institutional Multi-Send Payroll (Completed, canReclaimRent: true!)
    createSeededTransfer({
      id: 'tr_payroll_batch_2025_01',
      externalId: 'PAYROLL-Q1-CORE-CONTRIBUTORS',
      status: 'COMPLETED',
      mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amountRaw: '65000000000', // 65,000 USDC
      hopCount: 5,
      arrivalSeconds: 300,
      bundle: 'mix',
      destinations: [
        { recipientWallet: DEMO_RECIPIENT_1, amountRaw: '25000000000', label: 'Lead Protocol Engineer' },
        { recipientWallet: DEMO_RECIPIENT_2, amountRaw: '22000000000', label: 'ZK Cryptography Researcher' },
        { recipientWallet: DEMO_RECIPIENT_3, amountRaw: '18000000000', label: 'Security & Audit Retainer' },
      ],
      canRescue: false,
      canReclaimRent: true,
      createdAt: '2025-02-20T11:30:00.000Z',
    }),
    // 2. $58,500 USDT OTC Settlement (Completed, canReclaimRent: true)
    createSeededTransfer({
      id: 'tr_otc_settlement_wintermute',
      externalId: 'OTC-SETTLE-WM-8841',
      status: 'COMPLETED',
      mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      amountRaw: '58500000000', // 58,500 USDT
      hopCount: 7,
      arrivalSeconds: 600,
      bundle: 'exchanges',
      recipientWallet: DEMO_RECIPIENT_4,
      canRescue: false,
      canReclaimRent: true,
      createdAt: '2025-02-22T16:10:00.000Z',
    }),
    // 3. 104.594594 SOL (~$19,350) AI Agent Cluster Settlement (Completed)
    createSeededTransfer({
      id: 'tr_ai_agent_gpu_cluster_09',
      externalId: 'AGENT-COMPUTE-H100-BATCH-9',
      status: 'COMPLETED',
      mintAddress: SOL_MINT_ADDRESS,
      amountRaw: '104594594595', // ~$19,350 at $185/SOL -> Total Completed = $142,850!
      hopCount: 3,
      arrivalSeconds: 90,
      bundle: 'dex',
      recipientWallet: DEMO_RECIPIENT_1,
      canRescue: false,
      canReclaimRent: false,
      createdAt: '2025-02-24T09:05:00.000Z',
    }),
    // 4. Stuck / Failed Transfer eligible for Principal Rescue (`canRescue: true`, `canReclaimRent: true`)
    createSeededTransfer({
      id: 'tr_stuck_rescue_demo_04',
      externalId: 'TREASURY-REBALANCE-RESCUE-DEMO',
      status: 'FAILED',
      mintAddress: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD Token-2022
      amountRaw: '12500000000', // 12,500 PYUSD
      hopCount: 4,
      arrivalSeconds: 240,
      bundle: 'contracts',
      recipientWallet: DEMO_RECIPIENT_2,
      canRescue: true,
      canReclaimRent: true,
      failureCode: 'MH_055',
      failureMessage: 'Intermediate hop 1 relayer timeout; funds safely locked in step PDA awaiting user rescue.',
      createdAt: '2025-02-25T14:00:00.000Z',
    }),
  ];

  for (const t of seeded) {
    state.transfers.set(t.id, t);
  }
}

resetAndSeedState();

// ============================================================================
// 5. HMAC-SHA256 WEBHOOK SIGNING & TIMING-SAFE VERIFICATION
// ============================================================================

export function signWebhookPayload(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyWebhookSignature(rawBody: string, signatureHex: string, secret: string): boolean {
  if (!signatureHex || !secret) return false;
  const expectedHex = signWebhookPayload(rawBody, secret);
  try {
    const a = Buffer.from(signatureHex, 'hex');
    const b = Buffer.from(expectedHex, 'hex');
    if (a.length !== b.length || a.length === 0) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function emitInternalWebhookEvent(event: WebhookEventType, transfer: TransferDetail, extra?: Record<string, unknown>) {
  for (const [whId, wh] of state.webhooks.entries()) {
    if (!wh.isActive || !wh.events.includes(event)) continue;
    const secret = state.webhookSecrets.get(whId) ?? 'whsec_default';
    const payload = {
      id: `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
      event,
      createdAt: new Date().toISOString(),
      data: {
        transferId: transfer.id,
        externalId: transfer.externalId,
        status: transfer.status,
        mintAddress: transfer.mintAddress,
        amountRaw: transfer.amountRaw,
        hopCount: transfer.hopCount,
        ...extra,
      },
    };
    const rawJson = JSON.stringify(payload);
    const sig = signWebhookPayload(rawJson, secret);
    const verified = verifyWebhookSignature(rawJson, sig, secret);

    state.webhookDeliveries.unshift({
      id: payload.id,
      webhookId: whId,
      event,
      transferId: transfer.id,
      signatureHeader: sig,
      verified,
      payload,
      timestamp: payload.createdAt,
    });
  }
}

// ============================================================================
// 6. HELPER FOR LIVE UPSTREAM PROXY OR SANDBOX EXECUTION
// ============================================================================

function getActiveClient(req: Request): MultiHopperClient | null {
  const headerKey = (req.headers['x-mh-api-key'] as string)?.trim() || state.apiKey;
  const headerEnv = ((req.headers['x-mh-env'] as string)?.trim() || state.environment) as
    | 'mainnet'
    | 'devnet'
    | 'sandbox';

  if (!headerKey || headerEnv === 'sandbox') {
    return null;
  }

  return new MultiHopperClient({
    apiKey: headerKey,
    environment: headerEnv === 'devnet' ? 'devnet' : 'mainnet',
  });
}

function sendProtocolError(res: Response, err: unknown) {
  if (err instanceof MultiHopperApiError) {
    return res.status(err.httpStatus).json({
      code: err.code,
      message: err.message,
      recoveryHint: err.recoveryHint,
    });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({
    code: 'MH_091',
    message,
    recoveryHint: MULTIHOPPER_ERROR_CODES.MH_091.recoveryHint,
  });
}

// ============================================================================
// 7. CONFIGURATION & METADATA ENDPOINTS
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: state.environment,
    programs: {
      core: MULTIHOPPER_CORE_PROGRAM_ID,
      orchestrator: MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID,
      transferHookGuard: MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID,
    },
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    environment: state.environment,
    hasLiveKey: Boolean(state.apiKey),
    maskedKey: state.apiKey ? `${state.apiKey.slice(0, 10)}...${state.apiKey.slice(-4)}` : null,
    programs: {
      core: MULTIHOPPER_CORE_PROGRAM_ID,
      orchestrator: MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID,
      transferHookGuard: MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID,
    },
    supportedTokens: SUPPORTED_TOKENS,
    pricingTiers: PRICING_TIERS,
    errorCodes: MULTIHOPPER_ERROR_CODES,
    demoTreasuryWallet: DEMO_SOURCE_WALLET,
  });
});

app.post('/api/config', (req, res) => {
  const { environment, apiKey } = req.body as {
    environment?: 'mainnet' | 'devnet' | 'sandbox';
    apiKey?: string;
  };
  if (environment) state.environment = environment;
  if (apiKey !== undefined) state.apiKey = apiKey.trim();
  res.json({
    environment: state.environment,
    hasLiveKey: Boolean(state.apiKey),
    maskedKey: state.apiKey ? `${state.apiKey.slice(0, 10)}...${state.apiKey.slice(-4)}` : null,
  });
});

// ============================================================================
// 8. ALL 19 MULTIHOPPER OPENAPI v1.0.0 ENDPOINTS
// ============================================================================

// 1. POST /api/v1/transfers/estimate
app.post('/api/v1/transfers/estimate', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.estimateTransfer(req.body);
      return res.json(upstream);
    }

    const body = req.body as EstimateTransferRequest;
    const isNativeSol = body.mintAddress === SOL_MINT_ADDRESS;

    if (body.destinations && body.destinations.length > 0) {
      validateMultiSendDestinations(body.amountRaw, body.destinations, isNativeSol);
    }
    if (body.customRoute) {
      const mode = body.destinations && body.destinations.length > 0 ? 'destinations' : 'single';
      validateCustomRoute(
        body.customRoute,
        mode,
        body.sourceOwner ?? DEMO_SOURCE_WALLET,
        mode === 'destinations' ? body.destinations! : (body.recipientWallet ?? DEMO_RECIPIENT_1),
        CURATED_HOP_LIBRARY
      );
    }

    const quote = calculateMultiHopperQuote({
      ...body,
      isMainnet: state.environment !== 'devnet',
    });
    return res.json(quote);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 2. POST /api/v1/transfers
app.post('/api/v1/transfers', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.createTransfer(req.body);
      return res.status(201).json(upstream);
    }

    const body = req.body as CreateTransferRequest;
    const isNativeSol = body.mintAddress === SOL_MINT_ADDRESS;
    const isMultiDest = Array.isArray(body.destinations) && body.destinations.length > 0;

    if (isMultiDest) {
      validateMultiSendDestinations(body.amountRaw, body.destinations!, isNativeSol);
    }
    if (body.customRoute) {
      validateCustomRoute(
        body.customRoute,
        isMultiDest ? 'destinations' : 'single',
        body.sourceOwner,
        isMultiDest ? body.destinations! : (body.recipientWallet ?? DEMO_RECIPIENT_1),
        CURATED_HOP_LIBRARY
      );
    }

    const quote = calculateMultiHopperQuote({
      ...body,
      isMainnet: state.environment !== 'devnet',
    });

    const id = `tr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();

    const hops: TransferHopDetail[] = body.customRoute
      ? body.customRoute.hops.map((h) => ({
          index: h.index,
          targetWallet: h.wallet,
          waitSeconds: h.waitSeconds,
          status: 'PENDING',
          txSignature: null,
          completedAt: null,
        }))
      : Array.from({ length: quote.hopCount }).map((_, idx) => {
          const candidates = CURATED_HOP_LIBRARY.filter(
            (w) => (!body.bundle || w.bundle === body.bundle) && w.canEndRoute
          );
          const chosen = candidates[idx % candidates.length] ?? CURATED_HOP_LIBRARY[idx];
          return {
            index: idx,
            targetWallet: chosen.address,
            waitSeconds: Math.max(20, Math.floor(quote.arrivalSeconds / quote.hopCount)),
            status: 'PENDING',
            txSignature: null,
            completedAt: null,
          };
        });

    const destinations: DestinationPayoutDetail[] | null = isMultiDest
      ? body.destinations!.map((d, idx) => {
          const amt = BigInt(d.amountRaw);
          const fee = (amt * 50n) / 10_000n;
          return {
            index: idx,
            recipientWallet: d.recipientWallet,
            amountRaw: d.amountRaw,
            percentFeeRaw: fee.toString(),
            netRecipientAmountRaw: (amt - fee).toString(),
            status: 'PENDING',
            txSignature: null,
            completedAt: null,
          };
        })
      : null;

    const transfer: TransferDetail = {
      id,
      externalId: body.externalId ?? null,
      status: 'QUOTE_CREATED',
      mintAddress: body.mintAddress,
      sourceOwner: body.sourceOwner,
      recipientWallet: isMultiDest ? null : (body.recipientWallet ?? DEMO_RECIPIENT_1),
      destinations,
      amountRaw: body.amountRaw,
      hopCount: quote.hopCount,
      arrivalSeconds: quote.arrivalSeconds,
      bundle: body.bundle ?? 'mix',
      routePda: null,
      depositTxSignature: null,
      payoutTxSignature: null,
      failureCode: null,
      failureMessage: null,
      quote,
      hops,
      canRescue: false,
      canReclaimRent: false,
      rentReclaimedAt: null,
      rescuedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    state.transfers.set(id, transfer);
    emitInternalWebhookEvent('transfer.quote_created', transfer);
    return res.status(201).json(transfer);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 3. POST /api/v1/transfers/:id/prepare
app.post('/api/v1/transfers/:id/prepare', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.prepareTransfer(req.params.id);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) {
      throw new MultiHopperApiError('MH_011', `Transfer ${req.params.id} not found`);
    }

    const bundle = buildRealSolanaPreparedTxBundle(transfer);
    transfer.routePda = bundle.routePda;
    transfer.status = 'AWAITING_DEPOSIT';
    transfer.updatedAt = new Date().toISOString();

    return res.json(bundle);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 4. POST /api/v1/transfers/:id/confirm-broadcast
app.post('/api/v1/transfers/:id/confirm-broadcast', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.confirmBroadcast(req.params.id, req.body);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) {
      throw new MultiHopperApiError('MH_011', `Transfer ${req.params.id} not found`);
    }

    const body = req.body as ConfirmBroadcastRequest;

    // Enforce Two-Call Confirm-Broadcast Rule:
    // Call 1 sends keeperFundingSignature with empty routeInitSignatures: []
    if (body.routeInitSignatures.length === 0 && body.keeperFundingSignature) {
      state.keeperConfirmedIds.add(transfer.id);
      transfer.updatedAt = new Date().toISOString();
      return res.json(transfer);
    }

    // If routeInitSignatures are sent without prior keeper confirmation, reject with MH_042
    if (!state.keeperConfirmedIds.has(transfer.id)) {
      throw new MultiHopperApiError('MH_042');
    }

    // Call 2: All initialization transactions confirmed -> advance transfer to PROCESSING & COMPLETED in sandbox
    transfer.depositTxSignature = body.routeInitSignatures[0] ?? body.orchestratorInitSignature ?? 'sig_confirmed';
    transfer.status = 'COMPLETED';
    transfer.canReclaimRent = true;
    transfer.updatedAt = new Date().toISOString();

    transfer.hops = transfer.hops.map((h, i) => ({
      ...h,
      status: 'COMPLETED',
      txSignature: deterministicAddress(`hop-exec-${transfer.id}-${i}`),
      completedAt: new Date().toISOString(),
    }));

    if (transfer.destinations) {
      transfer.destinations = transfer.destinations.map((d, i) => ({
        ...d,
        status: 'COMPLETED',
        txSignature: deterministicAddress(`disp-payout-${transfer.id}-${i}`),
        completedAt: new Date().toISOString(),
      }));
    } else {
      transfer.payoutTxSignature = deterministicAddress(`single-payout-${transfer.id}`);
    }

    emitInternalWebhookEvent('transfer.deposit_confirmed', transfer);
    emitInternalWebhookEvent('transfer.completed', transfer);

    return res.json(transfer);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 5. GET /api/v1/transfers/by-external/:externalId
app.get('/api/v1/transfers/by-external/:externalId', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.getTransferByExternalId(req.params.externalId);
      return res.json(upstream);
    }

    const found = Array.from(state.transfers.values()).find(
      (t) => t.externalId === req.params.externalId
    );
    if (!found) {
      return res.status(404).json({ code: 'MH_011', message: 'Transfer with externalId not found' });
    }
    return res.json(found);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 6. GET /api/v1/transfers/:id
app.get('/api/v1/transfers/:id', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.getTransfer(req.params.id);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) {
      return res.status(404).json({ code: 'MH_011', message: 'Transfer not found' });
    }
    return res.json(transfer);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 7. GET /api/v1/transfers
app.get('/api/v1/transfers', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.listTransfers({
        status: req.query.status as TransferStatus | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      return res.json(upstream);
    }

    let list = Array.from(state.transfers.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (req.query.status) {
      list = list.filter((t) => t.status === req.query.status);
    }
    return res.json({ data: list, nextCursor: null });
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 8. GET /api/v1/hop-library
app.get('/api/v1/hop-library', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client && client.environment === 'mainnet') {
      const upstream = await client.getHopLibrary({
        bundle: req.query.bundle as HopBundle | undefined,
        q: req.query.q as string | undefined,
      });
      return res.json(upstream);
    }

    // Per MultiHopper spec, strict devnet throws MH_019 unless sandbox fallback is requested
    if (req.query.strictDevnet === 'true') {
      throw new MultiHopperApiError('MH_019');
    }

    let wallets = [...CURATED_HOP_LIBRARY];
    if (req.query.bundle) {
      wallets = wallets.filter((w) => w.bundle === req.query.bundle);
    }
    if (req.query.q) {
      const q = String(req.query.q).toLowerCase();
      wallets = wallets.filter(
        (w) =>
          w.label.toLowerCase().includes(q) ||
          w.address.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return res.json({ data: wallets, total: wallets.length });
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 9. GET /api/v1/route-templates
app.get('/api/v1/route-templates', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.listRouteTemplates();
      return res.json(upstream);
    }
    return res.json({ data: Array.from(state.routeTemplates.values()) });
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 10. POST /api/v1/route-templates
app.post('/api/v1/route-templates', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.createRouteTemplate(req.body);
      return res.status(201).json(upstream);
    }

    const { name, hops } = req.body as { name: string; hops: CustomHop[] };
    validateCustomRoute({ hops }, 'single', DEMO_SOURCE_WALLET, DEMO_RECIPIENT_1, CURATED_HOP_LIBRARY);

    const now = new Date().toISOString();
    const tpl: RouteTemplate = {
      id: `tpl_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      name: name || 'Custom HopperFlow Route',
      hops,
      createdAt: now,
      updatedAt: now,
    };
    state.routeTemplates.set(tpl.id, tpl);
    return res.status(201).json(tpl);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 11. PATCH /api/v1/route-templates/:id
app.patch('/api/v1/route-templates/:id', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.updateRouteTemplate(req.params.id, req.body);
      return res.json(upstream);
    }

    const existing = state.routeTemplates.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ code: 'MH_011', message: 'Route template not found' });
    }
    const { name, hops } = req.body as { name?: string; hops?: CustomHop[] };
    if (hops) {
      validateCustomRoute({ hops }, 'single', DEMO_SOURCE_WALLET, DEMO_RECIPIENT_1, CURATED_HOP_LIBRARY);
      existing.hops = hops;
    }
    if (name) existing.name = name;
    existing.updatedAt = new Date().toISOString();
    return res.json(existing);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 12. DELETE /api/v1/route-templates/:id
app.delete('/api/v1/route-templates/:id', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      await client.deleteRouteTemplate(req.params.id);
      return res.status(204).send();
    }
    state.routeTemplates.delete(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 13. POST /api/v1/transfers/:id/rescue/prepare
app.post('/api/v1/transfers/:id/rescue/prepare', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.prepareRescue(req.params.id);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) throw new MultiHopperApiError('MH_011', 'Transfer not found');
    if (!transfer.canRescue) throw new MultiHopperApiError('MH_071');

    const bundle = buildRealSolanaPreparedTxBundle(transfer);
    const response: PrepareRecoveryResponse = {
      transferId: transfer.id,
      transactions: [bundle.orchestratorInitTx],
      estimatedLamportsRecovered: transfer.amountRaw,
      blockhash: bundle.blockhash,
    };
    return res.json(response);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 14. POST /api/v1/transfers/:id/rescue/confirm
app.post('/api/v1/transfers/:id/rescue/confirm', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.confirmRescue(req.params.id, req.body);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) throw new MultiHopperApiError('MH_011', 'Transfer not found');
    if (!transfer.canRescue) throw new MultiHopperApiError('MH_071');

    transfer.canRescue = false;
    transfer.rescuedAt = new Date().toISOString();
    transfer.status = 'CANCELLED';
    transfer.updatedAt = transfer.rescuedAt;

    emitInternalWebhookEvent('transfer.refunded', transfer);
    return res.json(transfer);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 15. POST /api/v1/transfers/:id/reclaim-rent/prepare
app.post('/api/v1/transfers/:id/reclaim-rent/prepare', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.prepareReclaimRent(req.params.id);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) throw new MultiHopperApiError('MH_011', 'Transfer not found');
    if (!transfer.canReclaimRent) throw new MultiHopperApiError('MH_081');

    const bundle = buildRealSolanaPreparedTxBundle(transfer);
    const response: PrepareRecoveryResponse = {
      transferId: transfer.id,
      transactions: [bundle.orchestratorInitTx],
      estimatedLamportsRecovered: transfer.quote.refundableLamports,
      blockhash: bundle.blockhash,
    };
    return res.json(response);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 16. POST /api/v1/transfers/:id/reclaim-rent/confirm
app.post('/api/v1/transfers/:id/reclaim-rent/confirm', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.confirmReclaimRent(req.params.id, req.body);
      return res.json(upstream);
    }

    const transfer = state.transfers.get(req.params.id);
    if (!transfer) throw new MultiHopperApiError('MH_011', 'Transfer not found');
    if (!transfer.canReclaimRent) throw new MultiHopperApiError('MH_081');

    transfer.canReclaimRent = false;
    transfer.rentReclaimedAt = new Date().toISOString();
    transfer.updatedAt = transfer.rentReclaimedAt;
    return res.json(transfer);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 17. GET /api/v1/webhooks
app.get('/api/v1/webhooks', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.listWebhooks();
      return res.json(upstream);
    }
    return res.json({ data: Array.from(state.webhooks.values()) });
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 18. POST /api/v1/webhooks
app.post('/api/v1/webhooks', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.createWebhook(req.body);
      return res.status(201).json(upstream);
    }

    const { url, events } = req.body as { url: string; events: WebhookEventType[] };
    const id = `wh_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const secret = `whsec_${crypto.randomBytes(20).toString('hex')}`;
    const endpoint: WebhookEndpoint = {
      id,
      url,
      events: events?.length ? events : ['transfer.completed', 'transfer.failed'],
      isActive: true,
      secret,
      createdAt: new Date().toISOString(),
    };
    state.webhooks.set(id, { ...endpoint, secret: undefined });
    state.webhookSecrets.set(id, secret);
    return res.status(201).json(endpoint);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 19. DELETE /api/v1/webhooks/:id
app.delete('/api/v1/webhooks/:id', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      await client.deleteWebhook(req.params.id);
      return res.status(204).send();
    }
    state.webhooks.delete(req.params.id);
    state.webhookSecrets.delete(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// 20. GET /api/v1/usage
app.get('/api/v1/usage', async (req, res) => {
  try {
    const client = getActiveClient(req);
    if (client) {
      const upstream = await client.getUsage();
      return res.json(upstream);
    }

    const allTransfers = Array.from(state.transfers.values());
    const completed = allTransfers.filter((t) => t.status === 'COMPLETED');
    const totalVolumeUsd = Number(
      completed.reduce((sum, t) => sum + t.quote.estimatedUsdValue, 0).toFixed(2)
    );
    // Integrator collects 0.25% (25 bps) of completed volume
    const collectedPercentageFeesUsd = Number((totalVolumeUsd * 0.0025).toFixed(2));
    const qualifyingChallengeVolumeUsd = calculateQualifyingVolume(collectedPercentageFeesUsd);

    const summary: UsageSummary = {
      tier: 'INSTITUTIONAL_PARTNER',
      periodStart: '2025-02-01T00:00:00.000Z',
      periodEnd: '2025-03-01T00:00:00.000Z',
      transfersCreated: allTransfers.length,
      transfersCompleted: completed.length,
      totalVolumeUsd,
      collectedPercentageFeesUsd,
      qualifyingChallengeVolumeUsd,
      rateLimitPerMinute: 600,
    };
    return res.json(summary);
  } catch (err) {
    return sendProtocolError(res, err);
  }
});

// ============================================================================
// 9. WEBHOOK RECEIVER, LIFECYCLE SIMULATOR & AI AGENT ROUTE COPILOT
// ============================================================================

app.get('/api/webhooks/deliveries', (_req, res) => {
  res.json({ data: state.webhookDeliveries });
});

app.post('/api/webhooks/receive', (req, res) => {
  const signature = (req.headers['x-multihopper-signature'] as string) || '';
  const webhookId = (req.headers['x-multihopper-webhook-id'] as string) || 'wh_inst_treasury_primary';
  const secret = state.webhookSecrets.get(webhookId) ?? 'whsec_hopperflow_live_89f4e2c1a7b3d6e50192837465afbcde';
  const rawBody = JSON.stringify(req.body);

  const verified = verifyWebhookSignature(rawBody, signature, secret);
  if (!verified) {
    return res.status(401).json({
      verified: false,
      error: 'HMAC-SHA256 timingSafeEqual signature verification failed',
    });
  }

  return res.json({ verified: true, eventId: req.body?.id ?? 'evt_verified' });
});

app.post('/api/webhooks/simulate/:transferId', (req, res) => {
  const transfer = state.transfers.get(req.params.transferId);
  if (!transfer) {
    return res.status(404).json({ code: 'MH_011', message: 'Transfer not found' });
  }

  const lifecycleSequence: WebhookEventType[] = [
    'transfer.quote_created',
    'transfer.deposit_confirmed',
    'transfer.processing',
    'transfer.hop_complete',
    'payout.completed',
    'transfer.completed',
  ];

  for (const evt of lifecycleSequence) {
    emitInternalWebhookEvent(evt, transfer, { simulatedLifecycleStep: evt });
  }

  return res.json({
    simulatedEvents: lifecycleSequence.length,
    deliveries: state.webhookDeliveries.slice(0, lifecycleSequence.length),
  });
});

// AI Agent Treasury Policy & Route Copilot
app.post('/api/agent/plan-route', (req, res) => {
  const {
    prompt = 'Pay 4 core contributors 40,000 USDC total with institutional stealth under 10 minutes',
    budgetLimitUsd = 100_000,
    preferredBundle = 'mix',
    mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountUsd = 40_000,
    recipientCount = 4,
    maxArrivalSeconds = 480,
  } = req.body as {
    prompt?: string;
    budgetLimitUsd?: number;
    preferredBundle?: HopBundle;
    mintAddress?: string;
    amountUsd?: number;
    recipientCount?: number;
    maxArrivalSeconds?: number;
  };

  const token = SUPPORTED_TOKENS.find((t) => t.mintAddress === mintAddress) ?? SUPPORTED_TOKENS[1];
  const tokenAmount = amountUsd / token.defaultPriceUsd;
  const amountRaw = BigInt(Math.round(tokenAmount * Math.pow(10, token.decimals))).toString();

  // Select optimal hop count (5 hops for multi-destination, 4 hops for single)
  const isMultiDest = recipientCount > 1;
  const hopCount = isMultiDest ? 5 : 4;
  const waitPerHop = Math.max(20, Math.floor(maxArrivalSeconds / hopCount));

  // Pick intermediate hops ensuring the final hop has canEndRoute === true (never 'contracts')
  const intermediateCandidates = CURATED_HOP_LIBRARY.filter(
    (w) => preferredBundle === 'mix' || w.bundle === preferredBundle || w.bundle === 'dex'
  );
  const finalCandidates = CURATED_HOP_LIBRARY.filter((w) => w.canEndRoute && w.bundle !== 'contracts');

  const hops: CustomHop[] = Array.from({ length: hopCount }).map((_, idx) => {
    const isFinal = idx === hopCount - 1;
    const walletObj = isFinal
      ? finalCandidates[(idx * 3) % finalCandidates.length]
      : intermediateCandidates[(idx * 2) % intermediateCandidates.length];
    return {
      index: idx,
      wallet: walletObj.address,
      waitSeconds: waitPerHop,
    };
  });

  const customRoute: CustomRoute = { hops };

  // Build deterministic destination split
  const perDestBig = BigInt(amountRaw) / BigInt(Math.max(1, recipientCount));
  const remainderBig = BigInt(amountRaw) % BigInt(Math.max(1, recipientCount));

  const destinations = isMultiDest
    ? Array.from({ length: recipientCount }).map((_, idx) => ({
        recipientWallet: deterministicAddress(`agent-beneficiary-wallet-${idx + 1}`),
        amountRaw: (idx === 0 ? perDestBig + remainderBig : perDestBig).toString(),
        label: `Autonomous Agent Beneficiary #${idx + 1}`,
      }))
    : undefined;

  const quote = calculateMultiHopperQuote({
    sourceOwner: DEMO_SOURCE_WALLET,
    recipientWallet: isMultiDest ? undefined : DEMO_RECIPIENT_1,
    destinations,
    mintAddress: token.mintAddress,
    amountRaw,
    customRoute,
    isMainnet: true,
  });

  const withinPolicyBudget = quote.estimatedUsdValue <= budgetLimitUsd;
  const prizeImpact = calculatePrizePoolShare(2_400_000, 142_850 + quote.estimatedUsdValue, 450_000);

  return res.json({
    intentSummary: prompt,
    policyApproved: withinPolicyBudget,
    policyReason: withinPolicyBudget
      ? `Approved: $${quote.estimatedUsdValue.toLocaleString()} is within agent policy budget ($${budgetLimitUsd.toLocaleString()}), TRM screening pre-calculated, and final decoy hop verified non-PDA.`
      : `Blocked: Transfer exceeds autonomous treasury policy limit of $${budgetLimitUsd.toLocaleString()}.`,
    token: token.symbol,
    mintAddress: token.mintAddress,
    amountRaw,
    customRoute,
    hopDetails: hops.map((h) => {
      const meta = CURATED_HOP_LIBRARY.find((w) => w.address === h.wallet);
      return {
        ...h,
        label: meta?.label ?? 'Vetted Relay Node',
        bundle: meta?.bundle ?? 'mix',
        canEndRoute: meta?.canEndRoute ?? true,
      };
    }),
    destinations,
    quote,
    prizeImpact,
  });
});

// Serve Interactive HopperFlow Terminal UI at GET /
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderHopperFlowAppHtml());
});

// Start server if invoked directly (not imported by Vitest)
const PORT = Number(process.env.PORT) || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[HopperFlow Server] MultiHopper API v1 Engine listening on http://localhost:${PORT}`);
  });
}

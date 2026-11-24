import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

export type EnvironmentMode = 'sandbox' | 'mainnet' | 'devnet';
export type HopBundleCategory = 'cex' | 'dex' | 'exchanges' | 'kol' | 'contracts' | 'mix';
export type TransferPhase =
  | 'quoted'
  | 'funding'
  | 'deploying'
  | 'executing'
  | 'settled'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface TokenConfig {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  priceUsd: number;
  isToken2022?: boolean;
  iconColor: string;
}

export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: 'SOL',
    name: 'Wrapped SOL (Native)',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    priceUsd: 185.0,
    iconColor: '#14F195',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (Circle)',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    priceUsd: 1.0,
    iconColor: '#2775CA',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    priceUsd: 1.0,
    iconColor: '#26A17B',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter Aggregator',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    priceUsd: 1.12,
    iconColor: '#00C2FF',
  },
  {
    symbol: 'BONK',
    name: 'Bonk Community Token',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    priceUsd: 0.000028,
    iconColor: '#F59E0B',
  },
  {
    symbol: 'PYUSD',
    name: 'PayPal USD (Token-2022)',
    mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
    decimals: 6,
    priceUsd: 1.0,
    isToken2022: true,
    iconColor: '#9945FF',
  },
];

export interface HopNode {
  index: number;
  walletAddress: string;
  label: string;
  bundle: HopBundleCategory;
  waitSeconds: number;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  txSignature?: string;
  trmScreened: boolean;
  isDecoyExit?: boolean;
}

export interface DestinationEntry {
  id: string;
  recipientWallet: string;
  amountUi: string;
  amountRaw: string;
  label?: string;
  status?: 'pending' | 'settled';
  txSignature?: string;
}

export interface FeeEstimateBreakdown {
  tierIndex: number;
  tierName: string;
  usdValue: number;
  protocolFeeBps: number;
  integratorRevShareBps: number;
  protocolFeeUsd: number;
  integratorShareUsd: number;
  flatHopFeeLamports: number;
  complianceFeeLamports: number;
  screenedWalletCount: number;
  ataRentLamports: number;
  refundableLamports: number;
  totalUpfrontLamports: number;
  isTierCapped: boolean;
  effectiveFeePct: number;
}

export interface TransferRecord {
  id: string;
  supportBundleId: string;
  createdAt: string;
  sourceWallet: string;
  tokenSymbol: string;
  tokenMint: string;
  amountUi: number;
  amountRaw: string;
  usdValue: number;
  mode: 'single' | 'multi';
  recipientWallet?: string;
  destinations: DestinationEntry[];
  phase: TransferPhase;
  routingMode: 'random' | 'template' | 'custom';
  routeTemplateId?: string;
  hops: HopNode[];
  currentHopIndex: number;
  feeBreakdown: FeeEstimateBreakdown;
  wrapperVaultMint: string;
  integratorRewardsWallet: string;
  recovery: {
    canRescue: boolean;
    canReclaimRent: boolean;
    rescuedAt?: string;
    reclaimedAt?: string;
    stuckPrincipalAmountUi?: number;
    refundableLamports: number;
  };
  signatures: {
    keeperFundingSig?: string;
    routeInitSigs?: string[];
    orchestratorInitSig?: string;
    sessionInitSigs?: string[];
    dispersionInitSigs?: string[];
  };
}

export interface HopLibraryItem {
  id: string;
  address: string;
  label: string;
  category: HopBundleCategory;
  canEndRoute: boolean;
  historicalTxCount: number;
  trmRiskScore: 'LOW' | 'CLEAN';
  tags: string[];
}

export interface CustomRouteHopSpec {
  id: string;
  type: 'bundle' | 'wallet';
  bundle?: HopBundleCategory;
  walletAddress?: string;
  label?: string;
  waitSeconds: number;
}

export interface RouteTemplate {
  id: string;
  name: string;
  description: string;
  hopCount: number;
  totalWaitSeconds: number;
  createdAt: string;
  hops: CustomRouteHopSpec[];
  compatibleWithMultiSend: boolean;
}

export interface PreparedTransactionsBundle {
  transferId: string;
  keeperFundingTx: string; // Base64 VersionedTransaction (user signs alone)
  routeInitTxs: string[]; // Base64 VersionedTransaction v0 (pre-signed by server ephemeral keypair)
  orchestratorInitTx: string; // Base64 Legacy Transaction (pre-signed by server wrapperMint/depositAuthority)
  sessionInitTxs: string[]; // Base64 VersionedTransaction v0
  dispersionInitTxs: string[]; // Base64 VersionedTransaction v0 (for Multi-Send)
  serverEphemeralPubkeys: string[];
}

export interface WebhookEventLog {
  id: string;
  eventType: string;
  transferId: string;
  timestamp: string;
  signatureHeader: string;
  verified: boolean;
  payload: Record<string, unknown>;
}

// Raydium CLMM 10-Tier Fee Schedule (Tiers 0-9)
export const RAYDIUM_CLMM_TIERS = [
  { tier: 0, minUsd: 0, maxUsd: 100, flatHopLamports: 1_500_000, name: 'Tier 0 (Micro <$100)' },
  { tier: 1, minUsd: 100, maxUsd: 500, flatHopLamports: 2_000_000, name: 'Tier 1 ($100-$500)' },
  { tier: 2, minUsd: 500, maxUsd: 2_500, flatHopLamports: 2_500_000, name: 'Tier 2 ($500-$2.5K)' },
  { tier: 3, minUsd: 2_500, maxUsd: 10_000, flatHopLamports: 3_500_000, name: 'Tier 3 ($2.5K-$10K)' },
  { tier: 4, minUsd: 10_000, maxUsd: 25_000, flatHopLamports: 5_000_000, name: 'Tier 4 ($10K-$25K)' },
  { tier: 5, minUsd: 25_000, maxUsd: 50_000, flatHopLamports: 6_500_000, name: 'Tier 5 ($25K-$50K)' },
  { tier: 6, minUsd: 50_000, maxUsd: 100_000, flatHopLamports: 8_000_000, name: 'Tier 6 ($50K-$100K)' },
  { tier: 7, minUsd: 100_000, maxUsd: 250_000, flatHopLamports: 10_000_000, name: 'Tier 7 ($100K-$250K)' },
  { tier: 8, minUsd: 250_000, maxUsd: 1_000_000, flatHopLamports: 12_500_000, name: 'Tier 8 ($250K-$1M)' },
  { tier: 9, minUsd: 1_000_000, maxUsd: Infinity, flatHopLamports: 15_000_000, name: 'Tier 9 (Institutional $1M+)' },
];

export function calculateLocalFeeEstimate(
  usdValue: number,
  hopCount: number,
  destinationCount: number,
): FeeEstimateBreakdown {
  const matchedTier =
    RAYDIUM_CLMM_TIERS.find((t) => usdValue >= t.minUsd && usdValue < t.maxUsd) ||
    RAYDIUM_CLMM_TIERS[RAYDIUM_CLMM_TIERS.length - 1];

  const protocolFeeBps = 50; // 0.50% total percentage fee
  const integratorRevShareBps = 25; // 0.25% atomic integrator split (50% of protocol fee)
  const protocolFeeUsd = usdValue * (protocolFeeBps / 10000);
  const integratorShareUsd = usdValue * (integratorRevShareBps / 10000);

  const flatHopFeeLamports = matchedTier.flatHopLamports * hopCount;
  // TRM Labs compliance fee: 0.002 SOL (2,000,000 lamports) per screened wallet (source + destinations)
  const screenedWalletCount = 1 + destinationCount;
  const complianceFeeLamports = screenedWalletCount * 2_000_000;
  // TokenAccount ATA rent: ~2,039,280 lamports per destination
  const ataRentLamports = destinationCount * 2_039_280;
  // Refundable step/route PDA rent: ~3,150,000 lamports per hop + 4,200,000 route state PDA
  const refundableLamports = hopCount * 3_150_000 + 4_200_000;

  const totalUpfrontLamports =
    flatHopFeeLamports + complianceFeeLamports + ataRentLamports + refundableLamports;

  // Check if near tier boundary where tier cap applies
  const isTierCapped = usdValue > 0 && usdValue - matchedTier.minUsd < matchedTier.minUsd * 0.08;
  const solUsd = 185;
  const nonRefundableSolUsd =
    ((flatHopFeeLamports + complianceFeeLamports + ataRentLamports) / 1e9) * solUsd;
  const effectiveFeePct = usdValue > 0 ? ((protocolFeeUsd + nonRefundableSolUsd) / usdValue) * 100 : 0;

  return {
    tierIndex: matchedTier.tier,
    tierName: matchedTier.name,
    usdValue,
    protocolFeeBps,
    integratorRevShareBps,
    protocolFeeUsd,
    integratorShareUsd,
    flatHopFeeLamports,
    complianceFeeLamports,
    screenedWalletCount,
    ataRentLamports,
    refundableLamports,
    totalUpfrontLamports,
    isTierCapped,
    effectiveFeePct,
  };
}

/**
 * Generates authentic Solana VersionedTransaction (v0) & Legacy Transaction base64 payloads
 * pre-signed by simulated server ephemeral keypairs so the browser can perform genuine
 * cryptographic deserialization and non-destructive partial signing!
 */
export function buildRealCryptographicPreparedBundle(
  transferId: string,
  userPubkeyStr: string,
  hopCount: number,
  destinationCount: number,
): PreparedTransactionsBundle {
  let userPubkey: PublicKey;
  try {
    userPubkey = new PublicKey(userPubkeyStr);
  } catch {
    userPubkey = Keypair.generate().publicKey;
  }

  // Deterministic valid 32-byte base58 recentBlockhash
  const dummyBlockhash = Keypair.generate().publicKey.toBase58();
  const serverEphemeralPubkeys: string[] = [];

  // 1. keeperFundingTx: VersionedTransaction v0 where user is sole signer
  const keeperKeypair = Keypair.generate();
  const keeperMsg = new TransactionMessage({
    payerKey: userPubkey,
    recentBlockhash: dummyBlockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: keeperKeypair.publicKey,
        lamports: 15_000_000,
      }),
    ],
  }).compileToV0Message();
  const keeperVtx = new VersionedTransaction(keeperMsg);
  const keeperFundingTx = Buffer.from(keeperVtx.serialize()).toString('base64');

  // 2. routeInitTxs: VersionedTransaction v0 pre-signed by a server ephemeral step PDA keypair
  const routeEphemeral = Keypair.generate();
  serverEphemeralPubkeys.push(routeEphemeral.publicKey.toBase58());
  const routeMsg = new TransactionMessage({
    payerKey: userPubkey,
    recentBlockhash: dummyBlockhash,
    instructions: [
      // Instruction requiring both userPubkey and routeEphemeral as signers
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: routeEphemeral.publicKey,
        lamports: 3_150_000 * hopCount,
      }),
      SystemProgram.transfer({
        fromPubkey: routeEphemeral.publicKey,
        toPubkey: userPubkey,
        lamports: 100,
      }),
    ],
  }).compileToV0Message();
  const routeVtx = new VersionedTransaction(routeMsg);
  routeVtx.sign([routeEphemeral]); // Pre-signed by server!
  const routeInitTxs = [Buffer.from(routeVtx.serialize()).toString('base64')];

  // 3. orchestratorInitTx: Legacy Transaction pre-signed by server wrapperMint & depositAuthority
  const wrapperMintKeypair = Keypair.generate();
  serverEphemeralPubkeys.push(wrapperMintKeypair.publicKey.toBase58());
  const legacyTx = new Transaction({
    feePayer: userPubkey,
    recentBlockhash: dummyBlockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: userPubkey,
      toPubkey: wrapperMintKeypair.publicKey,
      lamports: 4_200_000,
    }),
    SystemProgram.transfer({
      fromPubkey: wrapperMintKeypair.publicKey,
      toPubkey: userPubkey,
      lamports: 100,
    }),
  );
  legacyTx.partialSign(wrapperMintKeypair); // Server pre-signs Legacy Tx
  const orchestratorInitTx = Buffer.from(
    legacyTx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  ).toString('base64');

  // 4. sessionInitTxs: VersionedTransaction v0
  const sessionEphemeral = Keypair.generate();
  serverEphemeralPubkeys.push(sessionEphemeral.publicKey.toBase58());
  const sessionMsg = new TransactionMessage({
    payerKey: userPubkey,
    recentBlockhash: dummyBlockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: sessionEphemeral.publicKey,
        lamports: 2_000_000,
      }),
      SystemProgram.transfer({
        fromPubkey: sessionEphemeral.publicKey,
        toPubkey: userPubkey,
        lamports: 100,
      }),
    ],
  }).compileToV0Message();
  const sessionVtx = new VersionedTransaction(sessionMsg);
  sessionVtx.sign([sessionEphemeral]);
  const sessionInitTxs = [Buffer.from(sessionVtx.serialize()).toString('base64')];

  // 5. dispersionInitTxs (if multi-send destinationCount > 1)
  const dispersionInitTxs: string[] = [];
  if (destinationCount > 1) {
    const dispersionEphemeral = Keypair.generate();
    serverEphemeralPubkeys.push(dispersionEphemeral.publicKey.toBase58());
    const dispMsg = new TransactionMessage({
      payerKey: userPubkey,
      recentBlockhash: dummyBlockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: userPubkey,
          toPubkey: dispersionEphemeral.publicKey,
          lamports: 2_039_280 * destinationCount,
        }),
        SystemProgram.transfer({
          fromPubkey: dispersionEphemeral.publicKey,
          toPubkey: userPubkey,
          lamports: 100,
        }),
      ],
    }).compileToV0Message();
    const dispVtx = new VersionedTransaction(dispMsg);
    dispVtx.sign([dispersionEphemeral]);
    dispersionInitTxs.push(Buffer.from(dispVtx.serialize()).toString('base64'));
  }

  return {
    transferId,
    keeperFundingTx,
    routeInitTxs,
    orchestratorInitTx,
    sessionInitTxs,
    dispersionInitTxs,
    serverEphemeralPubkeys,
  };
}

export const INITIAL_HOP_LIBRARY: HopLibraryItem[] = [
  {
    id: 'hop_cex_01',
    address: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9',
    label: 'Binance Hot Liquidity Relay #4',
    category: 'cex',
    canEndRoute: true,
    historicalTxCount: 148920,
    trmRiskScore: 'CLEAN',
    tags: ['High-Throughput', 'Tier-1 CEX', 'Multi-Send Compatible'],
  },
  {
    id: 'hop_cex_02',
    address: 'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS',
    label: 'Coinbase Prime Omnibus Node #12',
    category: 'cex',
    canEndRoute: true,
    historicalTxCount: 94310,
    trmRiskScore: 'CLEAN',
    tags: ['Institutional', 'US-Compliant', 'Multi-Send Compatible'],
  },
  {
    id: 'hop_dex_01',
    address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    label: 'Raydium CLMM Deep Liquidity Vault',
    category: 'dex',
    canEndRoute: true,
    historicalTxCount: 312400,
    trmRiskScore: 'CLEAN',
    tags: ['CLMM Pool', 'Zero-Slippage Relay', 'Multi-Send Compatible'],
  },
  {
    id: 'hop_dex_02',
    address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    label: 'Jupiter v6 Aggregator Settlement Node',
    category: 'dex',
    canEndRoute: true,
    historicalTxCount: 529100,
    trmRiskScore: 'CLEAN',
    tags: ['DEX Router', 'High Anonymity Set'],
  },
  {
    id: 'hop_exch_01',
    address: '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S',
    label: 'Kraken Institutional Custody Relay',
    category: 'exchanges',
    canEndRoute: true,
    historicalTxCount: 78500,
    trmRiskScore: 'CLEAN',
    tags: ['European Desk', 'Proof-of-Reserve'],
  },
  {
    id: 'hop_kol_01',
    address: 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm',
    label: 'High-Volume Ecosystem Market Maker #7',
    category: 'kol',
    canEndRoute: true,
    historicalTxCount: 41200,
    trmRiskScore: 'LOW',
    tags: ['Organic Profile', 'Launch Unbundling'],
  },
  {
    id: 'hop_mix_01',
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    label: 'MultiHopper Entropy Pool Alpha',
    category: 'mix',
    canEndRoute: true,
    historicalTxCount: 184300,
    trmRiskScore: 'CLEAN',
    tags: ['Decoy Dispersion', 'Token2022 Ready'],
  },
  {
    id: 'hop_contracts_01',
    address: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    label: 'Orca Whirlpool Program Vault Relay',
    category: 'contracts',
    canEndRoute: false, // Cannot end route in Multi-Send!
    historicalTxCount: 267800,
    trmRiskScore: 'CLEAN',
    tags: ['Program Vault', 'Intermediate Hop Only'],
  },
];

export const INITIAL_ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'tpl_inst_payroll_4hop',
    name: 'Institutional CEX-DEX-Mix Payroll Shield (4 Hops)',
    description: 'Optimal 4-hop dispersion path for multi-contributor USDC/USDT payrolls with 30s cadence.',
    hopCount: 4,
    totalWaitSeconds: 110,
    createdAt: '2025-02-20T09:00:00Z',
    compatibleWithMultiSend: true,
    hops: [
      { id: 'h1', type: 'bundle', bundle: 'cex', waitSeconds: 25, label: 'Tier-1 CEX Relay' },
      { id: 'h2', type: 'bundle', bundle: 'dex', waitSeconds: 30, label: 'Raydium CLMM Relay' },
      { id: 'h3', type: 'bundle', bundle: 'mix', waitSeconds: 35, label: 'Entropy Mix Node' },
      { id: 'h4', type: 'bundle', bundle: 'exchanges', waitSeconds: 20, label: 'Decoy Exit Exchange' },
    ],
  },
  {
    id: 'tpl_launch_unbundle_6hop',
    name: 'Token Launch Unbundling & KOL Temporal Split (6 Hops)',
    description: 'Prevents bubble-map clustering for token allocations across up to 20 distribution wallets.',
    hopCount: 6,
    totalWaitSeconds: 240,
    createdAt: '2025-02-22T14:30:00Z',
    compatibleWithMultiSend: true,
    hops: [
      { id: 'h1', type: 'bundle', bundle: 'dex', waitSeconds: 30, label: 'DEX Entry Node' },
      { id: 'h2', type: 'bundle', bundle: 'contracts', waitSeconds: 45, label: 'Program Vault Hop' },
      { id: 'h3', type: 'bundle', bundle: 'cex', waitSeconds: 40, label: 'CEX Omnibus Relay' },
      { id: 'h4', type: 'bundle', bundle: 'kol', waitSeconds: 50, label: 'Organic MM Relay' },
      { id: 'h5', type: 'bundle', bundle: 'mix', waitSeconds: 45, label: 'Entropy Dispersion' },
      { id: 'h6', type: 'bundle', bundle: 'dex', waitSeconds: 30, label: 'Decoy Final Exit' },
    ],
  },
];

export const INITIAL_TRANSFERS: TransferRecord[] = [
  {
    id: 'tr_mh_99481a7c2e',
    supportBundleId: 'sb_88219f0a4b',
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    sourceWallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenSymbol: 'USDC',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountUi: 42500,
    amountRaw: '42500000000',
    usdValue: 42500,
    mode: 'multi',
    destinations: [
      {
        id: 'd1',
        recipientWallet: '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E',
        amountUi: '12500',
        amountRaw: '12500000000',
        label: 'Core Protocol Rust Lead',
        status: 'pending',
      },
      {
        id: 'd2',
        recipientWallet: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        amountUi: '10000',
        amountRaw: '10000000000',
        label: 'ZK Circuit Auditor',
        status: 'pending',
      },
      {
        id: 'd3',
        recipientWallet: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
        amountUi: '8500',
        amountRaw: '8500000000',
        label: 'APAC Growth & BD Desk',
        status: 'pending',
      },
      {
        id: 'd4',
        recipientWallet: '6ZRCB7AAqGre6c72PRz3mhLC73VMYvJ8bi9KHf1HFpNk',
        amountUi: '6500',
        amountRaw: '6500000000',
        label: 'Frontend & SDK Architect',
        status: 'pending',
      },
      {
        id: 'd5',
        recipientWallet: '8pFhUq2zB6xJw3mN5vR7tY9kL1qW4eR6tY8uI0oP2aS4',
        amountUi: '5000',
        amountRaw: '5000000000',
        label: 'DevOps & RPC Validator Infra',
        status: 'pending',
      },
    ],
    phase: 'executing',
    routingMode: 'template',
    routeTemplateId: 'tpl_inst_payroll_4hop',
    currentHopIndex: 2,
    wrapperVaultMint: 'Wrap22Mint8x9LpQ4vR7tY2kM5nB3cV1zX9wE4rT6yU',
    integratorRewardsWallet: 'HopFlowRev9x4K2mN8pQ1wE5rT7yU3iO0pA2sD4fG6hJ',
    hops: [
      {
        index: 0,
        walletAddress: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9',
        label: 'Binance Hot Liquidity Relay #4',
        bundle: 'cex',
        waitSeconds: 25,
        status: 'completed',
        txSignature: '5xK9mP2vQ8wL4nR7tY1uI3oP5aS7dF9gH2jK4lZ6xC8vB1nM3qW5eR7tY9uI',
        trmScreened: true,
      },
      {
        index: 1,
        walletAddress: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        label: 'Raydium CLMM Deep Liquidity Vault',
        bundle: 'dex',
        waitSeconds: 30,
        status: 'completed',
        txSignature: '4vJ8nQ1wR7xK3mP6tY9uI2oP4aS6dF8gH1jK3lZ5xC7vB9nM2qW4eR6tY8uI',
        trmScreened: true,
      },
      {
        index: 2,
        walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        label: 'MultiHopper Entropy Pool Alpha',
        bundle: 'mix',
        waitSeconds: 35,
        status: 'in_progress',
        trmScreened: true,
      },
      {
        index: 3,
        walletAddress: '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S',
        label: 'Kraken Decoy Final Exit Node',
        bundle: 'exchanges',
        waitSeconds: 20,
        status: 'pending',
        trmScreened: true,
        isDecoyExit: true,
      },
    ],
    feeBreakdown: calculateLocalFeeEstimate(42500, 4, 5),
    recovery: {
      canRescue: false,
      canReclaimRent: true,
      refundableLamports: 16_800_000,
    },
    signatures: {
      keeperFundingSig: '3kL9mP2vQ8wL4nR7tY1uI3oP5aS7dF9gH2jK4lZ6xC8vB1nM3qW5eR7tY9uI',
      routeInitSigs: ['2jK8nQ1wR7xK3mP6tY9uI2oP4aS6dF8gH1jK3lZ5xC7vB9nM2qW4eR6tY8uI'],
      orchestratorInitSig: '5mN7pQ9wR2xK4mP6tY8uI1oP3aS5dF7gH9jK2lZ4xC6vB8nM1qW3eR5tY7uI',
      sessionInitSigs: ['4hG6jK8lZ1xC3vB5nM7qW9eR2tY4uI6oP8aS1dF3gH5jK7lZ9xC2vB4nM6qW'],
      dispersionInitSigs: ['6pQ8wR1xK3mP5tY7uI9oP2aS4dF6gH8jK1lZ3xC5vB7nM9qW2eR4tY6uI8oP'],
    },
  },
  {
    id: 'tr_mh_77310c4b9d',
    supportBundleId: 'sb_66104e8d2c',
    createdAt: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    sourceWallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenSymbol: 'SOL',
    tokenMint: 'So11111111111111111111111111111111111111112',
    amountUi: 180,
    amountRaw: '180000000000',
    usdValue: 33300,
    mode: 'single',
    recipientWallet: 'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS',
    destinations: [
      {
        id: 'd_single_1',
        recipientWallet: 'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS',
        amountUi: '180',
        amountRaw: '180000000000',
        label: 'Treasury Cold Vault #2',
        status: 'settled',
        txSignature: '4zX9cV2bN5mQ8wE1rT4yU7iO0pA3sD6fG9hJ2kL5zX8cV1bN4mQ7wE0rT3yU',
      },
    ],
    phase: 'settled',
    routingMode: 'random',
    currentHopIndex: 3,
    wrapperVaultMint: 'Wrap22Mint3k7LpQ9vR2tY5kM8nB1cV4zX7wE0rT3yU',
    integratorRewardsWallet: 'HopFlowRev9x4K2mN8pQ1wE5rT7yU3iO0pA2sD4fG6hJ',
    hops: [
      {
        index: 0,
        walletAddress: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        label: 'Raydium CLMM Deep Liquidity Vault',
        bundle: 'dex',
        waitSeconds: 20,
        status: 'completed',
        txSignature: '2aS5dF8gH1jK4lZ7xC0vB3nM6qW9eR2tY5uI8oP1aS4dF7gH0jK3lZ6xC9vB',
        trmScreened: true,
      },
      {
        index: 1,
        walletAddress: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9',
        label: 'Binance Hot Liquidity Relay #4',
        bundle: 'cex',
        waitSeconds: 25,
        status: 'completed',
        txSignature: '3bN6mQ9wE2rT5yU8iO1pA4sD7fG0hJ3kL6zX9cV2bN5mQ8wE1rT4yU7iO0pA',
        trmScreened: true,
      },
      {
        index: 2,
        walletAddress: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        label: 'Jupiter v6 Aggregator Settlement Node',
        bundle: 'dex',
        waitSeconds: 20,
        status: 'completed',
        txSignature: '4cV7bN0mQ3wE6rT9yU2iO5pA8sD1fG4hJ7kL0zX3cV6bN9mQ2wE5rT8yU1iO',
        trmScreened: true,
      },
    ],
    feeBreakdown: calculateLocalFeeEstimate(33300, 3, 1),
    recovery: {
      canRescue: false,
      canReclaimRent: true,
      refundableLamports: 13_650_000,
    },
    signatures: {
      keeperFundingSig: '5dF8gH1jK4lZ7xC0vB3nM6qW9eR2tY5uI8oP1aS4dF7gH0jK3lZ6xC9vB2nM',
      routeInitSigs: ['6eR9tY2uI5oP8aS1dF4gH7jK0lZ3xC6vB9nM2qW5eR8tY1uI4oP7aS0dF3gH'],
      orchestratorInitSig: '7fG0hJ3kL6zX9cV2bN5mQ8wE1rT4yU7iO0pA3sD6fG9hJ2kL5zX8cV1bN4mQ',
      sessionInitSigs: ['8gH1jK4lZ7xC0vB3nM6qW9eR2tY5uI8oP1aS4dF7gH0jK3lZ6xC9vB2nM5qW'],
    },
  },
  {
    id: 'tr_mh_55129e3a1f',
    supportBundleId: 'sb_44091b7c8e',
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    sourceWallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenSymbol: 'PYUSD',
    tokenMint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
    amountUi: 18500,
    amountRaw: '18500000000',
    usdValue: 18500,
    mode: 'single',
    recipientWallet: 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm',
    destinations: [
      {
        id: 'd_rescue_1',
        recipientWallet: 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm',
        amountUi: '18500',
        amountRaw: '18500000000',
        label: 'AI Compute Cluster Settlement',
        status: 'pending',
      },
    ],
    phase: 'failed',
    routingMode: 'custom',
    currentHopIndex: 1,
    wrapperVaultMint: 'Wrap22Mint9m4LpQ2vR8tY1kM6nB4cV7zX2wE5rT9yU',
    integratorRewardsWallet: 'HopFlowRev9x4K2mN8pQ1wE5rT7yU3iO0pA2sD4fG6hJ',
    hops: [
      {
        index: 0,
        walletAddress: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9',
        label: 'Binance Hot Liquidity Relay #4',
        bundle: 'cex',
        waitSeconds: 25,
        status: 'completed',
        txSignature: '9hJ2kL5zX8cV1bN4mQ7wE0rT3yU6iO9pA2sD5fG8hJ1kL4zX7cV0bN3mQ6wE',
        trmScreened: true,
      },
      {
        index: 1,
        walletAddress: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        label: 'Orca Whirlpool Program Vault Relay',
        bundle: 'contracts',
        waitSeconds: 40,
        status: 'failed',
        trmScreened: true,
      },
    ],
    feeBreakdown: calculateLocalFeeEstimate(18500, 2, 1),
    recovery: {
      canRescue: true,
      canReclaimRent: true,
      stuckPrincipalAmountUi: 18500,
      refundableLamports: 10_500_000,
    },
    signatures: {
      keeperFundingSig: '1jK4lZ7xC0vB3nM6qW9eR2tY5uI8oP1aS4dF7gH0jK3lZ6xC9vB2nM5qW8eR',
    },
  },
];

export const ALL_WEBHOOK_EVENT_TYPES = [
  'transfer.quote_created',
  'transfer.funding_detected',
  'transfer.deploying_route',
  'transfer.executing',
  'hop.completed',
  'hop.failed',
  'dispersion.started',
  'dispersion.destination_settled',
  'transfer.settled',
  'transfer.failed',
  'transfer.rescued',
  'transfer.rent_reclaimed',
  'payout.completed',
];

import { VersionedTransaction, Transaction, Keypair, PublicKey } from '@solana/web3.js';

// ============================================================================
// 1. PROGRAM IDS & PROTOCOL CONSTANTS
// ============================================================================

export const MULTIHOPPER_CORE_PROGRAM_ID = '3jLoS2wbNgtKzieUUxwg6Xhdv6gbZkHDtPWA9ZAgspFh';
export const MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID = '4TPCmR2uN3hDM1FbTsf7ZtFXwXGSz4u1Kxv5YHj6eruX';
export const MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID = '2JEv3pD6nczEvn1xDXaEzehkJofPPjoQQpnW5nGY3r52';

export const MULTIHOPPER_MAINNET_BASE_URL = 'https://multihopper.com/api/v1';
export const MULTIHOPPER_DEVNET_BASE_URL = 'https://devnet.multihopper.com/api/v1';

export const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';
export const SOL_RENT_EXEMPT_MINIMUM_LAMPORTS = 890_880;
export const ATA_RENT_LAMPORTS_PER_HOP = 2_039_280;
export const ROUTE_INIT_RENT_LAMPORTS = 2_450_000;
export const ORCHESTRATOR_RENT_LAMPORTS = 1_850_000;
export const DISPERSION_RENT_LAMPORTS_PER_DEST = 1_120_000;
export const TRM_SCREENING_FEE_LAMPORTS = 2_000_000; // 0.002 SOL per wallet screen
export const TRM_RESCREEN_THRESHOLD_SECONDS = 21_600; // 6 hours
export const PROTOCOL_PERCENT_FEE_BPS = 50; // 0.50% total
export const INTEGRATOR_REVENUE_SHARE_BPS = 25; // 0.25% (50% of protocol percentage fee)

// ============================================================================
// 2. SUPPORTED TOKENS (SOL, SPL, Token-2022)
// ============================================================================

export interface SupportedToken {
  symbol: string;
  name: string;
  mintAddress: string;
  decimals: number;
  program: 'native' | 'spl-token' | 'token-2022';
  defaultPriceUsd: number;
  logoColor: string;
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: 'SOL',
    name: 'Native Solana',
    mintAddress: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    program: 'native',
    defaultPriceUsd: 185.0,
    logoColor: '#9945FF',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    program: 'spl-token',
    defaultPriceUsd: 1.0,
    logoColor: '#2775CA',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    program: 'spl-token',
    defaultPriceUsd: 1.0,
    logoColor: '#26A17B',
  },
  {
    symbol: 'PYUSD',
    name: 'PayPal USD (Token-2022)',
    mintAddress: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
    decimals: 6,
    program: 'token-2022',
    defaultPriceUsd: 1.0,
    logoColor: '#003087',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    mintAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    program: 'spl-token',
    defaultPriceUsd: 1.12,
    logoColor: '#14F195',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    program: 'spl-token',
    defaultPriceUsd: 0.000028,
    logoColor: '#F5A623',
  },
];

// ============================================================================
// 3. 10-TIER RAYDIUM CLMM PRICING SCHEDULE
// ============================================================================

export interface PricingTier {
  tier: number;
  label: string;
  minUsdExclusive: number;
  maxUsdInclusive: number | null; // null for Tier 9 (> $500)
  flatFeeLamportsPerHop: number;
  flatFeeSolPerHop: number;
}

export const PRICING_TIERS: PricingTier[] = [
  { tier: 0, label: 'Tier 0 (<= $50.00)', minUsdExclusive: 0, maxUsdInclusive: 50.0, flatFeeLamportsPerHop: 0, flatFeeSolPerHop: 0 },
  { tier: 1, label: 'Tier 1 ($50.00 - $106.25)', minUsdExclusive: 50.0, maxUsdInclusive: 106.25, flatFeeLamportsPerHop: 125_000, flatFeeSolPerHop: 0.000125 },
  { tier: 2, label: 'Tier 2 ($106.25 - $162.50)', minUsdExclusive: 106.25, maxUsdInclusive: 162.5, flatFeeLamportsPerHop: 375_000, flatFeeSolPerHop: 0.000375 },
  { tier: 3, label: 'Tier 3 ($162.50 - $218.75)', minUsdExclusive: 162.5, maxUsdInclusive: 218.75, flatFeeLamportsPerHop: 625_000, flatFeeSolPerHop: 0.000625 },
  { tier: 4, label: 'Tier 4 ($218.75 - $275.00)', minUsdExclusive: 218.75, maxUsdInclusive: 275.0, flatFeeLamportsPerHop: 875_000, flatFeeSolPerHop: 0.000875 },
  { tier: 5, label: 'Tier 5 ($275.00 - $331.25)', minUsdExclusive: 275.0, maxUsdInclusive: 331.25, flatFeeLamportsPerHop: 1_125_000, flatFeeSolPerHop: 0.001125 },
  { tier: 6, label: 'Tier 6 ($331.25 - $387.50)', minUsdExclusive: 331.25, maxUsdInclusive: 387.5, flatFeeLamportsPerHop: 1_375_000, flatFeeSolPerHop: 0.001375 },
  { tier: 7, label: 'Tier 7 ($387.50 - $443.75)', minUsdExclusive: 387.5, maxUsdInclusive: 443.75, flatFeeLamportsPerHop: 1_625_000, flatFeeSolPerHop: 0.001625 },
  { tier: 8, label: 'Tier 8 ($443.75 - $500.00)', minUsdExclusive: 443.75, maxUsdInclusive: 500.0, flatFeeLamportsPerHop: 1_875_000, flatFeeSolPerHop: 0.001875 },
  { tier: 9, label: 'Tier 9 (> $500.00)', minUsdExclusive: 500.0, maxUsdInclusive: null, flatFeeLamportsPerHop: 2_000_000, flatFeeSolPerHop: 0.002 },
];

export function resolvePricingTier(usdValue: number): PricingTier {
  if (usdValue <= 50) return PRICING_TIERS[0];
  for (let i = 1; i < PRICING_TIERS.length; i++) {
    const t = PRICING_TIERS[i];
    if (t.maxUsdInclusive !== null && usdValue <= t.maxUsdInclusive) {
      return t;
    }
  }
  return PRICING_TIERS[9];
}

// ============================================================================
// 4. OPENAPI 3.1.0 SCHEMAS & INTERFACES
// ============================================================================

export type HopBundle = 'cex' | 'dex' | 'exchanges' | 'kol' | 'contracts' | 'mix';

export type TransferStatus =
  | 'QUOTE_CREATED'
  | 'AWAITING_DEPOSIT'
  | 'DEPOSIT_CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type WebhookEventType =
  | 'transfer.quote_created'
  | 'transfer.awaiting_deposit'
  | 'transfer.deposit_confirmed'
  | 'transfer.processing'
  | 'transfer.hop_complete'
  | 'transfer.completed'
  | 'transfer.failed'
  | 'transfer.cancelled'
  | 'transfer.expired'
  | 'transfer.refunded'
  | 'payout.processing'
  | 'payout.completed'
  | 'payout.failed';

export interface CustomHop {
  index: number;
  wallet: string;
  waitSeconds: number;
}

export interface CustomRoute {
  hops: CustomHop[];
}

export interface DestinationEntry {
  recipientWallet: string;
  amountRaw: string;
  label?: string;
}

export interface QuoteSnapshot {
  hopCount: number;
  arrivalSeconds: number;
  hopAmountRaw: string;
  percentFeeBps: number;
  percentFeeRaw: string;
  integratorPercentShareRaw: string;
  flatFeeLamportsPerHop: string;
  totalFlatFeeLamports: string;
  screeningFeeLamports: string;
  ataRentLamports: string;
  routeInitRentLamports: string;
  orchestratorRentLamports: string;
  dispersionRentLamports: string;
  refundableLamports: string;
  requiredSolUpFrontLamports: string;
  pricingTier: number;
  estimatedUsdValue: number;
  cappedAtTierBoundary: boolean;
}

export interface PreparedTxBundle {
  routePda: string;
  keeperWallet: string;
  keeperFundingTx: string | null;
  routeInitTxs: string[];
  orchestratorInitTx: string;
  sessionInitTxs: string[];
  dispersionInitTxs: string[];
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface DestinationPayoutDetail {
  index: number;
  recipientWallet: string;
  amountRaw: string;
  percentFeeRaw: string;
  netRecipientAmountRaw: string;
  status: string;
  txSignature: string | null;
  completedAt: string | null;
}

export interface TransferHopDetail {
  index: number;
  targetWallet: string;
  waitSeconds: number;
  status: 'PENDING' | 'WAITING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  txSignature: string | null;
  completedAt: string | null;
}

export interface TransferDetail {
  id: string;
  externalId: string | null;
  status: TransferStatus;
  mintAddress: string;
  sourceOwner: string;
  recipientWallet: string | null;
  destinations: DestinationPayoutDetail[] | null;
  amountRaw: string;
  hopCount: number;
  arrivalSeconds: number;
  bundle: HopBundle | null;
  routePda: string | null;
  depositTxSignature: string | null;
  payoutTxSignature: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  quote: QuoteSnapshot;
  hops: TransferHopDetail[];
  canRescue: boolean;
  canReclaimRent: boolean;
  rentReclaimedAt: string | null;
  rescuedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HopLibraryWallet {
  address: string;
  label: string;
  bundle: HopBundle;
  tags: string[];
  canEndRoute: boolean;
}

export interface RouteTemplate {
  id: string;
  name: string;
  hops: CustomHop[];
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  isActive: boolean;
  secret?: string; // Returned only on creation
  createdAt: string;
}

export interface UsageSummary {
  tier: string;
  periodStart: string;
  periodEnd: string;
  transfersCreated: number;
  transfersCompleted: number;
  totalVolumeUsd: number;
  collectedPercentageFeesUsd: number;
  qualifyingChallengeVolumeUsd: number;
  rateLimitPerMinute: number;
}

export interface EstimateTransferRequest {
  sourceOwner?: string;
  recipientWallet?: string;
  destinations?: DestinationEntry[];
  mintAddress: string;
  amountRaw: string;
  hopCount?: number;
  arrivalSeconds?: number;
  bundle?: HopBundle;
  customRoute?: CustomRoute;
  tokenPriceUsd?: number;
  isMainnet?: boolean;
}

export interface CreateTransferRequest extends EstimateTransferRequest {
  sourceOwner: string;
  externalId?: string;
}

export interface ConfirmBroadcastRequest {
  routeInitSignatures: string[];
  orchestratorInitSignature?: string;
  sessionInitSignatures?: string[];
  dispersionInitSignatures?: string[];
  keeperFundingSignature?: string;
}

export interface PrepareRecoveryResponse {
  transferId: string;
  transactions: string[];
  estimatedLamportsRecovered: string;
  blockhash: string;
}

// ============================================================================
// 5. ERROR CODE REGISTRY (MH_001 - MH_091)
// ============================================================================

export interface MultiHopperErrorMetadata {
  code: string;
  httpStatus: number;
  title: string;
  description: string;
  recoveryHint: string;
}

export const MULTIHOPPER_ERROR_CODES: Record<string, MultiHopperErrorMetadata> = {
  MH_001: {
    code: 'MH_001',
    httpStatus: 401,
    title: 'Missing or Invalid API Key',
    description: 'The Authorization Bearer token is missing, malformed, or does not match the target environment prefix (mh_live_ or mh_test_).',
    recoveryHint: 'Verify your API key prefix matches Mainnet (mh_live_) or Devnet (mh_test_).',
  },
  MH_002: {
    code: 'MH_002',
    httpStatus: 403,
    title: 'API Key Revoked or Disabled',
    description: 'This API key has been revoked or deactivated in the MultiHopper developer portal.',
    recoveryHint: 'Generate a new API key from multihopper.com/developers.',
  },
  MH_003: {
    code: 'MH_003',
    httpStatus: 429,
    title: 'Rate Limit Exceeded',
    description: 'Too many requests sent within the current 1-minute sliding window.',
    recoveryHint: 'Respect the Retry-After header and implement exponential backoff.',
  },
  MH_004: {
    code: 'MH_004',
    httpStatus: 400,
    title: 'Missing Idempotency-Key Header',
    description: 'Write operations (POST, PATCH, DELETE) require a unique Idempotency-Key header.',
    recoveryHint: 'Attach a UUID v4 Idempotency-Key header on every mutating request.',
  },
  MH_009: {
    code: 'MH_009',
    httpStatus: 409,
    title: 'Idempotency Key Conflict',
    description: 'The provided Idempotency-Key was already used with a different request payload.',
    recoveryHint: 'Generate a fresh UUID v4 when request parameters change.',
  },
  MH_011: {
    code: 'MH_011',
    httpStatus: 400,
    title: 'Invalid Solana Public Key',
    description: 'One or more wallet or mint addresses failed base58 Ed25519 curve or length validation.',
    recoveryHint: 'Check sourceOwner, recipientWallet, destinations, and mintAddress for valid base58 encoding.',
  },
  MH_014: {
    code: 'MH_014',
    httpStatus: 400,
    title: 'Invalid Hop Count or Custom Route Length',
    description: 'Single-recipient transfers require 2-9 hops; multi-destination transfers require 3-10 hops.',
    recoveryHint: 'Adjust hopCount or customRoute.hops length to match the destination mode.',
  },
  MH_015: {
    code: 'MH_015',
    httpStatus: 400,
    title: 'Invalid Hop Wait Duration',
    description: 'Each hop waitSeconds must be between 20 and 2,592,000 seconds, with total arrival <= 30 days.',
    recoveryHint: 'Set waitSeconds >= 20 and ensure total sum does not exceed 2,592,000 seconds.',
  },
  MH_016: {
    code: 'MH_016',
    httpStatus: 400,
    title: 'Destination Sum Mismatch',
    description: 'The sum of destinations[].amountRaw does not exactly equal the top-level amountRaw.',
    recoveryHint: 'Ensure BigInt sum of all destination amounts matches amountRaw exactly.',
  },
  MH_017: {
    code: 'MH_017',
    httpStatus: 400,
    title: 'Forbidden or Duplicate Hop Wallet',
    description: 'Custom route contains sourceOwner, recipientWallet, destination wallets, system program IDs, or duplicate hop wallets.',
    recoveryHint: 'Select distinct intermediate wallets from the vetted Hop Library.',
  },
  MH_018: {
    code: 'MH_018',
    httpStatus: 400,
    title: 'Invalid Final Hop for Multi-Destination Route',
    description: 'The final decoy hop in a multi-destination transfer cannot be a contracts bundle or non-ATA PDA.',
    recoveryHint: 'Choose a final hop wallet with canEndRoute: true (cex, dex, exchanges, kol, or mix).',
  },
  MH_019: {
    code: 'MH_019',
    httpStatus: 400,
    title: 'Hop Library Unavailable on Devnet',
    description: 'GET /hop-library is only populated on Mainnet where real CEX/DEX/KOL wallets exist.',
    recoveryHint: 'Use Mainnet for Hop Library discovery or supply valid devnet wallet addresses in customRoute.',
  },
  MH_021: {
    code: 'MH_021',
    httpStatus: 400,
    title: 'Native SOL Post-Fee Below Rent Exemption',
    description: 'A destination receiving native SOL would receive less than 890,880 lamports after the 0.50% fee.',
    recoveryHint: 'Increase the SOL allocation for each destination above 895,357 lamports.',
  },
  MH_031: {
    code: 'MH_031',
    httpStatus: 403,
    title: 'TRM Labs Sanctions / Compliance Block',
    description: 'Source or recipient wallet flagged by TRM Labs real-time on-chain risk screening.',
    recoveryHint: 'Transfer cannot proceed with sanctioned or high-risk counterfactual addresses.',
  },
  MH_042: {
    code: 'MH_042',
    httpStatus: 409,
    title: 'Keeper Funding Transaction Required First',
    description: 'confirm-broadcast was called with routeInitSignatures before keeperFundingSignature was confirmed.',
    recoveryHint: 'Broadcast keeperFundingTx and call confirm-broadcast with routeInitSignatures: [] first.',
  },
  MH_055: {
    code: 'MH_055',
    httpStatus: 422,
    title: 'On-Chain Transaction Verification Failed',
    description: 'One or more submitted signatures failed on-chain confirmation or order validation.',
    recoveryHint: 'Ensure 3-second propagation delay between routeInitTxs, orchestratorInitTx, and sessionInitTxs.',
  },
  MH_071: {
    code: 'MH_071',
    httpStatus: 409,
    title: 'Rescue Not Available for Current State',
    description: 'Transfer is not in a stuck or recoverable state (canRescue is false).',
    recoveryHint: 'Check transfer.canRescue before invoking /rescue/prepare.',
  },
  MH_081: {
    code: 'MH_081',
    httpStatus: 409,
    title: 'Rent Already Reclaimed or Not Eligible',
    description: 'Step and route PDA rent can only be reclaimed once after COMPLETED, FAILED, or CANCELLED.',
    recoveryHint: 'Verify transfer.canReclaimRent is true and rentReclaimedAt is null.',
  },
  MH_091: {
    code: 'MH_091',
    httpStatus: 503,
    title: 'Solana RPC or Relayer Degraded',
    description: 'Upstream Solana RPC cluster or MultiHopper relayer experienced transient congestion.',
    recoveryHint: 'Retry request with the same Idempotency-Key.',
  },
};

export class MultiHopperApiError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly recoveryHint: string;

  constructor(code: string, customMessage?: string) {
    const meta = MULTIHOPPER_ERROR_CODES[code] ?? {
      code,
      httpStatus: 400,
      title: 'MultiHopper Protocol Error',
      description: customMessage ?? 'Unknown protocol error',
      recoveryHint: 'Consult MultiHopper API v1 documentation.',
    };
    super(customMessage ? `${meta.code}: ${customMessage}` : `${meta.code} (${meta.title}): ${meta.description}`);
    this.name = 'MultiHopperApiError';
    this.code = meta.code;
    this.httpStatus = meta.httpStatus;
    this.recoveryHint = meta.recoveryHint;
  }
}

// ============================================================================
// 6. DETERMINISTIC QUOTE & 10-TIER RAYDIUM CLMM FEE CALCULATOR
// ============================================================================

export function calculateMultiHopperQuote(params: EstimateTransferRequest): QuoteSnapshot {
  const token = SUPPORTED_TOKENS.find((t) => t.mintAddress === params.mintAddress);
  const decimals = token?.decimals ?? 6;
  const priceUsd = params.tokenPriceUsd ?? token?.defaultPriceUsd ?? 1.0;
  const isMainnet = params.isMainnet ?? true;

  const amountBig = BigInt(params.amountRaw);
  if (amountBig <= 0n) {
    throw new MultiHopperApiError('MH_016', 'amountRaw must be a positive integer string');
  }

  const isMultiDest = Array.isArray(params.destinations) && params.destinations.length > 0;
  const defaultHopCount = isMultiDest ? 4 : 3;
  const hopCount = params.customRoute ? params.customRoute.hops.length : (params.hopCount ?? defaultHopCount);

  const arrivalSeconds = params.customRoute
    ? params.customRoute.hops.reduce((acc, h) => acc + h.waitSeconds, 0)
    : (params.arrivalSeconds ?? hopCount * 60);

  // Calculate USD value via Raydium CLMM equivalent price
  const tokenUnits = Number(amountBig) / Math.pow(10, decimals);
  const estimatedUsdValue = Number((tokenUnits * priceUsd).toFixed(2));
  const tierInfo = resolvePricingTier(estimatedUsdValue);

  // Detect if within 2% below a tier boundary (e.g., $49.50-$50.00)
  const cappedAtTierBoundary =
    tierInfo.maxUsdInclusive !== null &&
    estimatedUsdValue >= tierInfo.maxUsdInclusive * 0.98 &&
    estimatedUsdValue <= tierInfo.maxUsdInclusive;

  // 0.50% percentage fee (50 bps), of which 0.25% (25 bps) goes to the integrator
  const percentFeeBps = PROTOCOL_PERCENT_FEE_BPS;
  const percentFeeBig = (amountBig * BigInt(percentFeeBps)) / 10_000n;
  const integratorShareBig = percentFeeBig / 2n; // 50% of 0.50% = 0.25%
  const hopAmountBig = amountBig - percentFeeBig;

  // Flat fee per hop from 10-tier schedule
  const flatFeePerHopBig = BigInt(tierInfo.flatFeeLamportsPerHop);
  const totalFlatFeeBig = flatFeePerHopBig * BigInt(hopCount);

  // TRM Labs wallet compliance screening fee (Mainnet only: 0.002 SOL per wallet screened)
  // Source wallet + each destination/recipient wallet. If arrivalSeconds > 21,600s (6h), destinations are re-screened prior to payout.
  const destCount = isMultiDest ? params.destinations!.length : 1;
  const rescreenMultiplier = arrivalSeconds > TRM_RESCREEN_THRESHOLD_SECONDS ? 2 : 1;
  const walletsScreened = isMainnet ? 1 + destCount * rescreenMultiplier : 0;
  const screeningFeeBig = BigInt(walletsScreened * TRM_SCREENING_FEE_LAMPORTS);

  // Temporary Rent advances (reclaimable / refundable via /reclaim-rent)
  const isNativeSol = params.mintAddress === SOL_MINT_ADDRESS;
  const ataRentBig = isNativeSol ? 0n : BigInt(hopCount * ATA_RENT_LAMPORTS_PER_HOP);
  const routeInitRentBig = BigInt(ROUTE_INIT_RENT_LAMPORTS);
  const orchestratorRentBig = BigInt(ORCHESTRATOR_RENT_LAMPORTS);
  const dispersionRentBig = isMultiDest ? BigInt(destCount * DISPERSION_RENT_LAMPORTS_PER_DEST) : 0n;

  const refundableBig = ataRentBig + routeInitRentBig + orchestratorRentBig + dispersionRentBig;
  const requiredSolUpFrontBig = totalFlatFeeBig + screeningFeeBig + refundableBig + (isNativeSol ? amountBig : 0n);

  return {
    hopCount,
    arrivalSeconds,
    hopAmountRaw: hopAmountBig.toString(),
    percentFeeBps,
    percentFeeRaw: percentFeeBig.toString(),
    integratorPercentShareRaw: integratorShareBig.toString(),
    flatFeeLamportsPerHop: flatFeePerHopBig.toString(),
    totalFlatFeeLamports: totalFlatFeeBig.toString(),
    screeningFeeLamports: screeningFeeBig.toString(),
    ataRentLamports: ataRentBig.toString(),
    routeInitRentLamports: routeInitRentBig.toString(),
    orchestratorRentLamports: orchestratorRentBig.toString(),
    dispersionRentLamports: dispersionRentBig.toString(),
    refundableLamports: refundableBig.toString(),
    requiredSolUpFrontLamports: requiredSolUpFrontBig.toString(),
    pricingTier: tierInfo.tier,
    estimatedUsdValue,
    cappedAtTierBoundary,
  };
}

// ============================================================================
// 7. PROTOCOL VALIDATION HELPERS
// ============================================================================

const FORBIDDEN_SYSTEM_ADDRESSES = new Set([
  MULTIHOPPER_CORE_PROGRAM_ID,
  MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID,
  MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID,
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
]);

export function isValidSolanaAddress(address: string): boolean {
  try {
    const pk = new PublicKey(address);
    return pk.toBase58() === address;
  } catch {
    return false;
  }
}

export function validateCustomRoute(
  route: CustomRoute,
  mode: 'single' | 'destinations',
  sourceOwner: string,
  recipientOrDestinations: string | DestinationEntry[],
  hopLibrary?: HopLibraryWallet[]
): { valid: boolean; totalWaitSeconds: number } {
  const hops = route.hops;
  const minHops = mode === 'destinations' ? 3 : 2;
  const maxHops = mode === 'destinations' ? 10 : 9;

  if (!Array.isArray(hops) || hops.length < minHops || hops.length > maxHops) {
    throw new MultiHopperApiError(
      'MH_014',
      `Mode "${mode}" requires between ${minHops} and ${maxHops} hops (received ${hops?.length ?? 0}).`
    );
  }

  const forbidden = new Set<string>(FORBIDDEN_SYSTEM_ADDRESSES);
  if (sourceOwner) forbidden.add(sourceOwner);
  if (typeof recipientOrDestinations === 'string') {
    forbidden.add(recipientOrDestinations);
  } else if (Array.isArray(recipientOrDestinations)) {
    recipientOrDestinations.forEach((d) => forbidden.add(d.recipientWallet));
  }

  const seenHops = new Set<string>();
  let totalWaitSeconds = 0;

  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    if (hop.index !== i) {
      throw new MultiHopperApiError('MH_014', `Hop index mismatch at position ${i}: expected ${i}, got ${hop.index}`);
    }
    if (!isValidSolanaAddress(hop.wallet)) {
      throw new MultiHopperApiError('MH_011', `Invalid Solana public key at hop ${i}: ${hop.wallet}`);
    }
    if (forbidden.has(hop.wallet) || seenHops.has(hop.wallet)) {
      throw new MultiHopperApiError(
        'MH_017',
        `Hop ${i} wallet (${hop.wallet}) is forbidden or duplicated in this route.`
      );
    }
    if (hop.waitSeconds < 20 || hop.waitSeconds > 2_592_000) {
      throw new MultiHopperApiError(
        'MH_015',
        `Hop ${i} waitSeconds (${hop.waitSeconds}) must be between 20 and 2,592,000 seconds.`
      );
    }
    seenHops.add(hop.wallet);
    totalWaitSeconds += hop.waitSeconds;
  }

  if (totalWaitSeconds > 2_592_000) {
    throw new MultiHopperApiError(
      'MH_015',
      `Total route arrival time (${totalWaitSeconds}s) exceeds maximum 30 days (2,592,000s).`
    );
  }

  if (mode === 'destinations' && hopLibrary && hopLibrary.length > 0) {
    const finalHopWallet = hops[hops.length - 1].wallet;
    const libraryEntry = hopLibrary.find((w) => w.address === finalHopWallet);
    if (libraryEntry && (!libraryEntry.canEndRoute || libraryEntry.bundle === 'contracts')) {
      throw new MultiHopperApiError(
        'MH_018',
        `Final decoy hop (${libraryEntry.label}) belongs to 'contracts' bundle or has canEndRoute=false.`
      );
    }
  }

  return { valid: true, totalWaitSeconds };
}

export function validateMultiSendDestinations(
  amountRaw: string,
  destinations: DestinationEntry[],
  isNativeSol: boolean
): { valid: boolean; totalRaw: string } {
  if (!Array.isArray(destinations) || destinations.length < 1 || destinations.length > 20) {
    throw new MultiHopperApiError('MH_016', 'Multi-destination transfers require between 1 and 20 destinations.');
  }

  const seenWallets = new Set<string>();
  let sumBig = 0n;
  const expectedTotal = BigInt(amountRaw);

  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i];
    if (!isValidSolanaAddress(dest.recipientWallet)) {
      throw new MultiHopperApiError('MH_011', `Invalid destination wallet at index ${i}: ${dest.recipientWallet}`);
    }
    if (seenWallets.has(dest.recipientWallet)) {
      throw new MultiHopperApiError('MH_017', `Duplicate destination wallet detected: ${dest.recipientWallet}`);
    }
    seenWallets.add(dest.recipientWallet);

    const destAmount = BigInt(dest.amountRaw);
    if (destAmount <= 0n) {
      throw new MultiHopperApiError('MH_016', `Destination ${i} amountRaw must be greater than 0.`);
    }

    if (isNativeSol) {
      const feeShare = (destAmount * BigInt(PROTOCOL_PERCENT_FEE_BPS)) / 10_000n;
      const netAmount = destAmount - feeShare;
      if (netAmount < BigInt(SOL_RENT_EXEMPT_MINIMUM_LAMPORTS)) {
        throw new MultiHopperApiError(
          'MH_021',
          `Destination ${i} post-fee SOL (${netAmount.toString()} lamports) is below rent exemption (890,880 lamports).`
        );
      }
    }

    sumBig += destAmount;
  }

  if (sumBig !== expectedTotal) {
    throw new MultiHopperApiError(
      'MH_016',
      `Sum of destination amounts (${sumBig.toString()}) does not equal top-level amountRaw (${expectedTotal.toString()}).`
    );
  }

  return { valid: true, totalRaw: sumBig.toString() };
}

// ============================================================================
// 8. CHALLENGE QUALIFYING VOLUME & PRIZE POOL CALCULATORS
// ============================================================================

export const CHALLENGE_MIN_QUALIFYING_VOLUME_USD = 100_000;
export const CHALLENGE_BASE_PRIZE_POOL_USD = 5_000;
export const CHALLENGE_MAX_PRIZE_POOL_USD = 50_000;
export const CHALLENGE_VOLUME_STEP_USD = 400_000;
export const CHALLENGE_POOL_STEP_INCREMENT_USD = 1_000;

/**
 * Qualifying Volume formula from challenge spec:
 * qualifying_volume = collected_percentage_fees / 0.0025
 */
export function calculateQualifyingVolume(collectedPercentageFeesUsd: number): number {
  if (collectedPercentageFeesUsd <= 0) return 0;
  return Number((collectedPercentageFeesUsd / 0.0025).toFixed(2));
}

export interface PrizePoolCalculationResult {
  aggregateVolumeUsd: number;
  unlockedPrizePoolUsd: number;
  projectVolumeUsd: number;
  qualifiesForMinimum100k: boolean;
  proportionalShareRatio: number;
  estimatedProjectPrizeUsd: number;
  ongoingIntegratorRevenueUsd: number;
  totalEstimatedEarningsUsd: number;
}

export function calculatePrizePoolShare(
  aggregateVolumeUsd: number,
  projectVolumeUsd: number,
  topThreeCombinedVolumeUsd: number
): PrizePoolCalculationResult {
  const stepsUnlocked = Math.floor(Math.max(0, aggregateVolumeUsd) / CHALLENGE_VOLUME_STEP_USD);
  const unlockedPrizePoolUsd = Math.min(
    CHALLENGE_MAX_PRIZE_POOL_USD,
    CHALLENGE_BASE_PRIZE_POOL_USD + stepsUnlocked * CHALLENGE_POOL_STEP_INCREMENT_USD
  );

  const qualifiesForMinimum100k = projectVolumeUsd >= CHALLENGE_MIN_QUALIFYING_VOLUME_USD;
  const effectiveDenominator = Math.max(topThreeCombinedVolumeUsd, projectVolumeUsd, 1);
  const proportionalShareRatio = qualifiesForMinimum100k
    ? Math.min(1, projectVolumeUsd / effectiveDenominator)
    : 0;

  const estimatedProjectPrizeUsd = Number((unlockedPrizePoolUsd * proportionalShareRatio).toFixed(2));
  const ongoingIntegratorRevenueUsd = Number((projectVolumeUsd * 0.0025).toFixed(2));

  return {
    aggregateVolumeUsd,
    unlockedPrizePoolUsd,
    projectVolumeUsd,
    qualifiesForMinimum100k,
    proportionalShareRatio: Number(proportionalShareRatio.toFixed(4)),
    estimatedProjectPrizeUsd,
    ongoingIntegratorRevenueUsd,
    totalEstimatedEarningsUsd: Number((estimatedProjectPrizeUsd + ongoingIntegratorRevenueUsd).toFixed(2)),
  };
}

// ============================================================================
// 9. TWO-PHASE TRANSACTION SIGNING & BROADCAST ORCHESTRATOR
// ============================================================================

export interface BroadcastStepLog {
  phase: 1 | 2;
  txType: 'keeperFundingTx' | 'routeInitTx' | 'orchestratorInitTx' | 'sessionInitTx' | 'dispersionInitTx' | 'confirmBroadcast';
  index?: number;
  signature?: string;
  isVersionedV0: boolean;
  existingSignaturesPreserved: number;
  timestamp: string;
}

export interface SignAndBroadcastCallbackInput {
  base64Tx: string;
  txType: 'keeperFundingTx' | 'routeInitTx' | 'orchestratorInitTx' | 'sessionInitTx' | 'dispersionInitTx';
  index: number;
  isVersionedV0: boolean;
}

/**
 * Helper to partially sign either a VersionedTransaction (v0) or Legacy Transaction
 * with a Solana Keypair while strictly preserving existing ephemeral keypair signatures.
 */
export function signPreparedTransactionWithKeypair(
  base64Tx: string,
  signerKeypair: Keypair
): { signedBase64: string; isVersionedV0: boolean; existingSignaturesPreserved: number } {
  const rawBytes = Buffer.from(base64Tx, 'base64');

  // VersionedTransaction v0 messages have the highest bit set on the first message byte after compact-u16 signatures,
  // or can be reliably parsed via VersionedTransaction.deserialize.
  try {
    const versionedTx = VersionedTransaction.deserialize(rawBytes);
    const existingNonZeroSigs = versionedTx.signatures.filter((s) => s.some((byte) => byte !== 0)).length;

    if (versionedTx.version === 0) {
      // VersionedTransaction.sign([keypair]) appends/populates only the matching signer's slot without wiping other slots
      versionedTx.sign([signerKeypair]);
      return {
        signedBase64: Buffer.from(versionedTx.serialize()).toString('base64'),
        isVersionedV0: true,
        existingSignaturesPreserved: existingNonZeroSigs,
      };
    }
  } catch {
    // Fallback to Legacy Transaction
  }

  const legacyTx = Transaction.from(rawBytes);
  const existingNonZeroSigs = legacyTx.signatures.filter((s) => s.signature !== null).length;
  legacyTx.partialSign(signerKeypair);

  return {
    signedBase64: legacyTx.serialize({ requireAllSignatures: false }).toString('base64'),
    isVersionedV0: false,
    existingSignaturesPreserved: existingNonZeroSigs,
  };
}

/**
 * Executes MultiHopper's mandatory Two-Call Broadcast & Confirm Flow:
 * 1. If keeperFundingTx is present, sign & broadcast it FIRST, then immediately call confirmBroadcast
 *    with { routeInitSignatures: [], keeperFundingSignature }.
 * 2. Sign & broadcast routeInitTxs -> delay -> orchestratorInitTx -> delay -> sessionInitTxs -> dispersionInitTxs.
 * 3. Call confirmBroadcast a second time with all initialization signatures.
 */
export async function executeTwoPhaseBroadcast(options: {
  transferId: string;
  bundle: PreparedTxBundle;
  propagationDelayMs?: number;
  signAndBroadcastTx: (input: SignAndBroadcastCallbackInput) => Promise<{
    signature: string;
    existingSignaturesPreserved: number;
  }>;
  confirmBroadcast: (transferId: string, payload: ConfirmBroadcastRequest) => Promise<TransferDetail>;
  onStep?: (step: BroadcastStepLog) => void;
}): Promise<{
  transfer: TransferDetail;
  steps: BroadcastStepLog[];
  confirmCallsCount: number;
  confirmPayloads: ConfirmBroadcastRequest[];
}> {
  const delayMs = options.propagationDelayMs ?? 3000;
  const steps: BroadcastStepLog[] = [];
  const confirmPayloads: ConfirmBroadcastRequest[] = [];
  const sleep = (ms: number) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

  const recordStep = (step: BroadcastStepLog) => {
    steps.push(step);
    options.onStep?.(step);
  };

  let keeperFundingSignature: string | undefined;

  // PHASE 1: Keeper Funding Transaction (Must be confirmed before PDA init transactions)
  if (options.bundle.keeperFundingTx) {
    const res = await options.signAndBroadcastTx({
      base64Tx: options.bundle.keeperFundingTx,
      txType: 'keeperFundingTx',
      index: 0,
      isVersionedV0: false,
    });
    keeperFundingSignature = res.signature;
    recordStep({
      phase: 1,
      txType: 'keeperFundingTx',
      index: 0,
      signature: res.signature,
      isVersionedV0: false,
      existingSignaturesPreserved: res.existingSignaturesPreserved,
      timestamp: new Date().toISOString(),
    });

    const phase1Payload: ConfirmBroadcastRequest = {
      routeInitSignatures: [],
      keeperFundingSignature,
    };
    confirmPayloads.push(phase1Payload);
    await options.confirmBroadcast(options.transferId, phase1Payload);
    recordStep({
      phase: 1,
      txType: 'confirmBroadcast',
      signature: keeperFundingSignature,
      isVersionedV0: false,
      existingSignaturesPreserved: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // PHASE 2A: Route Init Transactions (VersionedTransaction v0 with ephemeral keypair partial signatures)
  const routeInitSignatures: string[] = [];
  for (let i = 0; i < options.bundle.routeInitTxs.length; i++) {
    const res = await options.signAndBroadcastTx({
      base64Tx: options.bundle.routeInitTxs[i],
      txType: 'routeInitTx',
      index: i,
      isVersionedV0: true,
    });
    routeInitSignatures.push(res.signature);
    recordStep({
      phase: 2,
      txType: 'routeInitTx',
      index: i,
      signature: res.signature,
      isVersionedV0: true,
      existingSignaturesPreserved: res.existingSignaturesPreserved,
      timestamp: new Date().toISOString(),
    });
  }

  await sleep(delayMs);

  // PHASE 2B: Orchestrator Init Transaction (Legacy Transaction)
  const orchRes = await options.signAndBroadcastTx({
    base64Tx: options.bundle.orchestratorInitTx,
    txType: 'orchestratorInitTx',
    index: 0,
    isVersionedV0: false,
  });
  const orchestratorInitSignature = orchRes.signature;
  recordStep({
    phase: 2,
    txType: 'orchestratorInitTx',
    index: 0,
    signature: orchestratorInitSignature,
    isVersionedV0: false,
    existingSignaturesPreserved: orchRes.existingSignaturesPreserved,
    timestamp: new Date().toISOString(),
  });

  await sleep(delayMs);

  // PHASE 2C: Session Init Transactions (VersionedTransaction v0 with ephemeral keypair partial signatures)
  const sessionInitSignatures: string[] = [];
  for (let i = 0; i < options.bundle.sessionInitTxs.length; i++) {
    const res = await options.signAndBroadcastTx({
      base64Tx: options.bundle.sessionInitTxs[i],
      txType: 'sessionInitTx',
      index: i,
      isVersionedV0: true,
    });
    sessionInitSignatures.push(res.signature);
    recordStep({
      phase: 2,
      txType: 'sessionInitTx',
      index: i,
      signature: res.signature,
      isVersionedV0: true,
      existingSignaturesPreserved: res.existingSignaturesPreserved,
      timestamp: new Date().toISOString(),
    });
  }

  // PHASE 2D: Dispersion Init Transactions (Multi-destination commitment PDAs)
  const dispersionInitSignatures: string[] = [];
  for (let i = 0; i < options.bundle.dispersionInitTxs.length; i++) {
    const res = await options.signAndBroadcastTx({
      base64Tx: options.bundle.dispersionInitTxs[i],
      txType: 'dispersionInitTx',
      index: i,
      isVersionedV0: false,
    });
    dispersionInitSignatures.push(res.signature);
    recordStep({
      phase: 2,
      txType: 'dispersionInitTx',
      index: i,
      signature: res.signature,
      isVersionedV0: false,
      existingSignaturesPreserved: res.existingSignaturesPreserved,
      timestamp: new Date().toISOString(),
    });
  }

  // PHASE 2E: Final Confirm-Broadcast Call
  const phase2Payload: ConfirmBroadcastRequest = {
    routeInitSignatures,
    orchestratorInitSignature,
    sessionInitSignatures,
    dispersionInitSignatures: dispersionInitSignatures.length > 0 ? dispersionInitSignatures : undefined,
    keeperFundingSignature,
  };
  confirmPayloads.push(phase2Payload);
  const transfer = await options.confirmBroadcast(options.transferId, phase2Payload);

  recordStep({
    phase: 2,
    txType: 'confirmBroadcast',
    signature: orchestratorInitSignature,
    isVersionedV0: false,
    existingSignaturesPreserved: 0,
    timestamp: new Date().toISOString(),
  });

  return {
    transfer,
    steps,
    confirmCallsCount: confirmPayloads.length,
    confirmPayloads,
  };
}

// ============================================================================
// 10. FULL MULTIHOPPER API v1 CLIENT (ALL 19 ENDPOINTS)
// ============================================================================

export interface MultiHopperClientConfig {
  apiKey: string;
  environment?: 'mainnet' | 'devnet';
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class MultiHopperClient {
  public readonly apiKey: string;
  public readonly environment: 'mainnet' | 'devnet';
  public readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: MultiHopperClientConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment ?? (config.apiKey.startsWith('mh_test_') ? 'devnet' : 'mainnet');
    this.baseUrl =
      config.baseUrl ??
      (this.environment === 'devnet' ? MULTIHOPPER_DEVNET_BASE_URL : MULTIHOPPER_MAINNET_BASE_URL);
    this.fetchFn = config.fetchImpl ?? fetch;

    this.validateKeyForEnvironment();
  }

  private validateKeyForEnvironment(): void {
    if (!this.apiKey) {
      throw new MultiHopperApiError('MH_001', 'API key is required');
    }
    if (this.environment === 'mainnet' && !this.apiKey.startsWith('mh_live_')) {
      throw new MultiHopperApiError('MH_001', 'Mainnet environment requires an mh_live_ API key');
    }
    if (this.environment === 'devnet' && !this.apiKey.startsWith('mh_test_')) {
      throw new MultiHopperApiError('MH_001', 'Devnet environment requires an mh_test_ API key');
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    idempotencyKey?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      headers['Idempotency-Key'] = idempotencyKey ?? generateIdempotencyKey();
    }

    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: { code?: string; message?: string } = {};
      try {
        errorBody = (await response.json()) as { code?: string; message?: string };
      } catch {
        // Ignore parse error
      }
      throw new MultiHopperApiError(
        errorBody.code ?? 'MH_091',
        errorBody.message ?? `HTTP ${response.status} on ${method} ${path}`
      );
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }

  // 1. POST /transfers/estimate
  async estimateTransfer(payload: EstimateTransferRequest, idempotencyKey?: string): Promise<QuoteSnapshot> {
    return this.request<QuoteSnapshot>('POST', '/transfers/estimate', payload, idempotencyKey);
  }

  // 2. POST /transfers
  async createTransfer(payload: CreateTransferRequest, idempotencyKey?: string): Promise<TransferDetail> {
    return this.request<TransferDetail>('POST', '/transfers', payload, idempotencyKey);
  }

  // 3. POST /transfers/{id}/prepare
  async prepareTransfer(id: string, idempotencyKey?: string): Promise<PreparedTxBundle> {
    return this.request<PreparedTxBundle>('POST', `/transfers/${id}/prepare`, {}, idempotencyKey);
  }

  // 4. POST /transfers/{id}/confirm-broadcast
  async confirmBroadcast(
    id: string,
    payload: ConfirmBroadcastRequest,
    idempotencyKey?: string
  ): Promise<TransferDetail> {
    return this.request<TransferDetail>('POST', `/transfers/${id}/confirm-broadcast`, payload, idempotencyKey);
  }

  // 5. GET /transfers/{id}
  async getTransfer(id: string): Promise<TransferDetail> {
    return this.request<TransferDetail>('GET', `/transfers/${id}`);
  }

  // 6. GET /transfers/by-external/{externalId}
  async getTransferByExternalId(externalId: string): Promise<TransferDetail> {
    return this.request<TransferDetail>('GET', `/transfers/by-external/${encodeURIComponent(externalId)}`);
  }

  // 7. GET /transfers
  async listTransfers(params?: {
    status?: TransferStatus;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: TransferDetail[]; nextCursor: string | null }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<{ data: TransferDetail[]; nextCursor: string | null }>('GET', `/transfers${suffix}`);
  }

  // 8. GET /hop-library
  async getHopLibrary(params?: {
    bundle?: HopBundle;
    q?: string;
    limit?: number;
  }): Promise<{ data: HopLibraryWallet[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.bundle) qs.set('bundle', params.bundle);
    if (params?.q) qs.set('q', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<{ data: HopLibraryWallet[]; total: number }>('GET', `/hop-library${suffix}`);
  }

  // 9. GET /route-templates
  async listRouteTemplates(): Promise<{ data: RouteTemplate[] }> {
    return this.request<{ data: RouteTemplate[] }>('GET', '/route-templates');
  }

  // 10. POST /route-templates
  async createRouteTemplate(
    payload: { name: string; hops: CustomHop[] },
    idempotencyKey?: string
  ): Promise<RouteTemplate> {
    return this.request<RouteTemplate>('POST', '/route-templates', payload, idempotencyKey);
  }

  // 11. PATCH /route-templates/{id}
  async updateRouteTemplate(
    id: string,
    payload: { name?: string; hops?: CustomHop[] },
    idempotencyKey?: string
  ): Promise<RouteTemplate> {
    return this.request<RouteTemplate>('PATCH', `/route-templates/${id}`, payload, idempotencyKey);
  }

  // 12. DELETE /route-templates/{id}
  async deleteRouteTemplate(id: string, idempotencyKey?: string): Promise<void> {
    return this.request<void>('DELETE', `/route-templates/${id}`, undefined, idempotencyKey);
  }

  // 13. POST /transfers/{id}/rescue/prepare
  async prepareRescue(id: string, idempotencyKey?: string): Promise<PrepareRecoveryResponse> {
    return this.request<PrepareRecoveryResponse>('POST', `/transfers/${id}/rescue/prepare`, {}, idempotencyKey);
  }

  // 14. POST /transfers/{id}/rescue/confirm
  async confirmRescue(
    id: string,
    payload: { signatures: string[] },
    idempotencyKey?: string
  ): Promise<TransferDetail> {
    return this.request<TransferDetail>('POST', `/transfers/${id}/rescue/confirm`, payload, idempotencyKey);
  }

  // 15. POST /transfers/{id}/reclaim-rent/prepare
  async prepareReclaimRent(id: string, idempotencyKey?: string): Promise<PrepareRecoveryResponse> {
    return this.request<PrepareRecoveryResponse>('POST', `/transfers/${id}/reclaim-rent/prepare`, {}, idempotencyKey);
  }

  // 16. POST /transfers/{id}/reclaim-rent/confirm
  async confirmReclaimRent(
    id: string,
    payload: { signatures: string[] },
    idempotencyKey?: string
  ): Promise<TransferDetail> {
    return this.request<TransferDetail>('POST', `/transfers/${id}/reclaim-rent/confirm`, payload, idempotencyKey);
  }

  // 17. GET /webhooks
  async listWebhooks(): Promise<{ data: WebhookEndpoint[] }> {
    return this.request<{ data: WebhookEndpoint[] }>('GET', '/webhooks');
  }

  // 18. POST /webhooks
  async createWebhook(
    payload: { url: string; events: WebhookEventType[] },
    idempotencyKey?: string
  ): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>('POST', '/webhooks', payload, idempotencyKey);
  }

  // 19. DELETE /webhooks/{id}
  async deleteWebhook(id: string, idempotencyKey?: string): Promise<void> {
    return this.request<void>('DELETE', `/webhooks/${id}`, undefined, idempotencyKey);
  }

  // 20. GET /usage
  async getUsage(): Promise<UsageSummary> {
    return this.request<UsageSummary>('GET', '/usage');
  }
}

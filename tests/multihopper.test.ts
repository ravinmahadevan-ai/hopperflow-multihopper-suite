import { describe, it, expect } from 'vitest';
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import {
  calculateMultiHopperQuote,
  calculatePrizePoolShare,
  calculateQualifyingVolume,
  executeTwoPhaseBroadcast,
  MULTIHOPPER_CORE_PROGRAM_ID,
  MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID,
  MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID,
  MultiHopperApiError,
  MultiHopperClient,
  PRICING_TIERS,
  resolvePricingTier,
  signPreparedTransactionWithKeypair,
  SOL_MINT_ADDRESS,
  validateCustomRoute,
  validateMultiSendDestinations,
} from '../src/lib/multihopper-sdk.ts';
import type { ConfirmBroadcastRequest, TransferDetail } from '../src/lib/multihopper-sdk.ts';
import {
  buildRealSolanaPreparedTxBundle,
  CURATED_HOP_LIBRARY,
  signWebhookPayload,
  verifyWebhookSignature,
} from '../src/server/index.ts';

describe('MultiHopper Protocol SDK & Engine Verification Suite', () => {
  it('exports exact official MultiHopper Solana Program IDs', () => {
    expect(MULTIHOPPER_CORE_PROGRAM_ID).toBe('3jLoS2wbNgtKzieUUxwg6Xhdv6gbZkHDtPWA9ZAgspFh');
    expect(MULTIHOPPER_ORCHESTRATOR_PROGRAM_ID).toBe('4TPCmR2uN3hDM1FbTsf7ZtFXwXGSz4u1Kxv5YHj6eruX');
    expect(MULTIHOPPER_TRANSFER_HOOK_GUARD_PROGRAM_ID).toBe('2JEv3pD6nczEvn1xDXaEzehkJofPPjoQQpnW5nGY3r52');
  });

  describe('1. 10-Tier Raydium CLMM Pricing Schedule & Fee Calculator', () => {
    it('maps USD values across all 10 pricing tiers accurately', () => {
      expect(PRICING_TIERS).toHaveLength(10);
      expect(resolvePricingTier(25).tier).toBe(0);
      expect(resolvePricingTier(50).flatFeeLamportsPerHop).toBe(0);
      expect(resolvePricingTier(75).flatFeeLamportsPerHop).toBe(125_000);
      expect(resolvePricingTier(120).flatFeeLamportsPerHop).toBe(375_000);
      expect(resolvePricingTier(180).flatFeeLamportsPerHop).toBe(625_000);
      expect(resolvePricingTier(230).flatFeeLamportsPerHop).toBe(875_000);
      expect(resolvePricingTier(290).flatFeeLamportsPerHop).toBe(1_125_000);
      expect(resolvePricingTier(350).flatFeeLamportsPerHop).toBe(1_375_000);
      expect(resolvePricingTier(410).flatFeeLamportsPerHop).toBe(1_625_000);
      expect(resolvePricingTier(480).flatFeeLamportsPerHop).toBe(1_875_000);
      expect(resolvePricingTier(1500).flatFeeLamportsPerHop).toBe(2_000_000);
    });

    it('computes 0.50% (50 bps) fee, 0.25% (25 bps) integrator share, and TRM screening fees', () => {
      // 10,000 USDC ($10,000 -> Tier 9: 2,000,000 lamports/hop) across 4 hops
      const quote = calculateMultiHopperQuote({
        mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountRaw: '10000000000', // 10,000 USDC (6 decimals)
        hopCount: 4,
        arrivalSeconds: 300,
        isMainnet: true,
      });

      expect(quote.pricingTier).toBe(9);
      expect(quote.percentFeeBps).toBe(50);
      expect(quote.percentFeeRaw).toBe('50000000'); // 50 USDC
      expect(quote.integratorPercentShareRaw).toBe('25000000'); // 25 USDC (0.25%)
      expect(quote.hopAmountRaw).toBe('9950000000'); // 9,950 USDC
      expect(quote.flatFeeLamportsPerHop).toBe('2000000');
      expect(quote.totalFlatFeeLamports).toBe('8000000'); // 4 * 2,000,000
      // Source + 1 recipient = 2 wallets * 2,000,000 lamports = 4,000,000 lamports
      expect(quote.screeningFeeLamports).toBe('4000000');
    });

    it('doubles recipient TRM screening fee when arrivalSeconds > 21,600s (6 hours)', () => {
      const quote = calculateMultiHopperQuote({
        mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountRaw: '1000000000',
        hopCount: 3,
        arrivalSeconds: 25_000, // > 6 hours triggers destination re-screening
        isMainnet: true,
      });
      // 1 source + (1 recipient * 2) = 3 screens * 2,000,000 = 6,000,000 lamports
      expect(quote.screeningFeeLamports).toBe('6000000');
    });
  });

  describe('2. Custom Route Validation (2-9 vs 3-10 hops, waitSeconds, Final Decoy Hop)', () => {
    const sourceOwner = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    it('enforces 2-9 hops for single recipient and 3-10 hops for multi-destination', () => {
      const twoHops = {
        hops: [
          { index: 0, wallet: CURATED_HOP_LIBRARY[0].address, waitSeconds: 30 },
          { index: 1, wallet: CURATED_HOP_LIBRARY[1].address, waitSeconds: 30 },
        ],
      };

      // Valid for single recipient
      expect(validateCustomRoute(twoHops, 'single', sourceOwner, recipient, CURATED_HOP_LIBRARY).valid).toBe(true);

      // Invalid for multi-destination (requires minimum 3 hops)
      expect(() =>
        validateCustomRoute(
          twoHops,
          'destinations',
          sourceOwner,
          [{ recipientWallet: recipient, amountRaw: '1000000' }],
          CURATED_HOP_LIBRARY
        )
      ).toThrowError(MultiHopperApiError);
    });

    it('rejects multi-destination route when final decoy hop belongs to contracts bundle (canEndRoute=false)', () => {
      const contractsWallet = CURATED_HOP_LIBRARY.find((w) => w.bundle === 'contracts')!;
      expect(contractsWallet.canEndRoute).toBe(false);

      const badMultiRoute = {
        hops: [
          { index: 0, wallet: CURATED_HOP_LIBRARY[0].address, waitSeconds: 30 },
          { index: 1, wallet: CURATED_HOP_LIBRARY[1].address, waitSeconds: 30 },
          { index: 2, wallet: contractsWallet.address, waitSeconds: 30 },
        ],
      };

      expect(() =>
        validateCustomRoute(
          badMultiRoute,
          'destinations',
          sourceOwner,
          [{ recipientWallet: recipient, amountRaw: '1000000' }],
          CURATED_HOP_LIBRARY
        )
      ).toThrow(/MH_018/);
    });

    it('rejects waitSeconds < 20s or forbidden source/recipient wallet inside hops', () => {
      const fastRoute = {
        hops: [
          { index: 0, wallet: CURATED_HOP_LIBRARY[0].address, waitSeconds: 10 },
          { index: 1, wallet: CURATED_HOP_LIBRARY[1].address, waitSeconds: 30 },
        ],
      };
      expect(() => validateCustomRoute(fastRoute, 'single', sourceOwner, recipient)).toThrow(/MH_015/);

      const forbiddenWalletRoute = {
        hops: [
          { index: 0, wallet: sourceOwner, waitSeconds: 30 },
          { index: 1, wallet: CURATED_HOP_LIBRARY[1].address, waitSeconds: 30 },
        ],
      };
      expect(() => validateCustomRoute(forbiddenWalletRoute, 'single', sourceOwner, recipient)).toThrow(/MH_017/);
    });
  });

  describe('3. Multi-Send Destination Validation (1-20 Recipients, Exact Sum, SOL Rent Exemption)', () => {
    it('validates exact BigInt sum and distinct recipient wallets', () => {
      const w1 = Keypair.generate().publicKey.toBase58();
      const w2 = Keypair.generate().publicKey.toBase58();

      const validRes = validateMultiSendDestinations(
        '5000000000',
        [
          { recipientWallet: w1, amountRaw: '3000000000' },
          { recipientWallet: w2, amountRaw: '2000000000' },
        ],
        false
      );
      expect(validRes.valid).toBe(true);

      // Sum mismatch throws MH_016
      expect(() =>
        validateMultiSendDestinations(
          '5000000000',
          [
            { recipientWallet: w1, amountRaw: '3000000000' },
            { recipientWallet: w2, amountRaw: '1999999999' },
          ],
          false
        )
      ).toThrow(/MH_016/);

      // Duplicate recipient wallet throws MH_017
      expect(() =>
        validateMultiSendDestinations(
          '5000000000',
          [
            { recipientWallet: w1, amountRaw: '2500000000' },
            { recipientWallet: w1, amountRaw: '2500000000' },
          ],
          false
        )
      ).toThrow(/MH_017/);
    });

    it('rejects native SOL destination payout that falls below 890,880 lamports post-fee', () => {
      const w1 = Keypair.generate().publicKey.toBase58();
      // 892,000 lamports minus 0.50% (4,460) = 887,540 lamports (< 890,880 rent-exempt minimum)
      expect(() =>
        validateMultiSendDestinations('892000', [{ recipientWallet: w1, amountRaw: '892000' }], true)
      ).toThrow(/MH_021/);
    });
  });

  describe('4. Two-Phase Broadcast Orchestrator & VersionedTransaction v0 Partial Signing', () => {
    it('preserves existing ephemeral keypair signatures on VersionedTransaction v0 and executes 2 confirm-broadcast calls', async () => {
      const userKeypair = Keypair.generate();
      const recipient = Keypair.generate().publicKey.toBase58();

      const quote = calculateMultiHopperQuote({
        sourceOwner: userKeypair.publicKey.toBase58(),
        recipientWallet: recipient,
        mintAddress: SOL_MINT_ADDRESS,
        amountRaw: '5000000000',
        hopCount: 3,
      });

      const dummyTransfer: TransferDetail = {
        id: 'tr_test_v0_partial_sign',
        externalId: 'EXT-V0-1',
        status: 'AWAITING_DEPOSIT',
        mintAddress: SOL_MINT_ADDRESS,
        sourceOwner: userKeypair.publicKey.toBase58(),
        recipientWallet: recipient,
        destinations: null,
        amountRaw: '5000000000',
        hopCount: 3,
        arrivalSeconds: 180,
        bundle: 'mix',
        routePda: null,
        depositTxSignature: null,
        payoutTxSignature: null,
        failureCode: null,
        failureMessage: null,
        quote,
        hops: [],
        canRescue: false,
        canReclaimRent: false,
        rentReclaimedAt: null,
        rescuedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const bundle = buildRealSolanaPreparedTxBundle(dummyTransfer);

      // Verify routeInitTxs[0] is a VersionedTransaction v0 with 1 pre-existing ephemeral signature
      const beforeV0 = VersionedTransaction.deserialize(Buffer.from(bundle.routeInitTxs[0], 'base64'));
      expect(beforeV0.version).toBe(0);
      const nonZeroBefore = beforeV0.signatures.filter((s) => s.some((b) => b !== 0)).length;
      expect(nonZeroBefore).toBe(1);

      const confirmCalls: ConfirmBroadcastRequest[] = [];

      const result = await executeTwoPhaseBroadcast({
        transferId: dummyTransfer.id,
        bundle,
        propagationDelayMs: 0, // Instant for unit test
        signAndBroadcastTx: async (input) => {
          const signed = signPreparedTransactionWithKeypair(input.base64Tx, userKeypair);
          if (input.isVersionedV0) {
            const afterV0 = VersionedTransaction.deserialize(Buffer.from(signed.signedBase64, 'base64'));
            const nonZeroAfter = afterV0.signatures.filter((s) => s.some((b) => b !== 0)).length;
            // Ephemeral signature + user signature both present!
            expect(nonZeroAfter).toBe(2);
          }
          return {
            signature: `sig_${input.txType}_${input.index}`,
            existingSignaturesPreserved: signed.existingSignaturesPreserved,
          };
        },
        confirmBroadcast: async (_id, payload) => {
          confirmCalls.push(payload);
          return { ...dummyTransfer, status: 'COMPLETED' };
        },
      });

      expect(result.confirmCallsCount).toBe(2);
      // First confirm-broadcast call MUST have empty routeInitSignatures and non-empty keeperFundingSignature
      expect(confirmCalls[0].routeInitSignatures).toEqual([]);
      expect(confirmCalls[0].keeperFundingSignature).toBe('sig_keeperFundingTx_0');
      // Second confirm-broadcast call includes routeInitSignatures, orchestratorInitSignature, and sessionInitSignatures
      expect(confirmCalls[1].routeInitSignatures).toEqual(['sig_routeInitTx_0']);
      expect(confirmCalls[1].orchestratorInitSignature).toBe('sig_orchestratorInitTx_0');
      expect(confirmCalls[1].sessionInitSignatures).toEqual(['sig_sessionInitTx_0']);
    });
  });

  describe('5. HMAC-SHA256 Webhook Verification & Challenge Prize Pool Math', () => {
    it('verifies valid HMAC-SHA256 signatures and rejects tampered payloads via timingSafeEqual', () => {
      const secret = 'whsec_test_secret_key_998877';
      const payload = JSON.stringify({ id: 'evt_1', event: 'transfer.completed', amountRaw: '1000000' });
      const validSig = signWebhookPayload(payload, secret);

      expect(verifyWebhookSignature(payload, validSig, secret)).toBe(true);
      expect(verifyWebhookSignature(payload + ' ', validSig, secret)).toBe(false);
      expect(verifyWebhookSignature(payload, 'deadbeef', secret)).toBe(false);
    });

    it('calculates challenge qualifying volume (collected_fees / 0.0025) and prize pool scaling', () => {
      // $357.125 in collected 0.25% fees -> $142,850 qualifying volume
      expect(calculateQualifyingVolume(357.125)).toBe(142_850);

      // At $2,000,000 aggregate volume -> 5 steps of $400k -> $5,000 + $5,000 = $10,000 pool
      const prize = calculatePrizePoolShare(2_000_000, 250_000, 500_000);
      expect(prize.unlockedPrizePoolUsd).toBe(10_000);
      expect(prize.qualifiesForMinimum100k).toBe(true);
      expect(prize.proportionalShareRatio).toBe(0.5);
      expect(prize.estimatedProjectPrizeUsd).toBe(5_000);
      expect(prize.ongoingIntegratorRevenueUsd).toBe(625); // 0.25% of $250,000
    });

    it('enforces environment key prefixes in MultiHopperClient', () => {
      expect(() => new MultiHopperClient({ apiKey: 'mh_test_123', environment: 'mainnet' })).toThrow(/MH_001/);
      expect(() => new MultiHopperClient({ apiKey: 'mh_live_123', environment: 'devnet' })).toThrow(/MH_001/);
      const liveClient = new MultiHopperClient({ apiKey: 'mh_live_valid_key', environment: 'mainnet' });
      expect(liveClient.environment).toBe('mainnet');
    });
  });
});

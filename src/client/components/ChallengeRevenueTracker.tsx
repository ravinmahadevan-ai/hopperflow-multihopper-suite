import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Coins,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { TransferRecord } from '../types';

interface ChallengeRevenueTrackerProps {
  transfers: TransferRecord[];
}

export const ChallengeRevenueTracker: React.FC<ChallengeRevenueTrackerProps> = ({
  transfers,
}) => {
  const sessionVolumeUsd = transfers.reduce((acc, t) => acc + t.usdValue, 0);
  const [simulatedProjectVolumeUsd, setSimulatedProjectVolumeUsd] = useState(
    Math.max(350000, sessionVolumeUsd),
  );
  const [aggregateChallengeVolumeUsd, setAggregateChallengeVolumeUsd] = useState(8500000);
  const [topThreeSharePct, setTopThreeSharePct] = useState(32);

  // Official Superteam Challenge Formula:
  // Qualifying Volume = collected_percentage_fees / 0.0025
  const collectedIntegratorFeesUsd = simulatedProjectVolumeUsd * 0.0025;
  const derivedQualifyingVolume = collectedIntegratorFeesUsd / 0.0025;
  const qualifiesForPrize = derivedQualifyingVolume >= 100000;

  // Dynamic Prize Pool Unlocked ($15K base up to $50K at $10M+ aggregate challenge volume)
  const unlockedPrizePoolUsd =
    aggregateChallengeVolumeUsd >= 10000000
      ? 50000
      : aggregateChallengeVolumeUsd >= 5000000
      ? 35000
      : 15000;

  const estimatedPrizeShareUsd = qualifiesForPrize
    ? unlockedPrizePoolUsd * (topThreeSharePct / 100)
    : 0;

  const totalCombinedEarningsUsd = estimatedPrizeShareUsd + collectedIntegratorFeesUsd;

  return (
    <div className="space-y-6">
      {/* Top Banner: Official Qualifying Formula */}
      <div className="bg-gradient-to-r from-[#14F195]/10 via-[#0E121B] to-[#9945FF]/15 border border-[#1E2638] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/40">
              GET /usage • SUPERTEAM CHALLENGE TRACKER
            </span>
            <h2 className="text-base font-bold text-white">
              MultiHopper Build & Route Challenge ($50,000 + 0.25% Ongoing Rev Share)
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Official Volume Formula:{' '}
            <code className="text-[#14F195]">
              qualifying_volume = collected_percentage_fees / 0.0025
            </code>{' '}
            • Minimum Qualifying Gate: <strong className="text-white">$100,000 USD</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#07090E] border border-[#1E2638] text-right font-mono">
            <div className="text-[10px] text-slate-400">LIVE SESSION ROUTED</div>
            <div className="text-sm font-bold text-[#14F195]">
              ${sessionVolumeUsd.toLocaleString()} USD
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 ${
              qualifiesForPrize
                ? 'bg-[#14F195]/15 border-[#14F195]/40 text-[#14F195]'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {qualifiesForPrize ? '$100K GATE UNLOCKED' : 'BELOW $100K GATE'}
          </div>
        </div>
      </div>

      {/* Main Simulator & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Interactive Volume & Prize Pool Simulator */}
        <div className="lg:col-span-7 bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-5">
          <div className="pb-3 border-b border-[#1E2638] flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Interactive $50,000 Prize Pool & 0.25% Revenue Share Simulator
            </h3>
            <span className="text-xs font-mono text-[#00C2FF]">Pro-Rata Top-3 Split</span>
          </div>

          {/* Slider 1: HopperFlow Production Volume */}
          <div className="space-y-2 bg-[#07090E] p-4 rounded-xl border border-[#1E2638]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                1. HopperFlow Routed Production Volume:
              </span>
              <span className="text-sm font-bold text-[#14F195]">
                ${simulatedProjectVolumeUsd.toLocaleString()} USD
              </span>
            </div>
            <input
              type="range"
              min={50000}
              max={5000000}
              step={25000}
              value={simulatedProjectVolumeUsd}
              onChange={(e) => setSimulatedProjectVolumeUsd(Number(e.target.value))}
              className="w-full accent-[#14F195]"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>$50K</span>
              <span className="text-[#14F195]">$100K Gate</span>
              <span>$1M</span>
              <span>$2.5M</span>
              <span>$5M</span>
            </div>
          </div>

          {/* Slider 2: Aggregate Challenge Volume */}
          <div className="space-y-2 bg-[#07090E] p-4 rounded-xl border border-[#1E2638]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                2. Aggregate Challenge Ecosystem Volume:
              </span>
              <span className="text-sm font-bold text-[#00C2FF]">
                ${aggregateChallengeVolumeUsd.toLocaleString()} USD (Unlocks $
                {unlockedPrizePoolUsd.toLocaleString()} Pool)
              </span>
            </div>
            <input
              type="range"
              min={2000000}
              max={15000000}
              step={500000}
              value={aggregateChallengeVolumeUsd}
              onChange={(e) => setAggregateChallengeVolumeUsd(Number(e.target.value))}
              className="w-full accent-[#00C2FF]"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>$2M ($15K Pool)</span>
              <span>$5M ($35K Pool)</span>
              <span>$10M+ ($50K Max Pool)</span>
            </div>
          </div>

          {/* Slider 3: Top-3 Pro-Rata Volume Share */}
          <div className="space-y-2 bg-[#07090E] p-4 rounded-xl border border-[#1E2638]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                3. HopperFlow Share of Top-3 Qualifying Volume:
              </span>
              <span className="text-sm font-bold text-[#c49bff]">{topThreeSharePct}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={1}
              value={topThreeSharePct}
              onChange={(e) => setTopThreeSharePct(Number(e.target.value))}
              className="w-full accent-[#9945FF]"
            />
          </div>
        </div>

        {/* Right 5 Columns: Calculated Payouts & Ongoing Revenue Card */}
        <div className="lg:col-span-5 bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[#1E2638] flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#14F195]" />
                Projected Integrator Payout Breakdown
              </h3>
              <Award className="w-4 h-4 text-[#9945FF]" />
            </div>

            <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E2638] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Collected 0.25% Integrator Fees:</span>
                <span className="text-[#14F195] font-bold">
                  +${collectedIntegratorFeesUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Derived Qualifying Volume (/0.0025):</span>
                <span className="text-white font-bold">
                  ${derivedQualifyingVolume.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pro-Rata Prize Pool Share ({topThreeSharePct}%):</span>
                <span className="text-[#00C2FF] font-bold">
                  +${estimatedPrizeShareUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-sm">
                <span className="text-white font-bold">Total Projected Challenge + Rev:</span>
                <span className="text-[#14F195] font-bold text-base">
                  ${totalCombinedEarningsUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#9945FF]/10 border border-[#9945FF]/30 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#14F195]" />
              Perpetual Post-Challenge Revenue Stream
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every API key created via MultiHopper retains its 50% fee split (0.25% of routed
              volume) indefinitely on-chain, deposited atomically into your configured rewards
              wallet on every transfer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

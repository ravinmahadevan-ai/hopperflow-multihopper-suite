import React from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  FastForward,
  Layers,
  Lock,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Split,
  AlertTriangle,
} from 'lucide-react';
import { TransferRecord } from '../types';

interface RouteVisualizerProps {
  transfers: TransferRecord[];
  selectedTransfer: TransferRecord;
  onSelectTransfer: (transfer: TransferRecord) => void;
  onAdvanceTransferPhase: (transferId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const BUNDLE_BADGE_COLORS: Record<string, string> = {
  cex: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  dex: 'bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/40',
  exchanges: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  kol: 'bg-pink-500/15 text-pink-300 border-pink-500/40',
  contracts: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  mix: 'bg-[#14F195]/15 text-[#14F195] border-[#14F195]/40',
};

const PHASE_BADGES: Record<string, { label: string; className: string }> = {
  quoted: { label: 'QUOTED', className: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
  funding: { label: 'FUNDING', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  deploying: { label: 'DEPLOYING PDAs', className: 'bg-[#00C2FF]/20 text-[#00C2FF] border-[#00C2FF]/40' },
  executing: { label: 'EXECUTING HOPS', className: 'bg-[#9945FF]/20 text-[#c49bff] border-[#9945FF]/50' },
  settled: { label: 'SETTLED', className: 'bg-[#14F195]/20 text-[#14F195] border-[#14F195]/40' },
  failed: { label: 'HOP HALTED (RESCUABLE)', className: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  cancelled: { label: 'CANCELLED', className: 'bg-slate-700/40 text-slate-400 border-slate-600' },
  expired: { label: 'EXPIRED', className: 'bg-slate-700/40 text-slate-400 border-slate-600' },
};

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({
  transfers,
  selectedTransfer,
  onSelectTransfer,
  onAdvanceTransferPhase,
  onNavigateToTab,
}) => {
  const totalRoutedVolumeUsd = transfers.reduce((acc, t) => acc + t.usdValue, 0);
  const totalIntegratorRevUsd = transfers.reduce(
    (acc, t) => acc + t.feeBreakdown.integratorShareUsd,
    0,
  );
  const completedHopsCount = selectedTransfer.hops.filter((h) => h.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Institutional KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Routed Session Volume
            </span>
            <Activity className="w-4 h-4 text-[#14F195]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalRoutedVolumeUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Qualifying Gate: $100,000</span>
            <span className="text-[#14F195] font-mono">
              {Math.min(100, (totalRoutedVolumeUsd / 100000) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Atomic Integrator Share (0.25%)
            </span>
            <Coins className="w-4 h-4 text-[#9945FF]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#14F195]">
            +${totalIntegratorRevUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono truncate">
            Vault: {selectedTransfer.integratorRewardsWallet.slice(0, 8)}...
            {selectedTransfer.integratorRewardsWallet.slice(-6)}
          </div>
        </div>

        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Vetted Hop Library Nodes
            </span>
            <Layers className="w-4 h-4 text-[#00C2FF]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">598 Mainnet</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#00C2FF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TRM Labs Screened (0.002 SOL/wallet)</span>
          </div>
        </div>

        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Refundable Step/Route Rent
            </span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {(
              transfers.reduce((acc, t) => acc + t.recovery.refundableLamports, 0) / 1e9
            ).toFixed(4)}{' '}
            SOL
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Reclaimable via /reclaim-rent</span>
            <button
              onClick={() => onNavigateToTab('recovery')}
              className="text-[#00C2FF] hover:underline font-medium"
            >
              Reclaim →
            </button>
          </div>
        </div>
      </div>

      {/* Live Multi-Hop Topology & Dispersion Graph Card */}
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1E2638]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/40">
                <span className="w-2 h-2 rounded-full bg-[#14F195] animate-ping" />
                LIVE TOPOLOGY GRAPH
              </span>
              <h2 className="text-lg font-bold text-white">
                Transfer <span className="font-mono text-[#00C2FF]">{selectedTransfer.id}</span>
              </h2>
              <span
                className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded border ${
                  PHASE_BADGES[selectedTransfer.phase]?.className || ''
                }`}
              >
                {PHASE_BADGES[selectedTransfer.phase]?.label || selectedTransfer.phase.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              supportBundleId: <span className="text-slate-200">{selectedTransfer.supportBundleId}</span>{' '}
              • Token-2022 Wrapper Vault:{' '}
              <span className="text-[#9945FF]">
                {selectedTransfer.wrapperVaultMint.slice(0, 10)}...
                {selectedTransfer.wrapperVaultMint.slice(-6)}
              </span>{' '}
              • Fee Tier:{' '}
              <span className="text-[#14F195]">{selectedTransfer.feeBreakdown.tierName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedTransfer.phase !== 'settled' && (
              <button
                onClick={() => onAdvanceTransferPhase(selectedTransfer.id)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#14F195] to-[#00C2FF] text-slate-950 hover:opacity-95 transition shadow-lg shadow-[#14F195]/10"
              >
                <FastForward className="w-3.5 h-3.5" />
                Simulate Next Hop / Webhook Event
              </button>
            )}
            <button
              onClick={() => onNavigateToTab('multisend')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#161D2B] text-slate-200 border border-[#263147] hover:border-[#14F195]/50 transition"
            >
              <Split className="w-3.5 h-3.5 text-[#14F195]" />
              New Routed Transfer
            </button>
          </div>
        </div>

        {/* Interactive Horizontal Topology Diagram */}
        <div className="mt-6 overflow-x-auto pb-3">
          <div className="min-w-[980px] flex items-stretch justify-between gap-3">
            {/* Column 1: Source Wallet & Token2022 Wrapper Vault */}
            <div className="w-56 flex flex-col justify-between bg-[#07090E] border border-[#1E2638] rounded-xl p-3.5 relative">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>SOURCE TREASURY</span>
                  <span className="text-[#14F195] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> TRM OK
                  </span>
                </div>
                <div className="font-mono text-xs text-white font-semibold truncate">
                  {selectedTransfer.sourceWallet.slice(0, 8)}...
                  {selectedTransfer.sourceWallet.slice(-8)}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#14F195]/10 border border-[#14F195]/30 text-[#14F195] font-mono text-xs font-bold">
                  {selectedTransfer.amountUi.toLocaleString()} {selectedTransfer.tokenSymbol}
                  <span className="text-[10px] text-slate-300 font-normal">
                    (${selectedTransfer.usdValue.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Token-2022 Wrapper Mint Box */}
              <div className="mt-3 pt-3 border-t border-[#1E2638]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c49bff]">
                  <Lock className="w-3 h-3 text-[#9945FF]" />
                  Token-2022 Vault Wrapper
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Guard Hook: <span className="text-slate-200">2JEv...3r52</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Orchestrator: <span className="text-slate-200">4TPC...eruX</span>
                </div>
              </div>

              {/* Atomic 0.25% Revenue Share Split Pill */}
              <div className="mt-3 pt-2.5 border-t border-[#1E2638] bg-[#9945FF]/10 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl flex items-center justify-between">
                <div className="text-[10px] font-mono text-[#c49bff]">
                  <div className="font-semibold">ATOMIC 0.25% REV SHARE</div>
                  <div className="text-slate-400">To Integrator Rewards</div>
                </div>
                <span className="font-mono text-xs font-bold text-[#14F195]">
                  +${selectedTransfer.feeBreakdown.integratorShareUsd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Connector Arrow */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#14F195] to-[#9945FF]" />
              <ArrowRight className="w-4 h-4 text-[#9945FF] -mt-2.5" />
              <span className="text-[10px] font-mono text-slate-400 mt-1">Wrap</span>
            </div>

            {/* Column 2: Multi-Hop Sequence */}
            <div className="flex-1 flex items-center gap-2.5 bg-[#07090E]/70 border border-[#1E2638] rounded-xl p-3.5 overflow-x-auto">
              {selectedTransfer.hops.map((hop, idx) => {
                const isDone = hop.status === 'completed';
                const isCurrent = hop.status === 'in_progress';
                const isFailed = hop.status === 'failed';

                return (
                  <React.Fragment key={hop.index}>
                    <div
                      className={`min-w-[175px] flex-1 rounded-lg p-3 border transition-all ${
                        isDone
                          ? 'bg-[#0E1622] border-[#14F195]/40'
                          : isCurrent
                          ? 'bg-[#15182B] border-[#9945FF] shadow-lg shadow-[#9945FF]/15'
                          : isFailed
                          ? 'bg-rose-950/30 border-rose-500/60'
                          : 'bg-[#0C1018] border-[#1E2638] opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          HOP #{idx + 1} {hop.isDecoyExit ? '• DECOY EXIT' : ''}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono uppercase rounded border ${
                            BUNDLE_BADGE_COLORS[hop.bundle] || ''
                          }`}
                        >
                          {hop.bundle}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white truncate" title={hop.label}>
                        {hop.label}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {hop.walletAddress.slice(0, 6)}...{hop.walletAddress.slice(-6)}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-[#1E2638]/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-[#00C2FF]" />
                          {hop.waitSeconds}s wait
                        </span>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 text-[#14F195]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[#c49bff] animate-pulse">
                            <Play className="w-3 h-3" /> Active
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> Halted
                          </span>
                        )}
                        {hop.status === 'pending' && (
                          <span className="text-slate-500">Queued</span>
                        )}
                      </div>
                    </div>

                    {idx < selectedTransfer.hops.length - 1 && (
                      <div className="flex flex-col items-center justify-center">
                        <ArrowRight
                          className={`w-4 h-4 ${
                            isDone ? 'text-[#14F195]' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Connector Arrow to Dispersion */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
              <ArrowRight className="w-4 h-4 text-[#14F195] -mt-2.5" />
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                {selectedTransfer.mode === 'multi' ? 'Disperse' : 'Settle'}
              </span>
            </div>

            {/* Column 3: Commitment Dispersion / Final Destination(s) */}
            <div className="w-64 bg-[#07090E] border border-[#1E2638] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <span>
                    {selectedTransfer.mode === 'multi'
                      ? `DISPERSION (${selectedTransfer.destinations.length} WALLETS)`
                      : 'SINGLE RECIPIENT'}
                  </span>
                  <span className="text-[#00C2FF]">3jLo...spFh</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedTransfer.destinations.map((dest, i) => (
                    <div
                      key={dest.id || i}
                      className="px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-slate-200 truncate">
                          {dest.label || `Recipient #${i + 1}`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {dest.recipientWallet.slice(0, 6)}...{dest.recipientWallet.slice(-4)}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-[#14F195] font-semibold">
                          {Number(dest.amountUi).toLocaleString()} {selectedTransfer.tokenSymbol}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {selectedTransfer.phase === 'settled' ? 'Settled ✓' : 'Committed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1E2638] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Hop Progress:</span>
                <span className="text-[#14F195] font-bold">
                  {completedHopsCount} / {selectedTransfer.hops.length} Hops
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active & Historical Routed Transfers Table */}
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#14F195]" />
              Routed Transfers & Multi-Send Payroll Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any transfer row to inspect its live Multi-Hop topology, supportBundleId, and
              cryptographic signatures above.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {transfers.length} transfers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E2638] bg-[#07090E]/60 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Transfer ID / Support Bundle</th>
                <th className="py-3 px-4">Mode & Destinations</th>
                <th className="py-3 px-4">Principal & Tier</th>
                <th className="py-3 px-4">Hop Progression</th>
                <th className="py-3 px-4">Integrator 0.25%</th>
                <th className="py-3 px-4">Phase Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-xs">
              {transfers.map((tr) => {
                const isSelected = tr.id === selectedTransfer.id;
                const doneHops = tr.hops.filter((h) => h.status === 'completed').length;

                return (
                  <tr
                    key={tr.id}
                    onClick={() => onSelectTransfer(tr)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#14F195]/5 hover:bg-[#14F195]/10'
                        : 'hover:bg-[#161D2B]/60'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {tr.id}
                        {isSelected && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-[#14F195]/20 text-[#14F195]">
                            Inspecting
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        bundle: {tr.supportBundleId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">
                        {tr.mode === 'multi'
                          ? `Multi-Send (${tr.destinations.length} Wallets)`
                          : 'Single Discreet Transfer'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Route: {tr.routingMode.toUpperCase()} ({tr.hops.length} hops)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-white">
                        {tr.amountUi.toLocaleString()} {tr.tokenSymbol}{' '}
                        <span className="text-slate-400 font-normal">
                          (${tr.usdValue.toLocaleString()})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#00C2FF]">
                        {tr.feeBreakdown.tierName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-28 bg-[#07090E] h-2 rounded-full overflow-hidden border border-[#1E2638]">
                          <div
                            className={`h-full transition-all ${
                              tr.phase === 'failed'
                                ? 'bg-rose-500'
                                : 'bg-gradient-to-r from-[#9945FF] to-[#14F195]'
                            }`}
                            style={{
                              width: `${Math.max(12, (doneHops / tr.hops.length) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-300">
                          {doneHops}/{tr.hops.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {tr.hops.map((h) => (
                          <span
                            key={h.index}
                            className="text-[10px] font-mono px-1 rounded bg-[#07090E] text-slate-400 border border-[#1E2638]"
                          >
                            {h.bundle}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-[#14F195] font-semibold">
                        +${tr.feeBreakdown.integratorShareUsd.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Refundable: {(tr.recovery.refundableLamports / 1e9).toFixed(4)} SOL
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded border ${
                          PHASE_BADGES[tr.phase]?.className || ''
                        }`}
                      >
                        {PHASE_BADGES[tr.phase]?.label || tr.phase}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tr.phase !== 'settled' && tr.phase !== 'failed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdvanceTransferPhase(tr.id);
                            }}
                            className="px-2.5 py-1 rounded bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/40 hover:bg-[#14F195]/25 font-mono text-[11px] transition"
                          >
                            Step Hop →
                          </button>
                        )}
                        {tr.recovery.canRescue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToTab('recovery');
                            }}
                            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-mono text-[11px] transition"
                          >
                            Rescue Funds
                          </button>
                        )}
                        <a
                          href={`https://solscan.io/tx/${
                            tr.signatures.keeperFundingSig || '5xK9mP2vQ8wL4nR7tY1uI3oP5aS7dF9gH'
                          }`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded bg-[#07090E] text-slate-400 hover:text-white border border-[#1E2638]"
                          title="Inspect on Solscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

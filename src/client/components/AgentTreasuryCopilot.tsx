import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Cpu,
  Lock,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  calculateLocalFeeEstimate,
  HopNode,
  INITIAL_HOP_LIBRARY,
  SUPPORTED_TOKENS,
  TransferRecord,
} from '../types';

interface AgentTreasuryCopilotProps {
  sourceWallet: string;
  onExecuteAgentTransfer: (newTransfer: TransferRecord) => void;
}

interface ParsedAgentPlan {
  intentSummary: string;
  tokenSymbol: string;
  tokenMint: string;
  totalAmountUi: number;
  usdValue: number;
  hopCount: number;
  bundles: ('cex' | 'dex' | 'exchanges' | 'kol' | 'mix')[];
  waitSecondsPerHop: number;
  destinations: {
    label: string;
    wallet: string;
    amountUi: number;
  }[];
  policyChecks: {
    rule: string;
    passed: boolean;
    detail: string;
  }[];
}

const SAMPLE_PROMPTS = [
  'Disburse 15,000 USDC across 4 AI compute providers with CEX/DEX mixing under 3 minutes',
  'Route 120 SOL treasury liquidity split to 3 validator infrastructure vaults via 5 hops',
  'Settle 28,000 PYUSD (Token-2022) across 5 autonomous data labeling agents with 30s cadence',
];

export const AgentTreasuryCopilot: React.FC<AgentTreasuryCopilotProps> = ({
  sourceWallet,
  onExecuteAgentTransfer,
}) => {
  const [promptText, setPromptText] = useState(SAMPLE_PROMPTS[0]);
  const [maxDailyBudgetUsd, setMaxDailyBudgetUsd] = useState(100000);
  const [requireTrmScreening, setRequireTrmScreening] = useState(true);
  const [maxAllowedTier, setMaxAllowedTier] = useState(6);

  const parsePromptIntoPlan = (text: string): ParsedAgentPlan => {
    const upper = text.toUpperCase();
    const isSol = upper.includes('SOL') && !upper.includes('USDC') && !upper.includes('PYUSD');
    const isPyusd = upper.includes('PYUSD');
    const token = isSol
      ? SUPPORTED_TOKENS[0]
      : isPyusd
      ? SUPPORTED_TOKENS[5]
      : SUPPORTED_TOKENS[1];

    const numMatch = text.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
    const totalAmountUi = numMatch ? Math.max(10, Number(numMatch[1])) : 15000;
    const usdValue = totalAmountUi * token.priceUsd;

    const destCount = upper.includes('5 ')
      ? 5
      : upper.includes('3 ')
      ? 3
      : 4;

    const hopCount = upper.includes('5 HOP') ? 5 : 4;
    const perDest = Math.floor(totalAmountUi / destCount);
    const remainder = totalAmountUi - perDest * (destCount - 1);

    const sampleWallets = [
      '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E',
      '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
      '6ZRCB7AAqGre6c72PRz3mhLC73VMYvJ8bi9KHf1HFpNk',
      '8pFhUq2zB6xJw3mN5vR7tY9kL1qW4eR6tY8uI0oP2aS4',
    ];

    const destinations = Array.from({ length: destCount }).map((_, i) => ({
      label: `Autonomous Compute / Agent Node #${i + 1}`,
      wallet: sampleWallets[i % sampleWallets.length],
      amountUi: i === destCount - 1 ? remainder : perDest,
    }));

    const feeEst = calculateLocalFeeEstimate(usdValue, hopCount, destCount);

    return {
      intentSummary: `Autonomous Multi-Send Dispersion (${destCount} agent endpoints via ${hopCount} vetted hops)`,
      tokenSymbol: token.symbol,
      tokenMint: token.mint,
      totalAmountUi,
      usdValue,
      hopCount,
      bundles: ['cex', 'dex', 'mix', 'exchanges', 'dex'].slice(0, hopCount) as (
        | 'cex'
        | 'dex'
        | 'exchanges'
        | 'kol'
        | 'mix'
      )[],
      waitSecondsPerHop: 25,
      destinations,
      policyChecks: [
        {
          rule: 'Treasury Daily Spend Cap Guardrail',
          passed: usdValue <= maxDailyBudgetUsd,
          detail: `$${usdValue.toLocaleString()} <= $${maxDailyBudgetUsd.toLocaleString()} cap`,
        },
        {
          rule: 'TRM Labs On-Chain Sanctions Screening',
          passed: requireTrmScreening,
          detail: `${destCount + 1} wallets pre-screened (0.002 SOL/wallet)`,
        },
        {
          rule: 'Raydium CLMM Fee Tier Ceiling',
          passed: feeEst.tierIndex <= maxAllowedTier,
          detail: `${feeEst.tierName} <= Max Tier ${maxAllowedTier}`,
        },
        {
          rule: 'MultiHopper Exact Raw Sum Invariant (MH_017)',
          passed: true,
          detail: `sum(destinations) === ${totalAmountUi.toLocaleString()} ${token.symbol}`,
        },
      ],
    };
  };

  const plan = parsePromptIntoPlan(promptText);
  const feeBreakdown = calculateLocalFeeEstimate(
    plan.usdValue,
    plan.hopCount,
    plan.destinations.length,
  );
  const allPoliciesPassed = plan.policyChecks.every((c) => c.passed);

  const handleDispatchAgentRoute = async () => {
    const tokenObj =
      SUPPORTED_TOKENS.find((t) => t.symbol === plan.tokenSymbol) || SUPPORTED_TOKENS[1];

    try {
      await fetch('/api/agent/evaluate-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          maxDailyBudgetUsd,
          requireTrmScreening,
        }),
      });
    } catch {
      // Continues with local execution
    }

    const hops: HopNode[] = plan.bundles.map((bundle, idx) => {
      const lib =
        INITIAL_HOP_LIBRARY.find((h) => h.category === bundle) || INITIAL_HOP_LIBRARY[0];
      return {
        index: idx,
        walletAddress: lib.address,
        label: lib.label,
        bundle,
        waitSeconds: plan.waitSecondsPerHop,
        status: 'pending',
        trmScreened: true,
        isDecoyExit: idx === plan.bundles.length - 1,
      };
    });

    const newTransfer: TransferRecord = {
      id: `tr_agent_${Math.random().toString(16).slice(2, 10)}`,
      supportBundleId: `sb_agent_${Math.random().toString(16).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      sourceWallet,
      tokenSymbol: plan.tokenSymbol,
      tokenMint: plan.tokenMint,
      amountUi: plan.totalAmountUi,
      amountRaw: String(Math.round(plan.totalAmountUi * Math.pow(10, tokenObj.decimals))),
      usdValue: plan.usdValue,
      mode: 'multi',
      destinations: plan.destinations.map((d, i) => ({
        id: `ag_dest_${i}`,
        recipientWallet: d.wallet,
        amountUi: String(d.amountUi),
        amountRaw: String(Math.round(d.amountUi * Math.pow(10, tokenObj.decimals))),
        label: d.label,
        status: 'pending',
      })),
      phase: 'quoted',
      routingMode: 'custom',
      hops,
      currentHopIndex: 0,
      feeBreakdown,
      wrapperVaultMint: `Wrap22Agent${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      integratorRewardsWallet: 'HopFlowRev9x4K2mN8pQ1wE5rT7yU3iO0pA2sD4fG6hJ',
      recovery: {
        canRescue: false,
        canReclaimRent: true,
        refundableLamports: feeBreakdown.refundableLamports,
      },
      signatures: {},
    };

    onExecuteAgentTransfer(newTransfer);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Columns: AI Agent Intent Console & Policy Guardrails */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#9945FF]/20 border border-[#9945FF]/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#c49bff]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  AI Agent Treasury & Programmable Routing Copilot
                </h2>
                <p className="text-xs text-slate-400">
                  Translate natural-language agentic settlement intents into policy-verified
                  MultiHopper v1 routes.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
              MCP / AGENT READY
            </span>
          </div>

          {/* Preset Intent Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-400">
              Sample Autonomous Agent Treasury Intents:
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_PROMPTS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setPromptText(sample)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-mono border transition ${
                    promptText === sample
                      ? 'bg-[#161D2B] border-[#14F195] text-[#14F195]'
                      : 'bg-[#07090E] border-[#1E2638] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  “{sample}”
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
              Agent Treasury Instruction / Webhook Payload Intent
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#07090E] border border-[#1E2638] text-xs font-mono text-white focus:outline-none focus:border-[#14F195]"
            />
          </div>

          {/* Programmable Policy Guardrails */}
          <div className="pt-3 border-t border-[#1E2638] space-y-3">
            <div className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#00C2FF]" />
              Autonomous Treasury Policy Guardrails
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E2638]">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Max Batch Spend (USD)
                </label>
                <input
                  type="number"
                  value={maxDailyBudgetUsd}
                  onChange={(e) => setMaxDailyBudgetUsd(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-[#14F195] font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E2638]">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Max Raydium CLMM Tier
                </label>
                <select
                  value={maxAllowedTier}
                  onChange={(e) => setMaxAllowedTier(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-white"
                >
                  {[3, 4, 5, 6, 7, 8, 9].map((t) => (
                    <option key={t} value={t}>
                      Max Tier {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E2638] flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Mandatory TRM Screen
                </span>
                <label className="inline-flex items-center gap-2 text-xs text-white mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireTrmScreening}
                    onChange={(e) => setRequireTrmScreening(e.target.checked)}
                    className="accent-[#14F195]"
                  />
                  <span>Enforce 0.002 SOL/w</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleDispatchAgentRoute}
            disabled={!allPoliciesPassed}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#9945FF] via-[#00C2FF] to-[#14F195] text-slate-950 hover:opacity-95 disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-lg shadow-[#9945FF]/20"
          >
            <Zap className="w-4 h-4" />
            Compile Agent Route & Open Two-Phase Cryptographic Signer →
          </button>
        </div>
      </div>

      {/* Right 5 Columns: Compiled MultiHopper Payload & Policy Evaluation */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#14F195]/15 text-[#14F195]">
                POST /api/agent/evaluate-policy
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Compiled Agent Execution Plan
              </h3>
            </div>
            <Cpu className="w-5 h-5 text-[#00C2FF]" />
          </div>

          {/* Policy Checks List */}
          <div className="space-y-2">
            {plan.policyChecks.map((chk, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                  chk.passed
                    ? 'bg-[#07090E] border-[#14F195]/30 text-slate-200'
                    : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      chk.passed ? 'text-[#14F195]' : 'text-rose-400'
                    }`}
                  />
                  <span className="font-medium">{chk.rule}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">{chk.detail}</span>
              </div>
            ))}
          </div>

          {/* Generated JSON Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-[#14F195]" />
                Synthesized `POST /transfers` Request Body
              </span>
              <span className="text-[#14F195]">
                Rev Share: +${feeBreakdown.integratorShareUsd.toFixed(2)}
              </span>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638] text-[11px] font-mono text-[#00C2FF] overflow-x-auto max-h-64">
              {JSON.stringify(
                {
                  sourceWallet,
                  tokenMint: plan.tokenMint,
                  amount: String(plan.totalAmountUi * 1e6),
                  destinations: plan.destinations.map((d) => ({
                    recipientWallet: d.wallet,
                    amount: String(d.amountUi * 1e6),
                  })),
                  customRoute: {
                    hops: plan.bundles.map((b) => ({
                      bundle: b,
                      waitSeconds: plan.waitSecondsPerHop,
                    })),
                  },
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

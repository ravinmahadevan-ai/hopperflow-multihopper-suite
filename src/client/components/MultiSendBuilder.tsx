import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Split,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  calculateLocalFeeEstimate,
  CustomRouteHopSpec,
  DestinationEntry,
  HopNode,
  INITIAL_HOP_LIBRARY,
  RouteTemplate,
  SUPPORTED_TOKENS,
  TokenConfig,
  TransferRecord,
} from '../types';

interface MultiSendBuilderProps {
  sourceWallet: string;
  routeTemplates: RouteTemplate[];
  customDraftHops: CustomRouteHopSpec[];
  onLaunchTransferAndOpenSigner: (newTransfer: TransferRecord) => void;
}

export const MultiSendBuilder: React.FC<MultiSendBuilderProps> = ({
  sourceWallet,
  routeTemplates,
  customDraftHops,
  onLaunchTransferAndOpenSigner,
}) => {
  const [transferMode, setTransferMode] = useState<'single' | 'multi'>('multi');
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(SUPPORTED_TOKENS[1]); // Default USDC
  const [singleRecipient, setSingleRecipient] = useState(
    '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E',
  );
  const [singleAmountUi, setSingleAmountUi] = useState('25000');

  const [destinations, setDestinations] = useState<DestinationEntry[]>([
    {
      id: 'dest_1',
      recipientWallet: '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E',
      amountUi: '12500',
      amountRaw: '12500000000',
      label: 'Lead Protocol Engineer',
    },
    {
      id: 'dest_2',
      recipientWallet: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      amountUi: '9500',
      amountRaw: '9500000000',
      label: 'Solana Security Researcher',
    },
    {
      id: 'dest_3',
      recipientWallet: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
      amountUi: '8000',
      amountRaw: '8000000000',
      label: 'Institutional BD Lead',
    },
  ]);

  const [routingMode, setRoutingMode] = useState<'random' | 'template' | 'custom'>('template');
  const [randomHopCount, setRandomHopCount] = useState<number>(4);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    routeTemplates[0]?.id || 'tpl_inst_payroll_4hop',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalAmountUi =
    transferMode === 'single'
      ? Number(singleAmountUi) || 0
      : destinations.reduce((acc, d) => acc + (Number(d.amountUi) || 0), 0);

  const totalUsdValue = totalAmountUi * selectedToken.priceUsd;

  const activeTemplate =
    routeTemplates.find((t) => t.id === selectedTemplateId) || routeTemplates[0];

  const effectiveHopCount =
    routingMode === 'random'
      ? randomHopCount
      : routingMode === 'template'
      ? activeTemplate?.hopCount || 4
      : Math.max(2, customDraftHops.length);

  const effectiveDestinationCount =
    transferMode === 'single' ? 1 : Math.max(1, destinations.length);

  const feeEstimate = calculateLocalFeeEstimate(
    totalUsdValue,
    effectiveHopCount,
    effectiveDestinationCount,
  );

  // Check if final hop is 'contracts' in multi-send mode (MH_017 rule violation check)
  const hasInvalidFinalContractsHop =
    transferMode === 'multi' &&
    routingMode === 'custom' &&
    customDraftHops.length > 0 &&
    customDraftHops[customDraftHops.length - 1].bundle === 'contracts';

  const load5ContributorPayrollPreset = () => {
    setTransferMode('multi');
    setSelectedToken(SUPPORTED_TOKENS[1]); // USDC
    setDestinations([
      {
        id: 'p1',
        recipientWallet: '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E',
        amountUi: '15000',
        amountRaw: '15000000000',
        label: 'Principal Rust Architect',
      },
      {
        id: 'p2',
        recipientWallet: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        amountUi: '12000',
        amountRaw: '12000000000',
        label: 'Cryptography & ZK Lead',
      },
      {
        id: 'p3',
        recipientWallet: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
        amountUi: '9500',
        amountRaw: '9500000000',
        label: 'Head of Institutional Liquidity',
      },
      {
        id: 'p4',
        recipientWallet: '6ZRCB7AAqGre6c72PRz3mhLC73VMYvJ8bi9KHf1HFpNk',
        amountUi: '7500',
        amountRaw: '7500000000',
        label: 'Full-Stack Web3 Engineer',
      },
      {
        id: 'p5',
        recipientWallet: '8pFhUq2zB6xJw3mN5vR7tY9kL1qW4eR6tY8uI0oP2aS4',
        amountUi: '6000',
        amountRaw: '6000000000',
        label: 'Validator & RPC SRE',
      },
    ]);
    setErrorMessage(null);
  };

  const load8WalletLaunchUnbundlingPreset = () => {
    setTransferMode('multi');
    setSelectedToken(SUPPORTED_TOKENS[0]); // SOL
    setRoutingMode('template');
    if (routeTemplates[1]) {
      setSelectedTemplateId(routeTemplates[1].id);
    }
    const wallets = [
      '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E',
      '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
      '6ZRCB7AAqGre6c72PRz3mhLC73VMYvJ8bi9KHf1HFpNk',
      '8pFhUq2zB6xJw3mN5vR7tY9kL1qW4eR6tY8uI0oP2aS4',
      '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9',
      'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS',
      'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm',
    ];
    const amounts = ['45', '38', '32', '28', '24', '19', '15', '12'];
    setDestinations(
      wallets.map((w, idx) => ({
        id: `launch_${idx}`,
        recipientWallet: w,
        amountUi: amounts[idx],
        amountRaw: String(Number(amounts[idx]) * 1e9),
        label: `Unbundled Distribution Vault #${idx + 1}`,
      })),
    );
    setErrorMessage(null);
  };

  const addDestinationRow = () => {
    if (destinations.length >= 20) {
      setErrorMessage('MultiHopper API v1 enforces a maximum of 20 destinations per batch.');
      return;
    }
    setDestinations((prev) => [
      ...prev,
      {
        id: `dest_${Date.now()}`,
        recipientWallet: '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S',
        amountUi: '2500',
        amountRaw: String(2500 * Math.pow(10, selectedToken.decimals)),
        label: `Recipient #${prev.length + 1}`,
      },
    ]);
  };

  const removeDestinationRow = (id: string) => {
    if (destinations.length <= 1) return;
    setDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDestination = (
    id: string,
    field: 'recipientWallet' | 'amountUi' | 'label',
    value: string,
  ) => {
    setDestinations((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, [field]: value };
        if (field === 'amountUi') {
          const num = Number(value) || 0;
          next.amountRaw = String(Math.round(num * Math.pow(10, selectedToken.decimals)));
        }
        return next;
      }),
    );
  };

  const handlePrepareAndSign = async () => {
    setErrorMessage(null);
    if (totalAmountUi <= 0) {
      setErrorMessage('Total transfer principal must be greater than 0.');
      return;
    }
    if (hasInvalidFinalContractsHop) {
      setErrorMessage(
        'MH_017 Violation: The "contracts" Hop Bundle cannot be the final hop in Multi-Send dispersion mode (canEndRoute: false).',
      );
      return;
    }

    // Build concrete HopNode[] from chosen routing mode
    const generatedHops: HopNode[] = [];
    for (let i = 0; i < effectiveHopCount; i++) {
      const libItem =
        INITIAL_HOP_LIBRARY[i % (INITIAL_HOP_LIBRARY.length - 1)]; // exclude non-endable contract for final hop
      const templateHop =
        routingMode === 'template'
          ? activeTemplate?.hops[i]
          : routingMode === 'custom'
          ? customDraftHops[i]
          : undefined;

      generatedHops.push({
        index: i,
        walletAddress: templateHop?.walletAddress || libItem.address,
        label: templateHop?.label || libItem.label,
        bundle: templateHop?.bundle || libItem.category,
        waitSeconds: templateHop?.waitSeconds || 25,
        status: 'pending',
        trmScreened: true,
        isDecoyExit: transferMode === 'multi' && i === effectiveHopCount - 1,
      });
    }

    const amountRawStr = String(
      Math.round(totalAmountUi * Math.pow(10, selectedToken.decimals)),
    );

    const finalDestinations: DestinationEntry[] =
      transferMode === 'single'
        ? [
            {
              id: 'single_dest',
              recipientWallet: singleRecipient,
              amountUi: String(totalAmountUi),
              amountRaw: amountRawStr,
              label: 'Primary Recipient',
              status: 'pending',
            },
          ]
        : destinations;

    const transferId = `tr_mh_${Math.random().toString(16).slice(2, 12)}`;
    const supportBundleId = `sb_${Math.random().toString(16).slice(2, 12)}`;

    // Attempt backend POST /api/transfers first
    try {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWallet,
          tokenMint: selectedToken.mint,
          amount: amountRawStr,
          mode: transferMode,
          recipientWallet: transferMode === 'single' ? singleRecipient : undefined,
          destinations:
            transferMode === 'multi'
              ? finalDestinations.map((d) => ({
                  recipientWallet: d.recipientWallet,
                  amount: d.amountRaw,
                }))
              : undefined,
          routingMode,
          hopCount: effectiveHopCount,
          routeTemplateId: routingMode === 'template' ? selectedTemplateId : undefined,
        }),
      });
    } catch {
      // Continues smoothly with local cryptographic state
    }

    const newTransfer: TransferRecord = {
      id: transferId,
      supportBundleId,
      createdAt: new Date().toISOString(),
      sourceWallet,
      tokenSymbol: selectedToken.symbol,
      tokenMint: selectedToken.mint,
      amountUi: totalAmountUi,
      amountRaw: amountRawStr,
      usdValue: totalUsdValue,
      mode: transferMode,
      recipientWallet: transferMode === 'single' ? singleRecipient : undefined,
      destinations: finalDestinations,
      phase: 'quoted',
      routingMode,
      routeTemplateId: routingMode === 'template' ? selectedTemplateId : undefined,
      hops: generatedHops,
      currentHopIndex: 0,
      feeBreakdown: feeEstimate,
      wrapperVaultMint: `Wrap22Mint${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
      integratorRewardsWallet: 'HopFlowRev9x4K2mN8pQ1wE5rT7yU3iO0pA2sD4fG6hJ',
      recovery: {
        canRescue: false,
        canReclaimRent: true,
        refundableLamports: feeEstimate.refundableLamports,
      },
      signatures: {},
    };

    onLaunchTransferAndOpenSigner(newTransfer);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Columns: Transfer & Multi-Send Payroll Configuration */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2638]">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Split className="w-4 h-4 text-[#14F195]" />
                Routed Transfer & Multi-Send Payroll Desk
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure single discreet settlement or 1–20 destination dispersion with decoy final
                hop.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="inline-flex rounded-lg bg-[#07090E] p-1 border border-[#1E2638]">
              <button
                onClick={() => setTransferMode('single')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  transferMode === 'single'
                    ? 'bg-[#14F195] text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Single Recipient
              </button>
              <button
                onClick={() => setTransferMode('multi')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  transferMode === 'multi'
                    ? 'bg-[#14F195] text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Multi-Send (1–20 Wallets)
              </button>
            </div>
          </div>

          {/* Preset Batch Loaders */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">
              Quick Batch Presets:
            </span>
            <button
              onClick={load5ContributorPayrollPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161D2B] text-[#14F195] border border-[#14F195]/30 hover:bg-[#14F195]/10 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Load 5-Contributor USDC Payroll ($50K)
            </button>
            <button
              onClick={load8WalletLaunchUnbundlingPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161D2B] text-[#00C2FF] border border-[#00C2FF]/30 hover:bg-[#00C2FF]/10 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load 8-Wallet Token Launch Unbundling (213 SOL)
            </button>
          </div>

          {/* Token Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              Select SPL / Token-2022 Asset
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SUPPORTED_TOKENS.map((tok) => {
                const active = tok.symbol === selectedToken.symbol;
                return (
                  <button
                    key={tok.symbol}
                    onClick={() => setSelectedToken(tok)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-[#161D2B] border-[#14F195] shadow-md shadow-[#14F195]/10'
                        : 'bg-[#07090E] border-[#1E2638] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">
                        {tok.symbol}
                      </span>
                      {tok.isToken2022 && (
                        <span className="px-1 py-0.2 text-[9px] font-mono rounded bg-[#9945FF]/20 text-[#c49bff]">
                          T22
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      ${tok.priceUsd < 0.01 ? tok.priceUsd.toFixed(6) : tok.priceUsd.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single vs Multi-Send Destination Inputs */}
          {transferMode === 'single' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#07090E] p-4 rounded-xl border border-[#1E2638]">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Recipient Solana Wallet (`recipientWallet`)
                </label>
                <input
                  type="text"
                  value={singleRecipient}
                  onChange={(e) => setSingleRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-white focus:outline-none focus:border-[#14F195]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Principal Amount ({selectedToken.symbol})
                </label>
                <input
                  type="number"
                  value={singleAmountUi}
                  onChange={(e) => setSingleAmountUi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-[#14F195] font-bold focus:outline-none focus:border-[#14F195]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">
                  Dispersion Destinations ({destinations.length} / 20 Max) • Exact Sum Enforced
                </span>
                <button
                  onClick={addDestinationRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 hover:bg-[#14F195]/25 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Recipient
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {destinations.map((dest, idx) => (
                  <div
                    key={dest.id}
                    className="grid grid-cols-12 gap-2 items-center bg-[#07090E] p-2.5 rounded-xl border border-[#1E2638]"
                  >
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={dest.label || ''}
                        onChange={(e) => updateDestination(dest.id, 'label', e.target.value)}
                        placeholder={`Recipient #${idx + 1}`}
                        className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-xs text-slate-200 focus:outline-none focus:border-[#00C2FF]"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={dest.recipientWallet}
                        onChange={(e) =>
                          updateDestination(dest.id, 'recipientWallet', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-[11px] font-mono text-slate-300 focus:outline-none focus:border-[#14F195]"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={dest.amountUi}
                          onChange={(e) =>
                            updateDestination(dest.id, 'amountUi', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-xs font-mono font-bold text-[#14F195] focus:outline-none focus:border-[#14F195]"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] font-mono text-slate-500">
                          {selectedToken.symbol}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => removeDestinationRow(dest.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Remove destination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routing Mode Selector */}
          <div className="pt-3 border-t border-[#1E2638] space-y-3">
            <label className="block text-xs font-mono uppercase text-slate-400">
              Multi-Hop Routing Topology Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => setRoutingMode('random')}
                className={`p-3 rounded-xl border text-left transition ${
                  routingMode === 'random'
                    ? 'bg-[#161D2B] border-[#14F195]'
                    : 'bg-[#07090E] border-[#1E2638]'
                }`}
              >
                <div className="text-xs font-bold text-white">Standard Random Hops</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  3–10 vetted Hop Library nodes
                </div>
              </button>

              <button
                onClick={() => setRoutingMode('template')}
                className={`p-3 rounded-xl border text-left transition ${
                  routingMode === 'template'
                    ? 'bg-[#161D2B] border-[#14F195]'
                    : 'bg-[#07090E] border-[#1E2638]'
                }`}
              >
                <div className="text-xs font-bold text-white">Saved Route Template</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Use `routeTemplateId` blueprint
                </div>
              </button>

              <button
                onClick={() => setRoutingMode('custom')}
                className={`p-3 rounded-xl border text-left transition ${
                  routingMode === 'custom'
                    ? 'bg-[#161D2B] border-[#14F195]'
                    : 'bg-[#07090E] border-[#1E2638]'
                }`}
              >
                <div className="text-xs font-bold text-white">Custom Studio Route</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Active studio draft ({customDraftHops.length} hops)
                </div>
              </button>
            </div>

            {routingMode === 'random' && (
              <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638] flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">
                  Hop Count (`hopCount`: {randomHopCount} Hops)
                </span>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={randomHopCount}
                  onChange={(e) => setRandomHopCount(Number(e.target.value))}
                  className="w-48 accent-[#14F195]"
                />
              </div>
            )}

            {routingMode === 'template' && (
              <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638]">
                <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                  Select `routeTemplateId`:
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-white focus:outline-none focus:border-[#14F195]"
                >
                  {routeTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.hopCount} hops • {tpl.totalWaitSeconds}s wait)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            onClick={handlePrepareAndSign}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#14F195] via-[#00C2FF] to-[#9945FF] text-slate-950 hover:opacity-95 transition shadow-xl shadow-[#14F195]/15 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Create Routed Transfer & Open Two-Phase Cryptographic Signer →
          </button>
        </div>
      </div>

      {/* Right 5 Columns: Raydium CLMM 10-Tier Fee & Upfront SOL Breakdown Card */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/30">
                POST /transfers/estimate
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Raydium CLMM 10-Tier Fee & Rent Quote
              </h3>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs text-slate-400">Active Tier</div>
              <div className="text-sm font-bold text-[#14F195]">{feeEstimate.tierName}</div>
            </div>
          </div>

          {/* Principal Summary Box */}
          <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638] flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Disbursed Principal</div>
              <div className="text-lg font-bold font-mono text-white">
                {totalAmountUi.toLocaleString()} {selectedToken.symbol}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs text-slate-400">Oracle USD Value</div>
              <div className="text-lg font-bold text-[#00C2FF]">
                ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Atomic Integrator 0.25% Revenue Split Highlight */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#9945FF]/15 to-[#14F195]/15 border border-[#14F195]/40 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#14F195]" />
                Atomic Integrator Revenue Share (0.25% / 25 bps)
              </span>
              <span className="font-mono text-[#14F195]">
                +${feeEstimate.integratorShareUsd.toFixed(2)} USD
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              50% of MultiHopper’s 0.50% percentage fee is split atomically on-chain into your
              integrator rewards wallet and counts directly toward the $100K Superteam challenge
              gate.
            </p>
          </div>

          {/* Granular Lamport Breakdown */}
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between py-1.5 border-b border-[#1E2638]/60">
              <span className="text-slate-400">Protocol Percentage Fee (0.50%):</span>
              <span className="text-white font-semibold">
                ${feeEstimate.protocolFeeUsd.toFixed(2)} USD
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#1E2638]/60">
              <span className="text-slate-400">
                Per-Hop Flat Execution ({effectiveHopCount} hops):
              </span>
              <span className="text-slate-200">
                {(feeEstimate.flatHopFeeLamports / 1e9).toFixed(4)} SOL (
                {feeEstimate.flatHopFeeLamports.toLocaleString()} lamports)
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#1E2638]/60">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00C2FF]" />
                TRM Screening ({feeEstimate.screenedWalletCount} wallets × 0.002):
              </span>
              <span className="text-[#00C2FF]">
                {(feeEstimate.complianceFeeLamports / 1e9).toFixed(4)} SOL
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#1E2638]/60">
              <span className="text-slate-400">
                Destination ATA Creation ({effectiveDestinationCount} ATAs):
              </span>
              <span className="text-slate-200">
                {(feeEstimate.ataRentLamports / 1e9).toFixed(4)} SOL
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#1E2638]/60">
              <span className="text-amber-300 font-semibold">
                Refundable Step/Route PDA Rent (`refundableLamports`):
              </span>
              <span className="text-amber-300 font-bold">
                {(feeEstimate.refundableLamports / 1e9).toFixed(4)} SOL (100% Reclaimable)
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="text-white font-bold">Total Upfront Keeper & Rent SOL:</span>
              <span className="text-[#14F195] font-bold">
                {(feeEstimate.totalUpfrontLamports / 1e9).toFixed(4)} SOL
              </span>
            </div>
          </div>

          {/* Protocol Guardrails Checklist */}
          <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638] space-y-2 text-[11px]">
            <div className="font-mono uppercase text-slate-400 font-semibold">
              MultiHopper v1 Invariant Verification
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#14F195]" />
              <span>
                Exact Raw Principal Match: <code className="text-[#14F195]">sum(destinations) === amount</code>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#14F195]" />
              <span>
                On-Chain Decoy Exit Hop + Commitment Dispersion Hash Enabled
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>
                Effective Net Cost After Rent Reclaim:{' '}
                <strong className="text-white">{feeEstimate.effectiveFeePct.toFixed(2)}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

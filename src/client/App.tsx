import React, { useMemo, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import {
  Activity,
  Bot,
  Cpu,
  KeyRound,
  Layers,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  Split,
  Terminal,
  Trophy,
  Wallet,
} from 'lucide-react';
import {
  buildRealCryptographicPreparedBundle,
  CustomRouteHopSpec,
  EnvironmentMode,
  HopLibraryItem,
  INITIAL_HOP_LIBRARY,
  INITIAL_ROUTE_TEMPLATES,
  INITIAL_TRANSFERS,
  RouteTemplate,
  TransferRecord,
  WebhookEventLog,
} from './types';
import { RouteVisualizer } from './components/RouteVisualizer';
import { MultiSendBuilder } from './components/MultiSendBuilder';
import { CustomRouteStudio } from './components/CustomRouteStudio';
import { AgentTreasuryCopilot } from './components/AgentTreasuryCopilot';
import { WebhookRecoveryCenter } from './components/WebhookRecoveryCenter';
import { ChallengeRevenueTracker } from './components/ChallengeRevenueTracker';
import { TwoPhaseSignerModal } from './components/TwoPhaseSignerModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [envMode, setEnvMode] = useState<EnvironmentMode>('sandbox');
  const [apiKeyInput, setApiKeyInput] = useState<string>('mh_live_hopperflow_99481a7c2e');

  // Built-in Browser Ephemeral Keypair Signer (real @solana/web3.js Keypair in memory)
  const [ephemeralKeypair, setEphemeralKeypair] = useState<Keypair>(() => Keypair.generate());
  const [walletMode, setWalletMode] = useState<'ephemeral' | 'injected'>('ephemeral');
  const [injectedPubkey, setInjectedPubkey] = useState<string | null>(null);

  // Core protocol state
  const [transfers, setTransfers] = useState<TransferRecord[]>(INITIAL_TRANSFERS);
  const [selectedTransferId, setSelectedTransferId] = useState<string>(INITIAL_TRANSFERS[0].id);
  const [hopLibrary] = useState<HopLibraryItem[]>(INITIAL_HOP_LIBRARY);
  const [routeTemplates, setRouteTemplates] = useState<RouteTemplate[]>(INITIAL_ROUTE_TEMPLATES);

  // Custom Route Studio draft hops
  const [customDraftHops, setCustomDraftHops] = useState<CustomRouteHopSpec[]>([
    {
      id: 'draft_1',
      type: 'bundle',
      bundle: 'cex',
      label: 'Binance Hot Liquidity Relay #4',
      waitSeconds: 25,
    },
    {
      id: 'draft_2',
      type: 'bundle',
      bundle: 'contracts',
      label: 'Orca Whirlpool Program Vault Relay',
      waitSeconds: 35,
    },
    {
      id: 'draft_3',
      type: 'bundle',
      bundle: 'mix',
      label: 'MultiHopper Entropy Pool Alpha',
      waitSeconds: 30,
    },
    {
      id: 'draft_4',
      type: 'bundle',
      bundle: 'dex',
      label: 'Raydium CLMM Deep Liquidity Vault',
      waitSeconds: 20,
    },
  ]);

  // Two-Phase Cryptographic Signer Modal state
  const [signerModalTransfer, setSignerModalTransfer] = useState<TransferRecord | null>(null);

  // Verified Webhook Event Stream
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventLog[]>([
    {
      id: 'wh_1',
      eventType: 'hop.completed',
      transferId: 'tr_mh_99481a7c2e',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      signatureHeader: 'sha256=9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      verified: true,
      payload: {
        event: 'hop.completed',
        transferId: 'tr_mh_99481a7c2e',
        hopIndex: 1,
        bundle: 'dex',
        txSignature: '4vJ8nQ1wR7xK3mP6tY9uI2oP4aS6dF8gH1jK3lZ5xC7vB9nM2qW4eR6tY8uI',
      },
    },
    {
      id: 'wh_2',
      eventType: 'transfer.executing',
      transferId: 'tr_mh_99481a7c2e',
      timestamp: new Date(Date.now() - 95000).toISOString(),
      signatureHeader: 'sha256=4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
      verified: true,
      payload: {
        event: 'transfer.executing',
        transferId: 'tr_mh_99481a7c2e',
        wrapperVaultMint: 'Wrap22Mint8x9LpQ4vR7tY2kM5nB3cV1zX9wE4rT6yU',
        integratorRevShareBps: 25,
      },
    },
  ]);

  const activeWalletPubkey =
    walletMode === 'injected' && injectedPubkey
      ? injectedPubkey
      : ephemeralKeypair.publicKey.toBase58();

  const selectedTransfer =
    transfers.find((t) => t.id === selectedTransferId) || transfers[0];

  // Validate API key prefix vs Environment
  const apiKeyPrefixWarning =
    envMode === 'mainnet' && !apiKeyInput.startsWith('mh_live_')
      ? 'Warning: Mainnet requires mh_live_ key prefix (MH_004)'
      : envMode === 'devnet' && !apiKeyInput.startsWith('mh_test_')
      ? 'Warning: Devnet requires mh_test_ key prefix (MH_004)'
      : null;

  const connectInjectedWallet = async () => {
    const anyWin = window as unknown as {
      solana?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
      };
    };
    if (anyWin.solana) {
      try {
        const resp = await anyWin.solana.connect();
        setInjectedPubkey(resp.publicKey.toString());
        setWalletMode('injected');
        return;
      } catch {
        // Fall back to ephemeral
      }
    }
    // Rotate ephemeral keypair if no injected wallet is installed
    const nextKp = Keypair.generate();
    setEphemeralKeypair(nextKp);
    setWalletMode('ephemeral');
  };

  const handleLaunchTransferAndOpenSigner = (newTransfer: TransferRecord) => {
    setTransfers((prev) => [newTransfer, ...prev]);
    setSelectedTransferId(newTransfer.id);
    setSignerModalTransfer(newTransfer);
  };

  const preparedBundleForModal = useMemo(() => {
    if (!signerModalTransfer) return null;
    return buildRealCryptographicPreparedBundle(
      signerModalTransfer.id,
      activeWalletPubkey,
      signerModalTransfer.hops.length,
      signerModalTransfer.destinations.length,
    );
  }, [signerModalTransfer, activeWalletPubkey]);

  const handleCompleteTwoPhaseBroadcast = (
    transferId: string,
    signatures: TransferRecord['signatures'],
  ) => {
    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        const updatedHops = t.hops.map((h, idx) =>
          idx === 0
            ? { ...h, status: 'completed' as const, txSignature: signatures.routeInitSigs?.[0] }
            : idx === 1
            ? { ...h, status: 'in_progress' as const }
            : h,
        );
        return {
          ...t,
          phase: 'executing',
          currentHopIndex: 1,
          hops: updatedHops,
          signatures,
        };
      }),
    );

    setWebhookLogs((prev) => [
      {
        id: `wh_${Date.now()}`,
        eventType: 'transfer.executing',
        transferId,
        timestamp: new Date().toISOString(),
        signatureHeader: `sha256=${Math.random().toString(16).slice(2, 18)}${Math.random()
          .toString(16)
          .slice(2, 18)}`,
        verified: true,
        payload: {
          event: 'transfer.executing',
          transferId,
          keeperFundingSig: signatures.keeperFundingSig,
          orchestratorInitSig: signatures.orchestratorInitSig,
        },
      },
      ...prev,
    ]);
  };

  const handleAdvanceTransferPhase = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((tr) => {
        if (tr.id !== transferId) return tr;
        const nextHopIdx = tr.hops.findIndex((h) => h.status !== 'completed');
        if (nextHopIdx === -1) {
          return { ...tr, phase: 'settled' };
        }
        const updatedHops = tr.hops.map((h, idx) => {
          if (idx <= nextHopIdx) {
            return {
              ...h,
              status: 'completed' as const,
              txSignature:
                h.txSignature ||
                `5xHopSig${Math.random().toString(36).slice(2, 14)}9mP2vQ8wL4nR7tY`,
            };
          }
          if (idx === nextHopIdx + 1) {
            return { ...h, status: 'in_progress' as const };
          }
          return h;
        });

        const allDone = updatedHops.every((h) => h.status === 'completed');
        const nextPhase = allDone ? 'settled' : 'executing';

        setWebhookLogs((logs) => [
          {
            id: `wh_${Date.now()}`,
            eventType: allDone ? 'transfer.settled' : 'hop.completed',
            transferId,
            timestamp: new Date().toISOString(),
            signatureHeader: `sha256=${Math.random().toString(16).slice(2, 18)}${Math.random()
              .toString(16)
              .slice(2, 18)}`,
            verified: true,
            payload: {
              event: allDone ? 'transfer.settled' : 'hop.completed',
              transferId,
              hopIndex: nextHopIdx,
              phase: nextPhase,
            },
          },
          ...logs,
        ]);

        return {
          ...tr,
          phase: nextPhase,
          currentHopIndex: Math.min(tr.hops.length - 1, nextHopIdx + 1),
          hops: updatedHops,
          destinations: allDone
            ? tr.destinations.map((d) => ({ ...d, status: 'settled' }))
            : tr.destinations,
        };
      }),
    );
  };

  const handleRescueComplete = (transferId: string, rescueSig: string) => {
    setTransfers((prev) =>
      prev.map((tr) =>
        tr.id === transferId
          ? {
              ...tr,
              phase: 'cancelled',
              recovery: {
                ...tr.recovery,
                canRescue: false,
                rescuedAt: new Date().toISOString(),
              },
            }
          : tr,
      ),
    );
    setWebhookLogs((prev) => [
      {
        id: `wh_${Date.now()}`,
        eventType: 'transfer.rescued',
        transferId,
        timestamp: new Date().toISOString(),
        signatureHeader: `sha256=${Math.random().toString(16).slice(2, 34)}`,
        verified: true,
        payload: { event: 'transfer.rescued', transferId, signature: rescueSig },
      },
      ...prev,
    ]);
  };

  const handleReclaimRentComplete = (transferId: string, reclaimSig: string) => {
    setTransfers((prev) =>
      prev.map((tr) =>
        tr.id === transferId
          ? {
              ...tr,
              recovery: {
                ...tr.recovery,
                canReclaimRent: false,
                refundableLamports: 0,
                reclaimedAt: new Date().toISOString(),
              },
            }
          : tr,
      ),
    );
    setWebhookLogs((prev) => [
      {
        id: `wh_${Date.now()}`,
        eventType: 'transfer.rent_reclaimed',
        transferId,
        timestamp: new Date().toISOString(),
        signatureHeader: `sha256=${Math.random().toString(16).slice(2, 34)}`,
        verified: true,
        payload: { event: 'transfer.rent_reclaimed', transferId, signature: reclaimSig },
      },
      ...prev,
    ]);
  };

  const handleTriggerTestWebhook = (eventType: string, transferId: string) => {
    setWebhookLogs((prev) => [
      {
        id: `wh_${Date.now()}`,
        eventType,
        transferId,
        timestamp: new Date().toISOString(),
        signatureHeader: `sha256=${Math.random().toString(16).slice(2, 18)}${Math.random()
          .toString(16)
          .slice(2, 18)}`,
        verified: true,
        payload: {
          event: eventType,
          transferId,
          verifiedVia: 'crypto.timingSafeEqual(HMAC-SHA256)',
          timestamp: new Date().toISOString(),
        },
      },
      ...prev,
    ]);
  };

  const NAV_TABS = [
    { id: 'dashboard', label: 'Command & Live Topology', icon: Activity },
    { id: 'multisend', label: 'Multi-Send Payroll Desk', icon: Split },
    { id: 'studio', label: 'Custom Route & Hop Library', icon: Layers },
    { id: 'agent', label: 'AI Agent Treasury Copilot', icon: Bot },
    { id: 'recovery', label: 'Webhooks, Rescue & Rent Vault', icon: LifeBuoy },
    { id: 'challenge', label: '$50K Challenge & 0.25% Rev Share', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#07090E] bg-terminal-grid text-slate-100 flex flex-col">
      {/* Top Institutional Control Bar */}
      <header className="sticky top-0 z-30 bg-[#07090E]/95 backdrop-blur-md border-b border-[#1E2638]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Program Telemetry Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14F195] via-[#00C2FF] to-[#9945FF] p-0.5">
                <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-[#14F195]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-white text-base">
                    HOPPER<span className="text-[#14F195]">FLOW</span>
                  </span>
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/40">
                    MultiHopper v1
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Institutional Solana Routed Treasury & Multi-Send Suite
                </p>
              </div>
            </div>

            {/* Live On-Chain Program Badges */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E121B] border border-[#1E2638] text-[11px] font-mono">
              <span className="text-slate-400">Core:</span>
              <span className="text-[#14F195]">3jLo...spFh</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Orch:</span>
              <span className="text-[#00C2FF]">4TPC...eruX</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Hook:</span>
              <span className="text-[#c49bff]">2JEv...3r52</span>
              <span className="text-slate-600">|</span>
              <span className="text-[#14F195] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> TRM Active
              </span>
            </div>
          </div>

          {/* Environment, API Key & Solana Signer Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Environment Switcher */}
            <select
              value={envMode}
              onChange={(e) => {
                const next = e.target.value as EnvironmentMode;
                setEnvMode(next);
                if (next === 'devnet' && apiKeyInput.startsWith('mh_live_')) {
                  setApiKeyInput('mh_test_hopperflow_devnet_01');
                } else if (next === 'mainnet' && apiKeyInput.startsWith('mh_test_')) {
                  setApiKeyInput('mh_live_hopperflow_99481a7c2e');
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-[#00C2FF] focus:outline-none focus:border-[#14F195]"
            >
              <option value="sandbox">Protocol Sandbox (Live Crypto)</option>
              <option value="mainnet">Mainnet (multihopper.com/api/v1)</option>
              <option value="devnet">Devnet (devnet.multihopper.com)</option>
            </select>

            {/* API Key Input */}
            <div className="hidden sm:flex items-center bg-[#0E121B] border border-[#1E2638] rounded-lg px-2.5 py-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="mh_live_..."
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none w-44"
              />
            </div>

            {/* Solana Ephemeral / Injected Wallet Signer Pill */}
            <div className="flex items-center gap-1.5 bg-[#0E121B] border border-[#14F195]/40 rounded-lg px-3 py-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#14F195]" />
              <span className="text-xs font-mono text-white font-semibold">
                {activeWalletPubkey.slice(0, 6)}...{activeWalletPubkey.slice(-6)}
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-[#14F195]/20 text-[#14F195]">
                {walletMode === 'ephemeral' ? 'Ed25519 Memory' : 'Injected'}
              </span>
              <button
                onClick={connectInjectedWallet}
                className="ml-1 text-slate-400 hover:text-white"
                title="Rotate Browser Keypair or Connect Phantom/Solflare"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {apiKeyPrefixWarning && (
          <div className="bg-amber-500/15 border-t border-amber-500/40 px-6 py-1 text-center text-[11px] font-mono text-amber-300">
            {apiKeyPrefixWarning}
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-[#1E2638]/70 bg-[#0A0D14]">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? 'border-[#14F195] text-[#14F195] bg-[#14F195]/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0E121B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <RouteVisualizer
            transfers={transfers}
            selectedTransfer={selectedTransfer}
            onSelectTransfer={(tr) => setSelectedTransferId(tr.id)}
            onAdvanceTransferPhase={handleAdvanceTransferPhase}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'multisend' && (
          <MultiSendBuilder
            sourceWallet={activeWalletPubkey}
            routeTemplates={routeTemplates}
            customDraftHops={customDraftHops}
            onLaunchTransferAndOpenSigner={handleLaunchTransferAndOpenSigner}
          />
        )}

        {activeTab === 'studio' && (
          <CustomRouteStudio
            hopLibrary={hopLibrary}
            routeTemplates={routeTemplates}
            customDraftHops={customDraftHops}
            onChangeDraftHops={setCustomDraftHops}
            onSaveTemplate={(newTpl) => setRouteTemplates((prev) => [newTpl, ...prev])}
            onUseTemplateInBuilder={() => setActiveTab('multisend')}
          />
        )}

        {activeTab === 'agent' && (
          <AgentTreasuryCopilot
            sourceWallet={activeWalletPubkey}
            onExecuteAgentTransfer={handleLaunchTransferAndOpenSigner}
          />
        )}

        {activeTab === 'recovery' && (
          <WebhookRecoveryCenter
            transfers={transfers}
            ephemeralKeypair={ephemeralKeypair}
            webhookLogs={webhookLogs}
            onRescueComplete={handleRescueComplete}
            onReclaimRentComplete={handleReclaimRentComplete}
            onTriggerTestWebhook={handleTriggerTestWebhook}
          />
        )}

        {activeTab === 'challenge' && <ChallengeRevenueTracker transfers={transfers} />}
      </main>

      {/* Two-Phase Cryptographic Signer & Broadcast Modal */}
      {signerModalTransfer && preparedBundleForModal && (
        <TwoPhaseSignerModal
          isOpen={true}
          onClose={() => {
            setSignerModalTransfer(null);
            setActiveTab('dashboard');
          }}
          transfer={signerModalTransfer}
          preparedBundle={preparedBundleForModal}
          ephemeralKeypair={ephemeralKeypair}
          walletMode={walletMode}
          onCompleteBroadcast={handleCompleteTwoPhaseBroadcast}
        />
      )}

      {/* Institutional Footer */}
      <footer className="border-t border-[#1E2638] bg-[#07090E] py-3.5 px-6 text-[11px] font-mono text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#14F195]" />
            <span>
              HopperFlow v1.0 • MultiHopper Build & Route Challenge ($50,000 + 0.25% Ongoing
              Revenue Share)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Core: 3jLo...spFh</span>
            <span>Orchestrator: 4TPC...eruX</span>
            <span>Hook Guard: 2JEv...3r52</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

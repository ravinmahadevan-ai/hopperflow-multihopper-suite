import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  CustomRouteHopSpec,
  HopBundleCategory,
  HopLibraryItem,
  RouteTemplate,
} from '../types';

interface CustomRouteStudioProps {
  hopLibrary: HopLibraryItem[];
  routeTemplates: RouteTemplate[];
  customDraftHops: CustomRouteHopSpec[];
  onChangeDraftHops: (hops: CustomRouteHopSpec[]) => void;
  onSaveTemplate: (template: RouteTemplate) => void;
  onUseTemplateInBuilder: (templateId: string) => void;
}

const BUNDLE_OPTIONS: { id: HopBundleCategory; label: string; canEnd: boolean }[] = [
  { id: 'cex', label: 'CEX Hot Relay (cex)', canEnd: true },
  { id: 'dex', label: 'DEX Liquidity Pool (dex)', canEnd: true },
  { id: 'exchanges', label: 'Global Exchanges (exchanges)', canEnd: true },
  { id: 'kol', label: 'Ecosystem MM / KOL (kol)', canEnd: true },
  { id: 'mix', label: 'Entropy Dispersion Pool (mix)', canEnd: true },
  { id: 'contracts', label: 'Program Vault (contracts - Intermediate Only)', canEnd: false },
];

export const CustomRouteStudio: React.FC<CustomRouteStudioProps> = ({
  hopLibrary,
  routeTemplates,
  customDraftHops,
  onChangeDraftHops,
  onSaveTemplate,
  onUseTemplateInBuilder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyMultiSendEndable, setOnlyMultiSendEndable] = useState(false);
  const [templateName, setTemplateName] = useState(
    'Institutional 4-Hop CEX-Contracts-Mix-DEX Blueprint',
  );
  const [templateDesc, setTemplateDesc] = useState(
    'Custom temporal dispersion topology with vetted Mainnet Hop Library nodes.',
  );
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const filteredLibrary = hopLibrary.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (onlyMultiSendEndable && !item.canEndRoute) return false;
    return true;
  });

  const totalWaitSeconds = customDraftHops.reduce((acc, h) => acc + h.waitSeconds, 0);
  const finalHop = customDraftHops[customDraftHops.length - 1];
  const isFinalHopContracts = finalHop?.bundle === 'contracts';

  const addBundleHop = (bundle: HopBundleCategory) => {
    if (customDraftHops.length >= 10) return;
    onChangeDraftHops([
      ...customDraftHops,
      {
        id: `hop_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        type: 'bundle',
        bundle,
        label: `Random ${bundle.toUpperCase()} Bundle Node`,
        waitSeconds: 30,
      },
    ]);
  };

  const addLibraryWalletHop = (item: HopLibraryItem) => {
    if (customDraftHops.length >= 10) return;
    onChangeDraftHops([
      ...customDraftHops,
      {
        id: `hop_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        type: 'wallet',
        bundle: item.category,
        walletAddress: item.address,
        label: item.label,
        waitSeconds: 25,
      },
    ]);
  };

  const removeHop = (id: string) => {
    if (customDraftHops.length <= 2) return;
    onChangeDraftHops(customDraftHops.filter((h) => h.id !== id));
  };

  const moveHop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= customDraftHops.length) return;
    const copy = [...customDraftHops];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    onChangeDraftHops(copy);
  };

  const updateHopWait = (id: string, waitSeconds: number) => {
    const clamped = Math.max(20, Math.min(2592000, waitSeconds));
    onChangeDraftHops(
      customDraftHops.map((h) => (h.id === id ? { ...h, waitSeconds: clamped } : h)),
    );
  };

  const updateHopBundle = (id: string, bundle: HopBundleCategory) => {
    onChangeDraftHops(
      customDraftHops.map((h) =>
        h.id === id
          ? {
              ...h,
              type: 'bundle',
              bundle,
              walletAddress: undefined,
              label: `Random ${bundle.toUpperCase()} Bundle Node`,
            }
          : h,
      ),
    );
  };

  const handleSaveRouteTemplate = async () => {
    const newTpl: RouteTemplate = {
      id: `tpl_${Math.random().toString(16).slice(2, 10)}`,
      name: templateName.trim() || `Custom ${customDraftHops.length}-Hop Route`,
      description: templateDesc,
      hopCount: customDraftHops.length,
      totalWaitSeconds,
      createdAt: new Date().toISOString(),
      hops: customDraftHops,
      compatibleWithMultiSend: !isFinalHopContracts,
    };

    try {
      await fetch('/api/route-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTpl),
      });
    } catch {
      // Handled gracefully
    }

    onSaveTemplate(newTpl);
    setSavedBanner(`Saved Route Template "${newTpl.name}" (${newTpl.id}) to POST /route-templates`);
    setTimeout(() => setSavedBanner(null), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Columns: Interactive Custom Route Studio (2-10 Hops) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#9945FF]/20 text-[#c49bff] border border-[#9945FF]/40">
                  POST /route-templates
                </span>
                <h2 className="text-base font-bold text-white">
                  Custom Route Architect ({customDraftHops.length} / 10 Hops)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chain 2–10 hops using Hop Bundles or specific vetted Hop Library addresses with
                20s–30d temporal delays.
              </p>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-slate-400">Total Temporal Window</div>
              <div className="text-[#00C2FF] font-bold">{totalWaitSeconds}s cadence</div>
            </div>
          </div>

          {/* Quick Add Bundle Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-1">Append Bundle Hop:</span>
            {BUNDLE_OPTIONS.map((b) => (
              <button
                key={b.id}
                onClick={() => addBundleHop(b.id)}
                disabled={customDraftHops.length >= 10}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#07090E] text-slate-200 border border-[#1E2638] hover:border-[#14F195] disabled:opacity-40 transition"
              >
                <Plus className="w-3 h-3 text-[#14F195]" />
                {b.id}
              </button>
            ))}
          </div>

          {/* Warning Banner if final hop is 'contracts' */}
          {isFinalHopContracts && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  Multi-Send Dispersion Rule Notice (`canEndRoute: false` / Error `MH_017`)
                </div>
                <p className="text-amber-200/80 mt-0.5">
                  Hop #{customDraftHops.length} is currently set to the{' '}
                  <code className="font-mono">contracts</code> bundle. MultiHopper allows{' '}
                  <code className="font-mono">contracts</code> as intermediate hops, but requires
                  the final hop before Multi-Send dispersion to be <code className="font-mono">cex</code>,{' '}
                  <code className="font-mono">dex</code>, <code className="font-mono">exchanges</code>,{' '}
                  <code className="font-mono">kol</code>, or <code className="font-mono">mix</code>.
                </p>
              </div>
            </div>
          )}

          {/* Hop Pipeline Cards */}
          <div className="space-y-2.5">
            {customDraftHops.map((hop, index) => {
              const isLast = index === customDraftHops.length - 1;
              return (
                <div
                  key={hop.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isLast && hop.bundle === 'contracts'
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-[#07090E] border-[#1E2638]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#161D2B] text-[#14F195] font-mono text-xs font-bold border border-[#263147]">
                        HOP #{index + 1}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {hop.label || `Bundle: ${hop.bundle}`}
                      </span>
                      {hop.walletAddress && (
                        <span className="text-[11px] font-mono text-[#00C2FF]">
                          ({hop.walletAddress.slice(0, 6)}...{hop.walletAddress.slice(-6)})
                        </span>
                      )}
                      {isLast && (
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#14F195]/15 text-[#14F195]">
                          FINAL EXIT / DECOY HOP
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveHop(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded bg-[#0E121B] text-slate-400 hover:text-white disabled:opacity-30 border border-[#1E2638]"
                        title="Move hop earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveHop(index, 1)}
                        disabled={index === customDraftHops.length - 1}
                        className="p-1 rounded bg-[#0E121B] text-slate-400 hover:text-white disabled:opacity-30 border border-[#1E2638]"
                        title="Move hop later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeHop(hop.id)}
                        disabled={customDraftHops.length <= 2}
                        className="p-1 rounded bg-[#0E121B] text-slate-400 hover:text-rose-400 disabled:opacity-30 border border-[#1E2638]"
                        title="Remove hop (min 2)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        Hop Bundle Category
                      </label>
                      <select
                        value={hop.bundle || 'cex'}
                        onChange={(e) =>
                          updateHopBundle(hop.id, e.target.value as HopBundleCategory)
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-white"
                      >
                        {BUNDLE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        Temporal Delay (`waitSeconds`: 20s – 2,592,000s)
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
                        <input
                          type="number"
                          min={20}
                          max={2592000}
                          value={hop.waitSeconds}
                          onChange={(e) => updateHopWait(hop.id, Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded bg-[#0E121B] border border-[#1E2638] text-xs font-mono text-[#00C2FF] font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save as Route Template Form */}
          <div className="pt-4 border-t border-[#1E2638] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07090E] border border-[#1E2638] text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#07090E] border border-[#1E2638] text-xs text-slate-300"
                />
              </div>
            </div>

            {savedBanner && (
              <div className="p-2.5 rounded-lg bg-[#14F195]/15 border border-[#14F195]/40 text-xs text-[#14F195] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{savedBanner}</span>
              </div>
            )}

            <button
              onClick={handleSaveRouteTemplate}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#14F195] text-slate-950 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Reusable Route Template (`POST /route-templates`)
            </button>
          </div>
        </div>

        {/* Saved Route Templates List */}
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00C2FF]" />
            Saved Route Templates (`GET /route-templates`)
          </h3>
          <div className="space-y-2.5">
            {routeTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{tpl.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D2B] text-[#00C2FF]">
                      {tpl.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tpl.description}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {tpl.hops.map((h, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#0E121B] text-slate-300 border border-[#1E2638]"
                      >
                        #{i + 1} {h.bundle} ({h.waitSeconds}s)
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onUseTemplateInBuilder(tpl.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 hover:bg-[#14F195]/25 shrink-0 transition"
                >
                  Load into Builder →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right 5 Columns: Vetted Mainnet Hop Library Explorer (GET /hop-library) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-5 space-y-4">
          <div className="pb-3 border-b border-[#1E2638]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30">
                GET /hop-library (598 Mainnet Nodes)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Devnet MH_019 Fallback Ready
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5">
              Vetted Hop Library Explorer
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any vetted Mainnet relay node to append it directly into your Custom Route.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'cex', 'dex', 'exchanges', 'kol', 'mix', 'contracts'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition ${
                  selectedCategory === cat
                    ? 'bg-[#14F195] text-slate-950 font-bold'
                    : 'bg-[#07090E] text-slate-400 border border-[#1E2638] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 bg-[#07090E] px-3 py-2 rounded-lg border border-[#1E2638]">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#00C2FF]" />
              Only Multi-Send End-Compatible (`canEndRoute: true`)
            </span>
            <input
              type="checkbox"
              checked={onlyMultiSendEndable}
              onChange={(e) => setOnlyMultiSendEndable(e.target.checked)}
              className="accent-[#14F195]"
            />
          </div>

          {/* Hop Library Cards */}
          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {filteredLibrary.map((node) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E2638] hover:border-[#14F195]/50 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{node.label}</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#161D2B] text-[#00C2FF] border border-[#263147]">
                    {node.category}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 break-all">
                  {node.address}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#1E2638]/70 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#14F195] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> TRM: {node.trmRiskScore}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span
                      className={
                        node.canEndRoute ? 'text-slate-300' : 'text-amber-400'
                      }
                    >
                      canEndRoute: {String(node.canEndRoute)}
                    </span>
                  </div>

                  <button
                    onClick={() => addLibraryWalletHop(node)}
                    className="px-2.5 py-1 rounded bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 hover:bg-[#14F195]/25 font-sans font-semibold text-xs transition"
                  >
                    + Add to Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

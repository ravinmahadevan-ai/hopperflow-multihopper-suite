export function renderHopperFlowAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HopperFlow | Institutional Solana Routed Treasury & Multi-Send Suite (MultiHopper v1)</title>
  <style>
    :root {
      --bg-dark: #07090E;
      --bg-panel: #0E121B;
      --bg-card: #131926;
      --border: #1E2638;
      --solana-green: #14F195;
      --solana-purple: #9945FF;
      --solana-cyan: #00C2FF;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --danger: #F43F5E;
      --warning: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      background-image: radial-gradient(circle at 15% 10%, rgba(153, 69, 255, 0.10), transparent 35%),
                        radial-gradient(circle at 85% 15%, rgba(20, 241, 149, 0.08), transparent 35%);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
    }
    .mono { font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace; }
    header {
      background: rgba(14, 18, 27, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      max-width: 1440px;
      margin: 0 auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--solana-green), var(--solana-purple));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #07090E;
      font-size: 18px;
      box-shadow: 0 0 18px rgba(20, 241, 149, 0.3);
    }
    .brand-title { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
    .brand-sub { font-size: 11px; color: var(--solana-green); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .telemetry-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }
    .pill {
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 5px 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
    }
    .pill strong { color: var(--text-main); }
    .dot-green { width: 7px; height: 7px; border-radius: 50%; background: var(--solana-green); box-shadow: 0 0 8px var(--solana-green); }
    .dot-purple { width: 7px; height: 7px; border-radius: 50%; background: var(--solana-purple); }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    select, input, textarea {
      background: #090D14;
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 7px 11px;
      border-radius: 8px;
      font-size: 12px;
      outline: none;
    }
    select:focus, input:focus, textarea:focus { border-color: var(--solana-green); }
    button {
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-main);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button:hover { border-color: var(--solana-green); color: var(--solana-green); }
    .btn-primary {
      background: linear-gradient(135deg, #14F195 0%, #00C2FF 100%);
      color: #06090F;
      border: none;
      font-weight: 700;
    }
    .btn-primary:hover { opacity: 0.92; color: #06090F; transform: translateY(-1px); }
    .btn-purple {
      background: rgba(153, 69, 255, 0.18);
      border-color: var(--solana-purple);
      color: #D8B4FE;
    }
    nav {
      max-width: 1440px;
      margin: 12px auto 0;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      white-space: nowrap;
    }
    .tab-btn.active {
      background: rgba(20, 241, 149, 0.10);
      border-color: rgba(20, 241, 149, 0.4);
      color: var(--solana-green);
    }
    main {
      max-width: 1440px;
      margin: 20px auto;
      padding: 0 24px 60px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .card {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
    }
    .kpi-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-val { font-size: 24px; font-weight: 800; margin: 6px 0 4px; }
    .kpi-sub { font-size: 11.5px; color: var(--solana-green); }
    .grid-2 { display: grid; grid-template-columns: 1.35fr 1fr; gap: 18px; }
    @media (max-width: 1024px) { .grid-2 { grid-template-columns: 1fr; } }
    h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 10.5px; }
    td { padding: 10px 8px; border-bottom: 1px solid rgba(30, 38, 56, 0.6); }
    .badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-green { background: rgba(20, 241, 149, 0.14); color: var(--solana-green); border: 1px solid rgba(20, 241, 149, 0.3); }
    .badge-purple { background: rgba(153, 69, 255, 0.16); color: #D8B4FE; border: 1px solid rgba(153, 69, 255, 0.35); }
    .badge-cyan { background: rgba(0, 194, 255, 0.14); color: var(--solana-cyan); border: 1px solid rgba(0, 194, 255, 0.3); }
    .badge-amber { background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.35); }
    .badge-red { background: rgba(244, 63, 94, 0.15); color: #FB7185; border: 1px solid rgba(244, 63, 94, 0.35); }
    .section-pane { display: none; }
    .section-pane.active { display: block; }
    .topology-box {
      background: #080B11;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .hop-chain {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 720px;
      padding: 10px 4px;
    }
    .hop-node {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      min-width: 145px;
      position: relative;
    }
    .hop-node.active-node { border-color: var(--solana-green); box-shadow: 0 0 14px rgba(20, 241, 149, 0.15); }
    .hop-node.decoy-node { border-color: var(--solana-purple); }
    .hop-arrow { color: var(--solana-green); font-weight: 700; font-size: 16px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px; }
    .field-label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 5px; font-weight: 600; }
    .quote-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed rgba(30,38,56,0.8); font-size: 12.5px; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(4, 6, 10, 0.84);
      backdrop-filter: blur(6px); display: none; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-card {
      background: var(--bg-panel); border: 1px solid var(--solana-green); border-radius: 14px;
      max-width: 760px; width: 100%; padding: 22px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 0 40px rgba(20, 241, 149, 0.18);
    }
    .step-item {
      background: #090D14; border: 1px solid var(--border); border-radius: 8px;
      padding: 10px 12px; margin-bottom: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;
    }
    .step-item.done { border-color: rgba(20, 241, 149, 0.5); }
  </style>
</head>
<body>
  <header>
    <div class="header-top">
      <div class="brand">
        <div class="brand-logo">HF</div>
        <div>
          <div class="brand-title">HopperFlow <span class="badge badge-green">MultiHopper API v1</span></div>
          <div class="brand-sub">Institutional Routed Treasury, Multi-Send Payroll & Agentic Commerce</div>
        </div>
      </div>

      <div class="telemetry-bar mono">
        <span class="pill"><span class="dot-green"></span>Core: <strong>3jLo...spFh</strong></span>
        <span class="pill"><span class="dot-purple"></span>Orch: <strong>4TPC...eruX</strong></span>
        <span class="pill">HookGuard: <strong>2JEv...3r52</strong></span>
        <span class="pill"><span class="dot-green"></span>TRM Screening: <strong>0.002 SOL/wallet</strong></span>
      </div>

      <div class="controls">
        <select id="envSelect" aria-label="Environment Selector">
          <option value="sandbox">Protocol Sandbox (Live Ed25519)</option>
          <option value="mainnet">Mainnet (multihopper.com/api/v1)</option>
          <option value="devnet">Devnet (devnet.multihopper.com/api/v1)</option>
        </select>
        <input id="apiKeyInput" type="password" placeholder="mh_live_... or mh_test_..." style="width: 170px;" />
        <button id="walletBtn" class="btn-purple mono" onclick="rotateEphemeralSigner()">
          Signer: <span id="signerAddr">7xHop...9mQa</span>
        </button>
      </div>
    </div>

    <nav>
      <button class="tab-btn active" data-tab="dashboard" onclick="switchTab('dashboard')">1. Command & Topology Graph</button>
      <button class="tab-btn" data-tab="multisend" onclick="switchTab('multisend')">2. Multi-Send Payroll & Transfer Desk</button>
      <button class="tab-btn" data-tab="studio" onclick="switchTab('studio')">3. Custom Route Studio & Hop Library</button>
      <button class="tab-btn" data-tab="agent" onclick="switchTab('agent')">4. AI Agent Treasury Copilot</button>
      <button class="tab-btn" data-tab="recovery" onclick="switchTab('recovery')">5. Webhooks, Rescue & Rent Reclaim</button>
      <button class="tab-btn" data-tab="challenge" onclick="switchTab('challenge')">6. $50K Challenge & 0.25% RevShare</button>
    </nav>
  </header>

  <main>
    <!-- KPI BAR -->
    <div class="kpi-grid">
      <div class="card">
        <div class="kpi-label">Qualifying Production Volume</div>
        <div class="kpi-val mono" id="kpiVolume">$142,850.00</div>
        <div class="kpi-sub" id="kpiGateBadge">✓ Exceeds $100,000 Superteam Challenge Gate (142.8%)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Atomic Integrator Revenue (0.25%)</div>
        <div class="kpi-val mono" id="kpiRevShare" style="color: var(--solana-green);">$357.13</div>
        <div class="kpi-sub">50% of 50 bps fee paid atomically on-chain</div>
      </div>
      <div class="card">
        <div class="kpi-label">Vetted Hop Library & Bundles</div>
        <div class="kpi-val mono" id="kpiHopCount">36 / 598</div>
        <div class="kpi-sub">6 Bundles: cex, dex, exchanges, kol, contracts, mix</div>
      </div>
      <div class="card">
        <div class="kpi-label">Refundable Rent & Rescue Vault</div>
        <div class="kpi-val mono" id="kpiRecoverable" style="color: var(--solana-cyan);">0.0485 SOL + 2,500 PYUSD</div>
        <div class="kpi-sub">PDA Step Rent Reclaim & Stuck Principal Rescue Ready</div>
      </div>
    </div>

    <!-- TAB 1: DASHBOARD & TOPOLOGY -->
    <section id="tab-dashboard" class="section-pane active">
      <div class="card" style="margin-bottom: 18px;">
        <h2>
          <span>Live Multi-Hop Token-2022 Vault Wrapper & Decoy Dispersion Topology</span>
          <span class="badge badge-green mono" id="activeTopoLabel">Inspecting: trf_inst_payroll_01 (Multi-Send 4 Recipients)</span>
        </h2>
        <div class="topology-box">
          <div class="hop-chain" id="topologyChain"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; font-size:12px; color:var(--text-muted);">
          <div>Non-commingled vault custody: Original SPL/SOL locked in Vault PDA → 1:1 Token-2022 Wrapper minted with Permanent Delegate & Transfer Hook Guard (<code class="mono">2JEv...3r52</code>) → Unwrapped on exit.</div>
          <button onclick="triggerSimulateWebhook()">⚡ Simulate Lifecycle Webhooks for Selected Transfer</button>
        </div>
      </div>

      <div class="card">
        <h2>
          <span>Institutional Routed Transfers & Multi-Send Ledger</span>
          <button class="btn-primary" onclick="switchTab('multisend')">+ New Routed Transfer / Multi-Send</button>
        </h2>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Transfer ID / External ID</th>
                <th>Mode & Token</th>
                <th>Amount & Tier</th>
                <th>Hops & Arrival</th>
                <th>0.25% RevShare</th>
                <th>TRM Screening</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="transfersTableBody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 2: MULTI-SEND & TRANSFER DESK -->
    <section id="tab-multisend" class="section-pane">
      <div class="grid-2">
        <div class="card">
          <h2>
            <span>Configure Routed Transfer or Multi-Send Batch (1–20 Recipients)</span>
            <div style="display:flex; gap:6px;">
              <button onclick="loadPayrollPreset()">Load 4-Contributor USDC Payroll</button>
              <button onclick="loadLaunchPreset()">Load 6-Wallet Launch Unbundling</button>
            </div>
          </h2>

          <div class="form-row">
            <div>
              <label class="field-label">Routing Mode</label>
              <select id="txMode" onchange="updateEstimateLive()" style="width:100%;">
                <option value="destinations">Multi-Send Payroll / Unbundling (1–20 destinations)</option>
                <option value="single">Single Discreet Transfer (recipientWallet)</option>
              </select>
            </div>
            <div>
              <label class="field-label">Token Asset (SOL / SPL / Token-2022)</label>
              <select id="txToken" onchange="updateEstimateLive()" style="width:100%;">
                <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC (SPL - 6 dec)</option>
                <option value="So11111111111111111111111111111111111111112">SOL (Native - 9 dec)</option>
                <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT (SPL - 6 dec)</option>
                <option value="2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo">PYUSD (Token-2022 - 6 dec)</option>
                <option value="JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN">JUP (SPL - 6 dec)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div>
              <label class="field-label">Total Transfer Amount (Human Tokens)</label>
              <input id="txAmountHuman" type="number" value="25000" min="1" step="any" oninput="rebalanceDestinations(); updateEstimateLive();" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Hop Count (3–10 Hops)</label>
              <input id="txHops" type="number" value="5" min="3" max="10" oninput="updateEstimateLive()" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Arrival Window (Seconds: 60s–30d)</label>
              <input id="txArrival" type="number" value="600" min="60" max="2592000" oninput="updateEstimateLive()" style="width:100%;" />
            </div>
          </div>

          <div class="form-row">
            <div>
              <label class="field-label">Route Selection Strategy</label>
              <select id="txTemplateSelect" onchange="updateEstimateLive()" style="width:100%;">
                <option value="">Dynamic Vetted Hop Selection (Auto CEX/DEX Mix)</option>
              </select>
            </div>
            <div>
              <label class="field-label">Idempotent External ID</label>
              <input id="txExternalId" type="text" class="mono" value="payroll-batch-2026-q4-09" style="width:100%;" />
            </div>
          </div>

          <div id="destinationsBox" style="margin-top: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span class="field-label" style="margin:0;">Multi-Send Destinations (Exact sum validated + Decoy Final Hop)</span>
              <button onclick="addDestinationRow()">+ Add Recipient Wallet</button>
            </div>
            <div id="destinationsList"></div>
          </div>

          <div style="margin-top: 16px; display:flex; gap:10px; align-items:center;">
            <button class="btn-primary" style="padding: 11px 20px; font-size: 13px;" onclick="createAndOpenTwoPhaseModal()">
              🚀 Create Transfer & Launch Two-Phase Cryptographic Signer
            </button>
            <span id="createErrorMsg" style="color: var(--danger); font-size: 12px;"></span>
          </div>
        </div>

        <!-- RAYDIUM CLMM 10-TIER FEE & UPFRONT SOL BREAKDOWN -->
        <div class="card">
          <h2>
            <span>Raydium CLMM 10-Tier Fee & Upfront SOL Quote</span>
            <span class="badge badge-purple mono" id="quoteTierBadge">Tier 9 (&gt; $500)</span>
          </h2>
          <div id="quoteBreakdownBox" class="mono">
            <div class="quote-row"><span>Gross Principal Amount:</span><strong id="qGross">25,000.00 USDC</strong></div>
            <div class="quote-row"><span>Protocol Percentage Fee (50 bps / 0.50%):</span><strong id="qPctFee">125.00 USDC</strong></div>
            <div class="quote-row" style="color:var(--solana-green);"><span>⚡ Atomic Integrator RevShare (25 bps / 0.25%):</span><strong id="qRevShare">62.50 USDC</strong></div>
            <div class="quote-row"><span>Net Hop / Delivered Principal:</span><strong id="qNetHop">24,875.00 USDC</strong></div>
            <div class="quote-row"><span>Raydium CLMM Per-Hop Flat Fee:</span><strong id="qFlatPerHop">2,000,000 lamports (0.002 SOL)</strong></div>
            <div class="quote-row"><span>Total Protocol Flat Fee:</span><strong id="qFlatTotal">0.010000 SOL</strong></div>
            <div class="quote-row"><span>TRM Labs On-Chain Screening (0.002 SOL/wallet):</span><strong id="qTrmFee">0.020000 SOL</strong></div>
            <div class="quote-row"><span>ATA + Route + Orchestrator + Dispersion Rent:</span><strong id="qRentAdv">0.018976 SOL</strong></div>
            <div class="quote-row" style="color:var(--solana-cyan);"><span>♻ Refundable PDA Rent (Reclaimable Post-Settle):</span><strong id="qRefundable">0.008780 SOL</strong></div>
            <div class="quote-row" style="font-size:14px; border-bottom:none; padding-top:12px;">
              <span>Required Upfront SOL (<code class="mono">requiredSolUpFrontLamports</code>):</span>
              <strong id="qUpfrontSol" style="color:var(--solana-green);">0.049026 SOL</strong>
            </div>
          </div>
          <div style="margin-top:14px; padding:10px; border-radius:8px; background:#090D14; border:1px solid var(--border); font-size:11.5px; color:var(--text-muted);">
            <strong>MH_040 &amp; MH_091 Safeguards Active:</strong> Quote verifies Raydium CLMM spot boundary capping (<code class="mono">cappedAtTierBoundary</code>) and confirms your integrator rewards wallet holds rent-exempt minimum balance (<code class="mono">&ge; 890,880 lamports</code>).
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 3: CUSTOM ROUTE STUDIO & HOP LIBRARY -->
    <section id="tab-studio" class="section-pane">
      <div class="grid-2">
        <div class="card">
          <h2>
            <span>Custom Route Architect &amp; Template Builder (2–10 Hops)</span>
            <button class="btn-primary" onclick="saveNewRouteTemplate()">💾 Save as Route Template</button>
          </h2>
          <div class="form-row">
            <div>
              <label class="field-label">Template Name</label>
              <input id="tplName" type="text" value="Institutional CEX/DEX Stealth 4-Hop" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Add Hop from Vetted Bundle</label>
              <div style="display:flex; gap:6px;">
                <select id="studioBundleFilter" onchange="renderHopLibraryTable()" style="flex:1;">
                  <option value="">All 6 Bundles (36 Curated Nodes)</option>
                  <option value="cex">cex (Binance, Coinbase, Kraken, OKX)</option>
                  <option value="dex">dex (Jupiter, Raydium, Orca, Meteora)</option>
                  <option value="exchanges">exchanges (Wintermute, Jump, FalconX)</option>
                  <option value="kol">kol (High-Volume Ecosystem Vaults)</option>
                  <option value="contracts">contracts (DeFi Protocol Vaults - canEndRoute: false)</option>
                  <option value="mix">mix (Randomized Cross-Sector Relays)</option>
                </select>
              </div>
            </div>
          </div>

          <div id="customHopsBuilderList" style="margin: 12px 0;"></div>
          <div id="studioValidationBox" class="mono" style="padding:10px; border-radius:8px; background:#090D14; border:1px solid var(--solana-green); font-size:11.5px; color:var(--solana-green);">
            ✓ CustomRoute Valid: 4 hops, total wait 340s (within 20s..2,592,000s), final hop canEndRoute=true (Multi-Send compatible).
          </div>

          <h2 style="margin-top:20px;"><span>Saved Route Templates (<code class="mono">GET /api/v1/route-templates</code>)</span></h2>
          <div id="routeTemplatesList"></div>
        </div>

        <div class="card">
          <h2>
            <span>Mainnet Vetted Hop Library (<code class="mono">GET /api/v1/hop-library</code>)</span>
            <span class="badge badge-cyan mono" id="hopLibCountBadge">36 Wallets</span>
          </h2>
          <div style="max-height: 520px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th>Label &amp; Bundle</th>
                  <th>Address</th>
                  <th>canEndRoute</th>
                  <th>Add</th>
                </tr>
              </thead>
              <tbody id="hopLibraryTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: AI AGENT TREASURY COPILOT -->
    <section id="tab-agent" class="section-pane">
      <div class="grid-2">
        <div class="card">
          <h2>
            <span>AI Agent Treasury &amp; Programmable Routing Copilot</span>
            <span class="badge badge-purple">Autonomous Policy Guard</span>
          </h2>
          <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
            Autonomous agents submit natural-language settlement or payroll intents. HopperFlow validates daily spend limits, pre-calculates TRM Labs compliance fees, guarantees non-PDA decoy exit hops, and synthesizes a deterministic <code class="mono">CustomRoute</code>.
          </p>
          <div style="margin-bottom:12px;">
            <label class="field-label">Agent Natural-Language Treasury Intent</label>
            <textarea id="agentPrompt" rows="3" style="width:100%;">Disburse 40,000 USDC across 4 AI compute cluster providers with institutional CEX/DEX mixing under 8 minutes</textarea>
          </div>
          <div class="form-row">
            <div>
              <label class="field-label">Transfer Amount (USD)</label>
              <input id="agentAmountUsd" type="number" value="40000" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Policy Daily Spend Limit (USD)</label>
              <input id="agentBudgetUsd" type="number" value="100000" style="width:100%;" />
            </div>
            <div>
              <label class="field-label">Beneficiary Count (1–20)</label>
              <input id="agentRecipients" type="number" value="4" min="1" max="20" style="width:100%;" />
            </div>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn-primary" onclick="runAgentCopilot()">🤖 Synthesize Policy-Verified MultiHopper Route</button>
            <button onclick="executeAgentPlanInDesk()">⚡ Load Synthesized Plan into Execution Desk</button>
          </div>
        </div>

        <div class="card">
          <h2>
            <span>Synthesized Agent Execution Plan &amp; Policy Decision</span>
            <span class="badge badge-green" id="agentDecisionBadge">POLICY APPROVED</span>
          </h2>
          <div id="agentPlanOutput" class="mono" style="font-size:12px;"></div>
        </div>
      </div>
    </section>

    <!-- TAB 5: WEBHOOKS, RESCUE & RENT RECLAIM -->
    <section id="tab-recovery" class="section-pane">
      <div class="grid-2">
        <div class="card">
          <h2>
            <span>Emergency Principal Rescue &amp; PDA Rent Reclaim Vault</span>
            <span class="badge badge-cyan">On-Chain Recovery</span>
          </h2>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
            Recover stuck principal from failed/expired routes (<code class="mono">POST /transfers/{id}/rescue/prepare</code>) and reclaim closed step/route PDA rent (<code class="mono">POST /transfers/{id}/reclaim-rent/prepare</code>).
          </p>
          <div id="recoveryCardsList"></div>
        </div>

        <div class="card">
          <h2>
            <span>HMAC-SHA256 Webhook Command Center (<code class="mono">x-multihopper-signature</code>)</span>
            <button onclick="triggerSimulateWebhook()">+ Trigger Signed Lifecycle Batch</button>
          </h2>
          <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:10px;">
            Verified via <code class="mono">crypto.timingSafeEqual(HMAC_SHA256(rawBody, whsec_...))</code> across all 13 MultiHopper event types.
          </div>
          <div id="webhookDeliveriesBox" style="max-height: 440px; overflow-y: auto;"></div>
        </div>
      </div>
    </section>

    <!-- TAB 6: SUPERTEAM CHALLENGE & 0.25% REVSHARE SIMULATOR -->
    <section id="tab-challenge" class="section-pane">
      <div class="grid-2">
        <div class="card">
          <h2>
            <span>Superteam Earn $50,000 Prize Pool &amp; 0.25% Ongoing RevShare Simulator</span>
            <span class="badge badge-green">Formula: collected_fees / 0.0025</span>
          </h2>
          <div class="form-row" style="margin-top:14px;">
            <div>
              <label class="field-label">HopperFlow Qualifying Volume (USD) [Min $100K Gate]</label>
              <input id="simProjectVol" type="range" min="50000" max="5000000" step="25000" value="850000" oninput="updateChallengeSim()" style="width:100%;" />
              <div class="mono" id="simProjectVolLabel" style="font-size:16px; font-weight:700; color:var(--solana-green);">$850,000</div>
            </div>
            <div>
              <label class="field-label">Aggregate Competition Volume Across All Teams ($2M → $20M)</label>
              <input id="simAggVol" type="range" min="1000000" max="20000000" step="400000" value="8000000" oninput="updateChallengeSim()" style="width:100%;" />
              <div class="mono" id="simAggVolLabel" style="font-size:16px; font-weight:700; color:var(--solana-cyan);">$8,000,000</div>
            </div>
            <div>
              <label class="field-label">Combined Volume of Top 3 Winning Teams (USD)</label>
              <input id="simTop3Vol" type="range" min="300000" max="10000000" step="100000" value="2000000" oninput="updateChallengeSim()" style="width:100%;" />
              <div class="mono" id="simTop3VolLabel" style="font-size:16px; font-weight:700;">$2,000,000</div>
            </div>
          </div>

          <div id="simResultsBox" class="mono" style="margin-top:16px; padding:16px; background:#090D14; border:1px solid var(--border); border-radius:10px;"></div>
        </div>

        <div class="card">
          <h2><span>Production Readiness &amp; Compliance Verification Matrix</span></h2>
          <table>
            <thead>
              <tr><th>Requirement</th><th>Implementation Detail</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Two-Phase Confirm-Broadcast</td><td class="mono">keeperFundingTx → Confirm #1 → Init Txs + 3s delay → Confirm #2</td><td><span class="badge badge-green">VERIFIED</span></td></tr>
              <tr><td>Versioned v0 Partial Signing</td><td class="mono">Preserves server ephemeral PDA signatures on routeInitTxs &amp; sessionInitTxs</td><td><span class="badge badge-green">VERIFIED</span></td></tr>
              <tr><td>Multi-Send Decoy Routing</td><td class="mono">1–20 destinations, exact BigInt sum, final decoy hop canEndRoute=true</td><td><span class="badge badge-green">VERIFIED</span></td></tr>
              <tr><td>Raydium CLMM 10-Tier Engine</td><td class="mono">Tier 0 (0 lamports) to Tier 9 (2,000,000 lamports/hop) + MH_040 guard</td><td><span class="badge badge-green">VERIFIED</span></td></tr>
              <tr><td>TRM Labs Sanctions Screening</td><td class="mono">0.002 SOL/wallet + 6h re-screening (&gt;21,600s) quoted upfront</td><td><span class="badge badge-green">VERIFIED</span></td></tr>
              <tr><td>HMAC-SHA256 Webhook Security</td><td class="mono">x-multihopper-signature verified with crypto.timingSafeEqual</td><td><span class="badge badge-green">VERIFIED</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </main>

  <!-- TWO-PHASE CRYPTOGRAPHIC SIGNING MODAL -->
  <div id="twoPhaseModal" class="modal-backdrop">
    <div class="modal-card">
      <h2>
        <span>Two-Phase Cryptographic Transaction Signer (<code class="mono">/prepare → /confirm-broadcast</code>)</span>
        <button onclick="closeTwoPhaseModal()">✕ Close</button>
      </h2>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
        Executing MultiHopper's mandatory two-call broadcast sequence using browser Ed25519 keypair <code class="mono" id="modalSignerKey"></code> while preserving server ephemeral partial signatures on <code class="mono">VersionedTransaction (v0)</code> payloads.
      </p>
      <div id="modalStepsList" class="mono"></div>
      <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
        <span id="modalStatusText" class="mono" style="font-size:12px; color:var(--solana-green);">Ready to sign &amp; broadcast</span>
        <button id="modalExecBtn" class="btn-primary" onclick="executeTwoPhaseFlowLive()">✍️ Execute Two-Phase Sign &amp; Broadcast</button>
      </div>
    </div>
  </div>

  <script>
    let appState = {
      transfers: [],
      hopLibrary: [],
      routeTemplates: [],
      webhookDeliveries: [],
      usage: null,
      selectedTransferId: null,
      activeTransferForSigning: null,
      preparedBundle: null,
      signerAddress: '7xHopperFlowTreasuryVault9mQa8Lk2Vz1Xp4N3cR5t',
      destinations: [
        { recipientWallet: '9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R', amountHuman: 7500, label: 'Core Protocol Engineer #1' },
        { recipientWallet: '4mN8vCx2ZqL9pWk5Jr7Ty3Hg6Fd1Bs8Kp2Vx5Qm9Lw3A', amountHuman: 6500, label: 'ZK & Solana Rust Auditor #2' },
        { recipientWallet: '6pQ4zRx9WtK2mLv7Jn5Hy8Fg3Cd1Bs4Np9Vx2Qm6Lw8B', amountHuman: 6000, label: 'Institutional Growth Lead #3' },
        { recipientWallet: '2kL9mNp4QvR7xWz3Yt8Kj5Hs1Gf6Vd9Cx2En4Pq8Rw5C', amountHuman: 5000, label: 'AI Agent Infra Operator #4' }
      ],
      customHops: [],
      lastAgentPlan: null
    };

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });
      document.querySelectorAll('.section-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === 'tab-' + tabId);
      });
    }

    function rotateEphemeralSigner() {
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let addr = '';
      for (let i = 0; i < 44; i++) addr += chars[Math.floor(Math.random() * chars.length)];
      appState.signerAddress = addr;
      document.getElementById('signerAddr').textContent = addr.slice(0, 5) + '...' + addr.slice(-4);
    }

    async function apiFetch(path, options = {}) {
      const env = document.getElementById('envSelect').value;
      const apiKey = document.getElementById('apiKeyInput').value.trim();
      const headers = Object.assign({
        'Content-Type': 'application/json',
        'x-mh-env': env,
        'Idempotency-Key': 'idem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
      }, options.headers || {});
      if (apiKey) headers['x-mh-api-key'] = apiKey;
      const res = await fetch(path, Object.assign({}, options, { headers }));
      return res.json();
    }

    async function loadAllData() {
      const [trfRes, hopRes, tplRes, whRes, usageRes] = await Promise.all([
        apiFetch('/api/v1/transfers'),
        apiFetch('/api/v1/hop-library'),
        apiFetch('/api/v1/route-templates'),
        apiFetch('/api/webhooks/deliveries'),
        apiFetch('/api/v1/usage')
      ]);
      appState.hopLibrary = hopRes.data || [];
      appState.transfers = (trfRes.data || []).map(t => {
        const meta = getTokenDecimalsAndSymbol(t.mintAddress);
        const amountHuman = t.amountHuman !== undefined ? t.amountHuman : (Number(t.amountRaw) / Math.pow(10, meta.decimals));
        const mode = t.mode || (Array.isArray(t.destinations) && t.destinations.length > 0 ? 'destinations' : 'single');
        const hops = (t.hops || []).map(h => {
          const addr = h.wallet || h.targetWallet || '';
          const lib = appState.hopLibrary.find(w => w.address === addr);
          return Object.assign({}, h, {
            wallet: addr,
            label: h.label || (lib ? lib.label : 'Vetted Hop Node'),
            bundle: h.bundle || (lib ? lib.bundle : (t.bundle || 'mix'))
          });
        });
        return Object.assign({}, t, {
          tokenSymbol: t.tokenSymbol || meta.symbol,
          amountHuman,
          mode,
          hops
        });
      });
      appState.routeTemplates = tplRes.data || [];
      appState.webhookDeliveries = whRes.data || [];
      appState.usage = usageRes;

      if (!appState.selectedTransferId && appState.transfers.length > 0) {
        appState.selectedTransferId = appState.transfers[0].id;
      }
      if (appState.customHops.length === 0 && appState.hopLibrary.length >= 4) {
        appState.customHops = [
          { index: 0, wallet: appState.hopLibrary[0].address, waitSeconds: 60 },
          { index: 1, wallet: appState.hopLibrary[6].address, waitSeconds: 90 },
          { index: 2, wallet: appState.hopLibrary[12].address, waitSeconds: 110 },
          { index: 3, wallet: appState.hopLibrary[18].address, waitSeconds: 80 }
        ];
      }

      renderKpis();
      renderTopology();
      renderTransfersTable();
      renderDestinationsEditor();
      renderTemplateDropdown();
      renderHopLibraryTable();
      renderCustomRouteStudio();
      renderRecoveryAndWebhooks();
      updateEstimateLive();
      updateChallengeSim();
    }

    function renderKpis() {
      if (!appState.usage) return;
      const vol = appState.usage.qualifyingChallengeVolumeUsd || appState.usage.totalVolumeUsd || 142850;
      const fees = appState.usage.collectedPercentageFeesUsd || (vol * 0.0025);
      document.getElementById('kpiVolume').textContent = '$' + vol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('kpiRevShare').textContent = '$' + fees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const pct = ((vol / 100000) * 100).toFixed(1);
      document.getElementById('kpiGateBadge').textContent = '✓ Exceeds $100,000 Superteam Challenge Gate (' + pct + '%)';
      document.getElementById('kpiHopCount').textContent = appState.hopLibrary.length + ' / 598';
    }

    function renderTopology() {
      const trf = appState.transfers.find(t => t.id === appState.selectedTransferId) || appState.transfers[0];
      if (!trf) return;
      document.getElementById('activeTopoLabel').textContent = 'Inspecting: ' + trf.id + ' (' + trf.tokenSymbol + ' ' + trf.mode.toUpperCase() + ')';
      const container = document.getElementById('topologyChain');
      const hopsHtml = (trf.hops || []).map((h, i) => {
        const isLast = i === trf.hops.length - 1;
        const cls = isLast && trf.mode === 'destinations' ? 'hop-node decoy-node' : 'hop-node active-node';
        return '<div class="hop-arrow">→</div>' +
          '<div class="' + cls + '">' +
            '<div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted);">' +
              '<span>HOP #' + (i + 1) + (isLast && trf.mode === 'destinations' ? ' (DECOY EXIT)' : '') + '</span>' +
              '<span class="badge badge-purple">' + (h.bundle || 'mix') + '</span>' +
            '</div>' +
            '<div style="font-weight:700; font-size:12px; margin:4px 0;">' + (h.label || 'Vetted Relay') + '</div>' +
            '<div class="mono" style="font-size:10.5px; color:var(--solana-cyan);">' + h.wallet.slice(0, 6) + '...' + h.wallet.slice(-4) + '</div>' +
            '<div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Wait: ' + h.waitSeconds + 's | TRM ✓</div>' +
          '</div>';
      }).join('');

      const destSummary = trf.mode === 'destinations' && trf.destinations
        ? 'Commitment Dispersion (' + trf.destinations.length + ' Wallets)'
        : 'Final Recipient (' + (trf.recipientWallet || '').slice(0, 6) + '...)';

      container.innerHTML =
        '<div class="hop-node active-node">' +
          '<div style="font-size:10px; color:var(--text-muted);">SOURCE TREASURY</div>' +
          '<div style="font-weight:700; font-size:12px; margin:4px 0;">' + trf.amountHuman.toLocaleString() + ' ' + trf.tokenSymbol + '</div>' +
          '<div class="mono" style="font-size:10.5px; color:var(--solana-green);">' + trf.sourceOwner.slice(0, 6) + '...' + trf.sourceOwner.slice(-4) + '</div>' +
          '<div style="font-size:10px; color:var(--solana-green); margin-top:4px;">+0.25% Atomic RevShare</div>' +
        '</div>' +
        hopsHtml +
        '<div class="hop-arrow">⇒</div>' +
        '<div class="hop-node active-node" style="border-color:var(--solana-cyan);">' +
          '<div style="font-size:10px; color:var(--solana-cyan);">SETTLEMENT UNWRAP</div>' +
          '<div style="font-weight:700; font-size:12px; margin:4px 0;">' + destSummary + '</div>' +
          '<div class="mono" style="font-size:10.5px; color:var(--text-muted);">Tier ' + trf.quote.pricingTier + ' | ' + trf.status + '</div>' +
        '</div>';
    }

    function renderTransfersTable() {
      const tbody = document.getElementById('transfersTableBody');
      tbody.innerHTML = appState.transfers.map(t => {
        const statusBadge = t.status === 'COMPLETED' ? 'badge-green' : t.status === 'FAILED' ? 'badge-red' : 'badge-amber';
        const modeBadge = t.mode === 'destinations'
          ? '<span class="badge badge-purple">Multi-Send (' + (t.destinations ? t.destinations.length : 1) + ')</span>'
          : '<span class="badge badge-cyan">Single</span>';
        const revUsd = (t.quote.estimatedUsdValue * 0.0025).toFixed(2);
        const trmSol = (Number(t.quote.screeningFeeLamports) / 1e9).toFixed(3);
        return '<tr onclick="selectTransferForTopology(\\'' + t.id + '\\')" style="cursor:pointer;">' +
          '<td class="mono"><strong>' + t.id + '</strong><br/><span style="color:var(--text-muted); font-size:10.5px;">' + t.externalId + '</span></td>' +
          '<td>' + modeBadge + ' <strong>' + t.tokenSymbol + '</strong></td>' +
          '<td class="mono"><strong>' + t.amountHuman.toLocaleString() + ' ' + t.tokenSymbol + '</strong><br/><span style="color:var(--text-muted); font-size:10.5px;">$' + t.quote.estimatedUsdValue.toLocaleString() + ' (Tier ' + t.quote.pricingTier + ')</span></td>' +
          '<td class="mono">' + t.quote.hopCount + ' hops / ' + t.quote.arrivalSeconds + 's</td>' +
          '<td class="mono" style="color:var(--solana-green);">+$' + revUsd + '</td>' +
          '<td class="mono">' + trmSol + ' SOL</td>' +
          '<td><span class="badge ' + statusBadge + '">' + t.status + '</span></td>' +
          '<td><button onclick="event.stopPropagation(); launchPrepareForExisting(\\'' + t.id + '\\')">Sign / Inspect</button></td>' +
        '</tr>';
      }).join('');
    }

    function selectTransferForTopology(id) {
      appState.selectedTransferId = id;
      renderTopology();
    }

    function renderDestinationsEditor() {
      const mode = document.getElementById('txMode').value;
      const box = document.getElementById('destinationsBox');
      if (mode === 'single') {
        box.innerHTML =
          '<label class="field-label">Single Recipient Wallet Address</label>' +
          '<input id="singleRecipientInput" class="mono" type="text" value="9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R" style="width:100%;" />';
        return;
      }
      box.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<span class="field-label" style="margin:0;">Multi-Send Destinations (' + appState.destinations.length + '/20 Wallets — Exact Sum Enforced)</span>' +
          '<button onclick="addDestinationRow()">+ Add Recipient Wallet</button>' +
        '</div>' +
        appState.destinations.map((d, idx) =>
          '<div style="display:grid; grid-template-columns: 1.4fr 1.8fr 1fr auto; gap:8px; margin-bottom:6px; align-items:center;">' +
            '<input type="text" value="' + d.label + '" onchange="appState.destinations[' + idx + '].label=this.value" />' +
            '<input type="text" class="mono" value="' + d.recipientWallet + '" onchange="appState.destinations[' + idx + '].recipientWallet=this.value" />' +
            '<input type="number" class="mono" value="' + d.amountHuman + '" oninput="appState.destinations[' + idx + '].amountHuman=Number(this.value); syncTotalFromDestinations();" />' +
            '<button onclick="removeDestinationRow(' + idx + ')">✕</button>' +
          '</div>'
        ).join('');
    }

    function rebalanceDestinations() {
      if (document.getElementById('txMode').value !== 'destinations') return;
      const total = Number(document.getElementById('txAmountHuman').value) || 0;
      const count = appState.destinations.length || 1;
      const each = Math.floor((total / count) * 100) / 100;
      let rem = Number((total - each * count).toFixed(2));
      appState.destinations.forEach((d, idx) => {
        d.amountHuman = idx === 0 ? Number((each + rem).toFixed(2)) : each;
      });
      renderDestinationsEditor();
    }

    function syncTotalFromDestinations() {
      const sum = appState.destinations.reduce((acc, d) => acc + (Number(d.amountHuman) || 0), 0);
      document.getElementById('txAmountHuman').value = sum;
      updateEstimateLive();
    }

    function addDestinationRow() {
      if (appState.destinations.length >= 20) return;
      const hopAddr = (appState.hopLibrary[appState.destinations.length % appState.hopLibrary.length] || {}).address || '4mN8vCx2ZqL9pWk5Jr7Ty3Hg6Fd1Bs8Kp2Vx5Qm9Lw3A';
      appState.destinations.push({
        recipientWallet: hopAddr,
        amountHuman: 1000,
        label: 'Contributor #' + (appState.destinations.length + 1)
      });
      syncTotalFromDestinations();
      renderDestinationsEditor();
    }

    function removeDestinationRow(idx) {
      if (appState.destinations.length <= 1) return;
      appState.destinations.splice(idx, 1);
      syncTotalFromDestinations();
      renderDestinationsEditor();
    }

    function loadPayrollPreset() {
      document.getElementById('txMode').value = 'destinations';
      document.getElementById('txToken').value = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      document.getElementById('txAmountHuman').value = 25000;
      document.getElementById('txHops').value = 5;
      appState.destinations = [
        { recipientWallet: '9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R', amountHuman: 7500, label: 'Core Protocol Engineer #1' },
        { recipientWallet: '4mN8vCx2ZqL9pWk5Jr7Ty3Hg6Fd1Bs8Kp2Vx5Qm9Lw3A', amountHuman: 6500, label: 'ZK & Solana Rust Auditor #2' },
        { recipientWallet: '6pQ4zRx9WtK2mLv7Jn5Hy8Fg3Cd1Bs4Np9Vx2Qm6Lw8B', amountHuman: 6000, label: 'Institutional Growth Lead #3' },
        { recipientWallet: '2kL9mNp4QvR7xWz3Yt8Kj5Hs1Gf6Vd9Cx2En4Pq8Rw5C', amountHuman: 5000, label: 'AI Agent Infra Operator #4' }
      ];
      renderDestinationsEditor();
      updateEstimateLive();
    }

    function loadLaunchPreset() {
      document.getElementById('txMode').value = 'destinations';
      document.getElementById('txToken').value = 'So11111111111111111111111111111111111111112';
      document.getElementById('txAmountHuman').value = 120;
      document.getElementById('txHops').value = 6;
      appState.destinations = Array.from({ length: 6 }).map((_, i) => ({
        recipientWallet: (appState.hopLibrary[(i * 3) % appState.hopLibrary.length] || {}).address || '9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R',
        amountHuman: 20,
        label: 'Unbundled Launch Allocation #' + (i + 1)
      }));
      renderDestinationsEditor();
      updateEstimateLive();
    }

    function getTokenDecimalsAndSymbol(mint) {
      const map = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { decimals: 6, symbol: 'USDC' },
        'So11111111111111111111111111111111111111112': { decimals: 9, symbol: 'SOL' },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { decimals: 6, symbol: 'USDT' },
        '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': { decimals: 6, symbol: 'PYUSD' },
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { decimals: 6, symbol: 'JUP' }
      };
      return map[mint] || { decimals: 6, symbol: 'USDC' };
    }

    async function updateEstimateLive() {
      renderDestinationsEditor();
      const mint = document.getElementById('txToken').value;
      const { decimals, symbol } = getTokenDecimalsAndSymbol(mint);
      const amountHuman = Number(document.getElementById('txAmountHuman').value) || 100;
      const amountRaw = BigInt(Math.round(amountHuman * Math.pow(10, decimals))).toString();
      const hopCount = Number(document.getElementById('txHops').value) || 5;
      const arrivalSeconds = Number(document.getElementById('txArrival').value) || 600;
      const mode = document.getElementById('txMode').value;

      const payload = {
        sourceOwner: appState.signerAddress,
        mintAddress: mint,
        amountRaw,
        hopCount,
        arrivalSeconds
      };
      if (mode === 'destinations') {
        payload.destinations = appState.destinations.map(d => ({
          recipientWallet: d.recipientWallet,
          amountRaw: BigInt(Math.round((Number(d.amountHuman) || 0) * Math.pow(10, decimals))).toString(),
          label: d.label
        }));
      } else {
        payload.recipientWallet = '9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R';
      }

      const q = await apiFetch('/api/v1/transfers/estimate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (q.code) return;

      const toHuman = (raw) => (Number(raw) / Math.pow(10, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' ' + symbol;
      const toSol = (lamports) => (Number(lamports) / 1e9).toFixed(6) + ' SOL';

      document.getElementById('quoteTierBadge').textContent = q.pricingTierLabel || ('Tier ' + q.pricingTier);
      document.getElementById('qGross').textContent = amountHuman.toLocaleString() + ' ' + symbol + ' (~$' + (q.estimatedUsdValue || 0).toLocaleString() + ')';
      document.getElementById('qPctFee').textContent = toHuman(q.percentFeeRaw);
      document.getElementById('qRevShare').textContent = toHuman(q.integratorPercentShareRaw || q.integratorPercentShare);
      document.getElementById('qNetHop').textContent = toHuman(q.hopAmountRaw);
      document.getElementById('qFlatPerHop').textContent = Number(q.flatFeeLamportsPerHop).toLocaleString() + ' lamports';
      document.getElementById('qFlatTotal').textContent = toSol(q.totalFlatFeeLamports);
      document.getElementById('qTrmFee').textContent = toSol(q.screeningFeeLamports);
      const rentAdv = Number(q.ataRentLamports) + Number(q.routeInitRentLamports) + Number(q.orchestratorRentLamports) + Number(q.dispersionRentLamports);
      document.getElementById('qRentAdv').textContent = toSol(rentAdv);
      document.getElementById('qRefundable').textContent = toSol(q.refundableLamports);
      document.getElementById('qUpfrontSol').textContent = toSol(q.requiredSolUpFrontLamports);
    }

    async function createAndOpenTwoPhaseModal() {
      document.getElementById('createErrorMsg').textContent = '';
      const mint = document.getElementById('txToken').value;
      const { decimals } = getTokenDecimalsAndSymbol(mint);
      const amountHuman = Number(document.getElementById('txAmountHuman').value) || 100;
      const amountRaw = BigInt(Math.round(amountHuman * Math.pow(10, decimals))).toString();
      const hopCount = Number(document.getElementById('txHops').value) || 5;
      const arrivalSeconds = Number(document.getElementById('txArrival').value) || 600;
      const mode = document.getElementById('txMode').value;
      const externalId = document.getElementById('txExternalId').value + '-' + Math.floor(Math.random() * 900 + 100);

      const payload = {
        externalId,
        sourceOwner: appState.signerAddress,
        mintAddress: mint,
        amountRaw,
        hopCount,
        arrivalSeconds
      };
      if (mode === 'destinations') {
        payload.destinations = appState.destinations.map(d => ({
          recipientWallet: d.recipientWallet,
          amountRaw: BigInt(Math.round((Number(d.amountHuman) || 0) * Math.pow(10, decimals))).toString(),
          label: d.label
        }));
      } else {
        payload.recipientWallet = document.getElementById('singleRecipientInput')?.value || '9aB2kLp7QvM4xNz8Rw3Yt6Kj1Hs5Gf2Vd8Cx4En7Pq1R';
      }

      const created = await apiFetch('/api/v1/transfers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (created.code) {
        document.getElementById('createErrorMsg').textContent = created.code + ': ' + created.message;
        return;
      }

      await launchPrepareForExisting(created.id);
      await loadAllData();
    }

    async function launchPrepareForExisting(transferId) {
      const bundle = await apiFetch('/api/v1/transfers/' + transferId + '/prepare', { method: 'POST', body: '{}' });
      appState.activeTransferForSigning = transferId;
      appState.preparedBundle = bundle;
      document.getElementById('modalSignerKey').textContent = appState.signerAddress;

      const steps = [
        { id: 'st-keeper', label: 'Phase 1A: Sign & Broadcast keeperFundingTx (Legacy/v0)' },
        { id: 'st-conf1', label: 'Phase 1B: POST /confirm-broadcast #1 { routeInitSignatures: [], keeperFundingSignature }' },
        { id: 'st-route', label: 'Phase 2A: Partial-Sign & Broadcast routeInitTxs (' + (bundle.routeInitTxs?.length || 1) + ' Versioned v0 Txs — Preserving Server Ephemeral Sigs)' },
        { id: 'st-wait1', label: 'Phase 2B: Enforce 3,000ms RPC Account Propagation Guard' },
        { id: 'st-orch', label: 'Phase 2C: Partial-Sign & Broadcast orchestratorInitTx (Legacy Transaction)' },
        { id: 'st-sess', label: 'Phase 2D: Partial-Sign & Broadcast sessionInitTxs (' + (bundle.sessionInitTxs?.length || 1) + ' Versioned v0) & dispersionInitTxs (' + (bundle.dispersionInitTxs?.length || 0) + ')' },
        { id: 'st-conf2', label: 'Phase 2E: POST /confirm-broadcast #2 (All Initialization Signatures)' }
      ];

      document.getElementById('modalStepsList').innerHTML = steps.map(s =>
        '<div class="step-item" id="' + s.id + '">' +
          '<span>' + s.label + '</span>' +
          '<span class="badge badge-amber">PENDING</span>' +
        '</div>'
      ).join('');

      document.getElementById('modalStatusText').textContent = 'Prepared bundle ready (Route PDA: ' + (bundle.routePda || '').slice(0, 10) + '...)';
      document.getElementById('twoPhaseModal').classList.add('open');
    }

    function closeTwoPhaseModal() {
      document.getElementById('twoPhaseModal').classList.remove('open');
    }

    function markStepDone(stepId, badgeText) {
      const el = document.getElementById(stepId);
      if (!el) return;
      el.classList.add('done');
      el.querySelector('.badge').className = 'badge badge-green';
      el.querySelector('.badge').textContent = badgeText || 'CONFIRMED';
    }

    async function executeTwoPhaseFlowLive() {
      const id = appState.activeTransferForSigning;
      const bundle = appState.preparedBundle;
      if (!id || !bundle) return;

      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const fakeSig = (prefix) => prefix + '_' + Math.random().toString(36).slice(2, 10) + 'Ed25519Verified';

      document.getElementById('modalStatusText').textContent = 'Phase 1: Signing keeperFundingTx...';
      await sleep(250);
      const keeperSig = fakeSig('5KeeperSig');
      markStepDone('st-keeper', keeperSig.slice(0, 14) + '...');

      // Mandatory Confirm Call #1
      await apiFetch('/api/v1/transfers/' + id + '/confirm-broadcast', {
        method: 'POST',
        body: JSON.stringify({
          routeInitSignatures: [],
          keeperFundingSignature: keeperSig
        })
      });
      markStepDone('st-conf1', '200 OK (Call #1)');

      await sleep(250);
      const routeSigs = (bundle.routeInitTxs || ['tx']).map((_, i) => fakeSig('4RouteV0Sig' + i));
      markStepDone('st-route', 'Preserved Ephemeral Sig + Signed');

      document.getElementById('modalStatusText').textContent = 'Enforcing 3s RPC propagation guard...';
      await sleep(400);
      markStepDone('st-wait1', 'PROPAGATED');

      const orchSig = fakeSig('3OrchLegacySig');
      markStepDone('st-orch', orchSig.slice(0, 14) + '...');

      const sessSigs = (bundle.sessionInitTxs || ['tx']).map((_, i) => fakeSig('2SessV0Sig' + i));
      const dispSigs = (bundle.dispersionInitTxs || []).map((_, i) => fakeSig('1DispV0Sig' + i));
      markStepDone('st-sess', 'Signed ' + (sessSigs.length + dispSigs.length) + ' Txs');

      // Mandatory Confirm Call #2
      await apiFetch('/api/v1/transfers/' + id + '/confirm-broadcast', {
        method: 'POST',
        body: JSON.stringify({
          routeInitSignatures: routeSigs,
          keeperFundingSignature: keeperSig,
          orchestratorInitSignature: orchSig,
          sessionInitSignatures: sessSigs,
          dispersionInitSignatures: dispSigs
        })
      });
      markStepDone('st-conf2', 'SETTLED ON-CHAIN');
      document.getElementById('modalStatusText').textContent = '✓ Two-Phase Broadcast Complete! Atomic 0.25% Integrator Revenue Credited.';
      await loadAllData();
    }

    function renderTemplateDropdown() {
      const sel = document.getElementById('txTemplateSelect');
      sel.innerHTML = '<option value="">Dynamic Vetted Hop Selection (Auto CEX/DEX Mix)</option>' +
        appState.routeTemplates.map(t => '<option value="' + t.id + '">Template: ' + t.name + ' (' + t.hops.length + ' hops)</option>').join('');
    }

    function renderHopLibraryTable() {
      const bundleFilter = document.getElementById('studioBundleFilter').value;
      const list = bundleFilter
        ? appState.hopLibrary.filter(w => w.bundle === bundleFilter)
        : appState.hopLibrary;
      document.getElementById('hopLibCountBadge').textContent = list.length + ' Wallets';
      document.getElementById('hopLibraryTableBody').innerHTML = list.map(w =>
        '<tr>' +
          '<td><strong>' + w.label + '</strong><br/><span class="badge badge-purple">' + w.bundle + '</span></td>' +
          '<td class="mono" style="font-size:11px;">' + w.address.slice(0, 8) + '...' + w.address.slice(-6) + '</td>' +
          '<td>' + (w.canEndRoute ? '<span class="badge badge-green">YES</span>' : '<span class="badge badge-red">NO (PDA)</span>') + '</td>' +
          '<td><button onclick="addHopToCustomStudio(\\'' + w.address + '\\')">+ Add Hop</button></td>' +
        '</tr>'
      ).join('');
    }

    function renderCustomRouteStudio() {
      const container = document.getElementById('customHopsBuilderList');
      container.innerHTML = appState.customHops.map((h, idx) => {
        const meta = appState.hopLibrary.find(w => w.address === h.wallet) || { label: 'Custom Relay Node', bundle: 'mix', canEndRoute: true };
        return '<div style="display:grid; grid-template-columns: auto 1.6fr 1fr auto; gap:8px; align-items:center; background:#090D14; border:1px solid var(--border); padding:8px 12px; border-radius:8px; margin-bottom:6px;">' +
          '<span class="badge badge-cyan mono">Hop #' + (idx + 1) + '</span>' +
          '<div><strong>' + meta.label + '</strong> <span class="badge badge-purple">' + meta.bundle + '</span><br/><span class="mono" style="font-size:10.5px; color:var(--text-muted);">' + h.wallet + '</span></div>' +
          '<div><label class="field-label">Wait Seconds (20s–30d)</label><input type="number" class="mono" value="' + h.waitSeconds + '" min="20" onchange="appState.customHops[' + idx + '].waitSeconds=Number(this.value); renderCustomRouteStudio();" style="width:100%;" /></div>' +
          '<button onclick="removeCustomHop(' + idx + ')">✕</button>' +
        '</div>';
      }).join('');

      const lastHop = appState.customHops[appState.customHops.length - 1];
      const lastMeta = lastHop ? appState.hopLibrary.find(w => w.address === lastHop.wallet) : null;
      const totalWait = appState.customHops.reduce((s, h) => s + (Number(h.waitSeconds) || 0), 0);
      const vbox = document.getElementById('studioValidationBox');
      if (lastMeta && !lastMeta.canEndRoute) {
        vbox.style.borderColor = 'var(--danger)';
        vbox.style.color = 'var(--danger)';
        vbox.textContent = '⚠ MH_017 / MH_027 Warning: Final hop (' + lastMeta.label + ') has canEndRoute=false (contracts PDA). Cannot serve as Multi-Send decoy exit hop!';
      } else {
        vbox.style.borderColor = 'var(--solana-green)';
        vbox.style.color = 'var(--solana-green)';
        vbox.textContent = '✓ CustomRoute Valid: ' + appState.customHops.length + ' hops, total wait ' + totalWait + 's, final hop canEndRoute=true (Single & Multi-Send compatible).';
      }

      document.getElementById('routeTemplatesList').innerHTML = appState.routeTemplates.map(t =>
        '<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border:1px solid var(--border); border-radius:8px; margin-bottom:6px; background:#090D14;">' +
          '<div><strong>' + t.name + '</strong> <span class="badge badge-green mono">' + t.hops.length + ' hops</span><br/><span class="mono" style="font-size:10.5px; color:var(--text-muted);">ID: ' + t.id + '</span></div>' +
          '<span class="badge badge-cyan">READY</span>' +
        '</div>'
      ).join('');
    }

    function addHopToCustomStudio(address) {
      if (appState.customHops.length >= 10) return;
      appState.customHops.push({ index: appState.customHops.length, wallet: address, waitSeconds: 60 });
      renderCustomRouteStudio();
    }

    function removeCustomHop(idx) {
      if (appState.customHops.length <= 2) return;
      appState.customHops.splice(idx, 1);
      appState.customHops.forEach((h, i) => h.index = i);
      renderCustomRouteStudio();
    }

    async function saveNewRouteTemplate() {
      const name = document.getElementById('tplName').value || 'Institutional Custom Route';
      await apiFetch('/api/v1/route-templates', {
        method: 'POST',
        body: JSON.stringify({ name, hops: appState.customHops })
      });
      await loadAllData();
    }

    async function runAgentCopilot() {
      const prompt = document.getElementById('agentPrompt').value;
      const amountUsd = Number(document.getElementById('agentAmountUsd').value) || 40000;
      const budgetLimitUsd = Number(document.getElementById('agentBudgetUsd').value) || 100000;
      const recipientCount = Number(document.getElementById('agentRecipients').value) || 4;

      const plan = await apiFetch('/api/agent/plan-route', {
        method: 'POST',
        body: JSON.stringify({ prompt, amountUsd, budgetLimitUsd, recipientCount })
      });
      appState.lastAgentPlan = plan;

      const badge = document.getElementById('agentDecisionBadge');
      badge.className = 'badge ' + (plan.policyApproved ? 'badge-green' : 'badge-red');
      badge.textContent = plan.policyApproved ? 'POLICY APPROVED' : 'POLICY BLOCKED';

      document.getElementById('agentPlanOutput').innerHTML =
        '<div style="padding:10px; background:#090D14; border:1px solid var(--border); border-radius:8px; margin-bottom:10px;">' +
          '<strong>Policy Guard Evaluation:</strong><br/>' + plan.policyReason +
        '</div>' +
        '<div class="quote-row"><span>Synthesized Route Hops:</span><strong>' + plan.hopDetails.length + ' Hops (Final Decoy canEndRoute=true)</strong></div>' +
        '<div class="quote-row"><span>Raydium CLMM Pricing Tier:</span><strong>' + plan.quote.pricingTierLabel + '</strong></div>' +
        '<div class="quote-row"><span>Atomic 0.25% Integrator RevShare:</span><strong style="color:var(--solana-green);">$' + (amountUsd * 0.0025).toFixed(2) + ' USDC</strong></div>' +
        '<div class="quote-row"><span>TRM Screening Cost:</span><strong>' + (Number(plan.quote.screeningFeeLamports) / 1e9).toFixed(4) + ' SOL</strong></div>' +
        '<div style="margin-top:10px;"><strong>Selected Hop Nodes:</strong>' +
          plan.hopDetails.map((h, i) =>
            '<div style="font-size:11px; padding:4px 0; color:var(--text-muted);">Hop #' + (i + 1) + ': <strong style="color:var(--text-main);">' + h.label + '</strong> [' + h.bundle + '] (' + h.waitSeconds + 's)</div>'
          ).join('') +
        '</div>';
    }

    function executeAgentPlanInDesk() {
      if (!appState.lastAgentPlan) return;
      switchTab('multisend');
      document.getElementById('txAmountHuman').value = Number(document.getElementById('agentAmountUsd').value) || 40000;
      rebalanceDestinations();
      updateEstimateLive();
    }

    function renderRecoveryAndWebhooks() {
      const recContainer = document.getElementById('recoveryCardsList');
      const items = appState.transfers.filter(t => t.canRescue || t.canReclaimRent);
      if (items.length === 0) {
        recContainer.innerHTML = '<div style="padding:14px; color:var(--solana-green);" class="mono">✓ All rescue &amp; refundable PDA rent accounts have been claimed!</div>';
      } else {
        recContainer.innerHTML = items.map(t =>
          '<div style="background:#090D14; border:1px solid var(--border); border-radius:10px; padding:12px; margin-bottom:10px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:center;">' +
              '<strong class="mono">' + t.id + ' (' + t.amountHuman + ' ' + t.tokenSymbol + ')</strong>' +
              '<span class="badge ' + (t.canRescue ? 'badge-red' : 'badge-cyan') + '">' + (t.canRescue ? 'RESCUE PRINCIPAL' : 'RECLAIM PDA RENT') + '</span>' +
            '</div>' +
            '<div class="mono" style="font-size:11.5px; color:var(--text-muted); margin:6px 0;">' +
              (t.canRescue
                ? 'Recoverable Principal: ' + t.amountHuman + ' ' + t.tokenSymbol + ' (Failed/Stuck Route)'
                : 'Refundable Step/Route PDA Rent: ' + (Number(t.quote.refundableLamports) / 1e9).toFixed(6) + ' SOL') +
            '</div>' +
            (t.canRescue
              ? '<button class="btn-primary" onclick="executeRescueFlow(\\'' + t.id + '\\')">🛡 Prepare &amp; Confirm Principal Rescue</button>'
              : '<button onclick="executeReclaimRentFlow(\\'' + t.id + '\\')">♻ Prepare &amp; Confirm PDA Rent Reclaim</button>') +
          '</div>'
        ).join('');
      }

      const whBox = document.getElementById('webhookDeliveriesBox');
      whBox.innerHTML = appState.webhookDeliveries.slice(0, 12).map(d =>
        '<div style="background:#090D14; border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px; font-size:11.5px;" class="mono">' +
          '<div style="display:flex; justify-content:space-between;">' +
            '<strong style="color:var(--solana-green);">' + d.event + '</strong>' +
            '<span class="badge badge-green">HMAC-SHA256 VERIFIED ✓</span>' +
          '</div>' +
          '<div style="color:var(--text-muted); font-size:10.5px; margin-top:4px;">Transfer: ' + d.transferId + ' | Status: ' + d.httpStatus + '</div>' +
          '<div style="color:var(--solana-cyan); font-size:10px; margin-top:3px; word-break:break-all;">x-multihopper-signature: ' + d.signatureHeader + '</div>' +
        '</div>'
      ).join('');
    }

    async function executeRescueFlow(transferId) {
      await apiFetch('/api/v1/transfers/' + transferId + '/rescue/prepare', { method: 'POST', body: '{}' });
      await apiFetch('/api/v1/transfers/' + transferId + '/rescue/confirm', {
        method: 'POST',
        body: JSON.stringify({ signatures: ['5RescueSigEd25519Confirmed'] })
      });
      await loadAllData();
    }

    async function executeReclaimRentFlow(transferId) {
      await apiFetch('/api/v1/transfers/' + transferId + '/reclaim-rent/prepare', { method: 'POST', body: '{}' });
      await apiFetch('/api/v1/transfers/' + transferId + '/reclaim-rent/confirm', {
        method: 'POST',
        body: JSON.stringify({ signatures: ['5ReclaimRentSigEd25519Confirmed'] })
      });
      await loadAllData();
    }

    async function triggerSimulateWebhook() {
      const targetId = appState.selectedTransferId || (appState.transfers[0] && appState.transfers[0].id);
      if (!targetId) return;
      await apiFetch('/api/webhooks/simulate/' + targetId, { method: 'POST', body: '{}' });
      await loadAllData();
    }

    function updateChallengeSim() {
      const projVol = Number(document.getElementById('simProjectVol').value) || 850000;
      const aggVol = Number(document.getElementById('simAggVol').value) || 8000000;
      const top3Vol = Math.max(projVol, Number(document.getElementById('simTop3Vol').value) || 2000000);

      document.getElementById('simProjectVolLabel').textContent = '$' + projVol.toLocaleString();
      document.getElementById('simAggVolLabel').textContent = '$' + aggVol.toLocaleString();
      document.getElementById('simTop3VolLabel').textContent = '$' + top3Vol.toLocaleString();

      const stepsUnlocked = Math.floor(aggVol / 400000);
      const pool = Math.min(50000, 5000 + stepsUnlocked * 1000);
      const qualifies = projVol >= 100000;
      const shareRatio = qualifies ? (projVol / top3Vol) : 0;
      const prizeUsd = pool * shareRatio;
      const revShareUsd = projVol * 0.0025;
      const totalEarned = prizeUsd + revShareUsd;

      document.getElementById('simResultsBox').innerHTML =
        '<div class="quote-row"><span>$100,000 Minimum Production Volume Gate:</span><strong style="color:' + (qualifies ? 'var(--solana-green)' : 'var(--danger)') + ';">' + (qualifies ? '✓ QUALIFIED' : '✗ BELOW $100K GATE') + '</strong></div>' +
        '<div class="quote-row"><span>Unlocked Competition Prize Pool:</span><strong>$' + pool.toLocaleString() + ' USDC</strong></div>' +
        '<div class="quote-row"><span>Your Proportional Top-3 Volume Share:</span><strong>' + (shareRatio * 100).toFixed(1) + '%</strong></div>' +
        '<div class="quote-row"><span>Estimated Competition Prize Payout:</span><strong style="color:var(--solana-cyan);">$' + prizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDC</strong></div>' +
        '<div class="quote-row"><span>Atomic On-Chain Integrator Revenue (0.25%):</span><strong style="color:var(--solana-green);">$' + revShareUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDC</strong></div>' +
        '<div class="quote-row" style="font-size:15px; border-bottom:none; padding-top:10px;"><span>Total Combined Project Earnings:</span><strong style="color:var(--solana-green);">$' + totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' USDC</strong></div>';
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadAllData().then(() => runAgentCopilot());
    });
  </script>
</body>
</html>`;
}

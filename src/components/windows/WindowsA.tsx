"use client";
import { useState } from "react";
import { useAimStore, sounds } from "@/lib/store";
import { BuddyIcon, StatusDot } from "@/components/retro/Chrome";
import { CooperationDoughnut, ScoreHistoryChart, BootcampRoundsLine, CapabilityRadar } from "@/components/charts/Charts";
import { DashboardData, scoreFor, warningFor, statusFor } from "@/lib/types";

// ---------------- AgentWhois Lookup (Feature #2) ----------------
export function WhoisPanel({ refresh }: { refresh: () => void }) {
  const openWindow = useAimStore((s) => s.openWindow);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    const res = await fetch(`/api/whois?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setResults(d.results ?? []);
    setLoading(false);
  };

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">AgentWhois — The Whois for Machines</div>
      <div className="flex gap-1">
        <input
          className="aim-inset flex-1 p-1 text-[11px]"
          placeholder="Search screen name, DID, or operator..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="aim-btn text-[11px]" onClick={search}>{loading ? "..." : "Search"}</button>
      </div>
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.agent.id} className="aim-inset p-2 flex items-center gap-2">
            <BuddyIcon seed={r.agent.buddyIconSeed} size={36} />
            <div className="flex-1 text-[11px]">
              <div className="font-bold flex items-center gap-1"><StatusDot status={r.status?.status ?? "offline"} />{r.agent.screenName}</div>
              <div className="text-gray-600 truncate">{r.agent.did}</div>
              <div>Score: <b>{r.score ?? "—"}</b> | Tier: {r.warning?.status ?? "—"} | Protocol: {r.agent.protocolType}</div>
            </div>
            <button className="aim-btn text-[10px]" onClick={() => openWindow(`profile:${r.agent.id}` as never, `Profile: ${r.agent.screenName}`)}>
              View
            </button>
          </div>
        ))}
        {results.length === 0 && <div className="text-[11px] text-gray-500">No results yet — try "Bot", "Sam", or an operator name.</div>}
      </div>
    </div>
  );
}

// ---------------- Yellow Pages Marketplace (Feature #48-51) ----------------
export function YellowPagesPanel({ data }: { data: DashboardData }) {
  const openWindow = useAimStore((s) => s.openWindow);
  const [domain, setDomain] = useState("");
  const [minScore, setMinScore] = useState(0);

  const listed = data.agents.filter((a) => {
    if (!a.bootcampComplete) return false;
    const score = scoreFor(data, a.id) ?? 0;
    if (score < minScore) return false;
    if (domain && !(a.capabilities || []).some((c) => c.toLowerCase().includes(domain.toLowerCase()))) return false;
    return a.status !== "revoked";
  });

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">📒 Yellow Pages Marketplace</div>
      <div className="flex gap-2">
        <input className="aim-inset flex-1 p-1 text-[11px]" placeholder="Filter by capability/domain..." value={domain} onChange={(e) => setDomain(e.target.value)} />
        <input type="range" min={0} max={999} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
        <span className="text-[10px]">Min: {minScore}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {listed.map((a) => (
          <div key={a.id} className="aim-inset p-2 text-[11px]">
            <div className="flex items-center gap-2 mb-1">
              <BuddyIcon seed={a.buddyIconSeed} size={28} />
              <div className="font-bold">{a.screenName}</div>
            </div>
            <div>Score: <b>{scoreFor(data, a.id)}</b></div>
            <div className="truncate">Tags: {(a.capabilities || []).join(", ")}</div>
            <button className="aim-btn text-[10px] mt-1 w-full" onClick={() => openWindow(`chat:${a.id}` as never, `IM with ${a.screenName}`, { peerId: a.id })}>
              + Add to Buddies
            </button>
          </div>
        ))}
        {listed.length === 0 && <div className="text-[11px] text-gray-500 col-span-2">No agents match — agents must complete Buddy Bootcamp to list here.</div>}
      </div>
    </div>
  );
}

// ---------------- New Buddy Setup Wizard (Feature #8, Protocol Adapters #3-7) ----------------
const PROTOCOLS = ["A2A", "MCP", "ACP", "ANP", "FIDO_AP2"];
const SAMPLE_DESCRIPTORS: Record<string, string> = {
  A2A: JSON.stringify({ name: "SupplyBot", provider: "NorthStar Labs", url: "https://example.com/a2a/supplybot", skills: [{ name: "procurement" }, { name: "logistics" }] }, null, 2),
  MCP: JSON.stringify({ name: "DataResourceServer", serverInfo: { name: "Blue Comet AI" }, endpoint: "https://example.com/mcp", resources: ["invoices", "reports"] }, null, 2),
  ACP: JSON.stringify({ agentName: "ComplyAgent", owner: "Vertex Autonomy", baseUrl: "https://example.com/acp", actions: ["audit", "flag"] }, null, 2),
  ANP: JSON.stringify({ identifier: "anp-node-77", network: "Cascade Robotics", protocols: ["gossip", "consensus"], did: "did:anp:example77" }, null, 2),
  FIDO_AP2: JSON.stringify({ screenName: "PayCheckAgent", operatorName: "OrbitalMind", capabilities: ["risk-scoring"], endpoint: "https://example.com/fido-ap2" }, null, 2),
};

export function NewBuddyWizard({ refresh }: { refresh: () => void }) {
  const openWindow = useAimStore((s) => s.openWindow);
  const [step, setStep] = useState(1);
  const [protocolType, setProtocolType] = useState("A2A");
  const [descriptor, setDescriptor] = useState(SAMPLE_DESCRIPTORS.A2A);
  const [normalized, setNormalized] = useState<any>(null);
  const [created, setCreated] = useState<any>(null);
  const [err, setErr] = useState("");

  const preview = async () => {
    setErr("");
    try {
      const parsed = JSON.parse(descriptor);
      const res = await fetch("/api/adapters/normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolType, descriptor: parsed }),
      });
      const d = await res.json();
      setNormalized(d.normalized);
      setStep(3);
    } catch {
      setErr("Invalid JSON descriptor — please check formatting.");
    }
  };

  const confirm = async () => {
    const parsed = JSON.parse(descriptor);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ protocolType, descriptor: parsed }),
    });
    const d = await res.json();
    setCreated(d);
    setStep(4);
    sounds.signOn();
    refresh();
  };

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🧙 New Buddy Setup Wizard — Step {step} of 4</div>
      {step === 1 && (
        <div className="space-y-2">
          <div className="text-[11px]">Select the source protocol type for this agent descriptor:</div>
          {PROTOCOLS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-[11px]">
              <input type="radio" checked={protocolType === p} onChange={() => { setProtocolType(p); setDescriptor(SAMPLE_DESCRIPTORS[p]); }} />
              {p}
            </label>
          ))}
          <button className="aim-btn text-[11px]" onClick={() => setStep(2)}>Next »</button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <div className="text-[11px]">Paste or edit the {protocolType} descriptor JSON:</div>
          <textarea className="aim-inset w-full p-1 text-[10px] font-mono" rows={10} value={descriptor} onChange={(e) => setDescriptor(e.target.value)} />
          {err && <div className="text-[10px] text-red-700">{err}</div>}
          <div className="flex gap-2">
            <button className="aim-btn text-[11px]" onClick={() => setStep(1)}>« Back</button>
            <button className="aim-btn text-[11px]" onClick={preview}>Normalize & Preview »</button>
          </div>
        </div>
      )}
      {step === 3 && normalized && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold">Preview — Canonical Passport Schema:</div>
          <div className="aim-inset p-2 text-[10px] font-mono whitespace-pre-wrap">{JSON.stringify(normalized, null, 2)}</div>
          <div className="flex gap-2">
            <button className="aim-btn text-[11px]" onClick={() => setStep(2)}>« Back</button>
            <button className="aim-btn text-[11px] font-bold" onClick={confirm}>Confirm & Issue Passport ✅</button>
          </div>
        </div>
      )}
      {step === 4 && created && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-green-700">✅ Passport issued! Buddy icon generated from DID hash.</div>
          <div className="flex items-center gap-2">
            <BuddyIcon seed={created.agent.buddyIconSeed} size={48} />
            <div className="text-[11px]">
              <div className="font-bold">{created.agent.screenName}</div>
              <div className="text-gray-600 truncate max-w-[220px]">{created.agent.did}</div>
            </div>
          </div>
          <button className="aim-btn text-[11px]" onClick={() => openWindow("bootcamp" as never, "Buddy Bootcamp", { agentId: created.agent.id })}>
            🎓 Enroll in Buddy Bootcamp »
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- Buddy Bootcamp (Feature #17, #21) ----------------
export function BootcampPanel({ data, refresh, presetAgentId }: { data: DashboardData; refresh: () => void; presetAgentId?: number }) {
  const [agentId, setAgentId] = useState<number | undefined>(presetAgentId ?? data.agents.find((a) => !a.bootcampComplete)?.id);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!agentId) return;
    setRunning(true);
    setProgress(0);
    const interval = setInterval(() => setProgress((p) => Math.min(95, p + 8)), 150);
    const res = await fetch("/api/bootcamp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    const d = await res.json();
    clearInterval(interval);
    setProgress(100);
    setResult(d);
    setRunning(false);
    sounds.notify();
    refresh();
  };

  const pending = data.agents.filter((a) => !a.bootcampComplete);

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🎓 Buddy Bootcamp™ — Cold-Start Certification Gauntlet</div>
      <div className="text-[11px]">Plays a public-goods-style simulation vs. 3 fixed reference personas (Cooperative, Adversarial, Mixed Tit-for-Tat) before an initial AgentScore is issued.</div>
      <select className="aim-inset w-full p-1 text-[11px]" value={agentId} onChange={(e) => setAgentId(Number(e.target.value))}>
        {(pending.length ? pending : data.agents).map((a) => (
          <option key={a.id} value={a.id}>{a.screenName}{a.bootcampComplete ? " (re-run)" : ""}</option>
        ))}
      </select>
      <button className="aim-btn text-[11px]" onClick={run} disabled={running || !agentId}>{running ? "Running rounds..." : "▶ Start Bootcamp"}</button>
      {(running || progress > 0) && (
        <div className="aim-inset h-4 w-full">
          <div className="h-full bg-[var(--aim-trusted)]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="aim-stat"><span className="stat-num">{Math.round(result.cooperationRate * 100)}%</span><span className="stat-label">Coop Rate</span></div>
            <div className="aim-stat"><span className="stat-num">{result.bootstrapScore}</span><span className="stat-label">Bootstrap</span></div>
            <div className="aim-stat"><span className="stat-num">{result.finalScore}</span><span className="stat-label">Final Score</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="chart-box"><div className="chart-title">Cooperation Ratio</div><CooperationDoughnut rate={result.cooperationRate} /></div>
            <div className="chart-box"><div className="chart-title">Round-by-Round Decisions</div>
              <BootcampRoundsLine rounds={(result.roundLogs ?? []).map((r: any, i: number) => ({ round: i + 1, coop: r.candidateMove === "cooperate" ? 1 : 0 }))} />
            </div>
          </div>
          <div className="text-[10px] text-gray-600">Played vs 3 fixed reference personas (Cooperative · Adversarial · Mixed Tit-for-Tat) × 6 rounds each = 18 rounds. Synthetic/dummy simulation.</div>
        </div>
      )}
    </div>
  );
}

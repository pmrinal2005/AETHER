"use client";
import { useMemo, useState } from "react";
import { sounds } from "@/lib/store";
import { BuddyIcon, WarningMeter } from "@/components/retro/Chrome";
import {
  ReputationScatter, ModerationBreakdownPie, WarningDistributionBar,
  ProtocolMixPolar, ScoreDistributionHistogram, TrustTierAreaChart,
  AgentBubbleChart, ScoreComparatorBar, DisputesTrendBar,
} from "@/components/charts/Charts";
import { DashboardData, agentName, scoreFor, warningFor } from "@/lib/types";

// ---------------- Analytics Command Center (registry-wide charts hub) ----------------
export function AnalyticsDashboardPanel({ data }: { data: DashboardData }) {
  const scores = data.agents.map((a) => scoreFor(data, a.id) ?? 0);
  const avgScore = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;

  const protocolCounts: Record<string, number> = {};
  data.agents.forEach((a) => { protocolCounts[a.protocolType] = (protocolCounts[a.protocolType] ?? 0) + 1; });

  const buckets: Record<string, number> = { trusted: 0, review: 0, probation: 0, blocked: 0 };
  data.warnings.forEach((w) => { buckets[w.status] = (buckets[w.status] ?? 0) + 1; });

  const modCounts: Record<string, number> = {};
  data.moderationQueue.forEach((m) => { modCounts[m.flagType] = (modCounts[m.flagType] ?? 0) + 1; });

  // Mocked historical trust-tier population trend (demo/dummy data).
  const tierSeries = [0, 1, 2, 3, 4].map((i) => ({
    label: `T-${4 - i}`,
    trusted: Math.max(0, buckets.trusted - (4 - i) + Math.round(Math.sin(i) * 1)),
    review: Math.max(0, buckets.review + (4 - i) - 1),
    probation: Math.max(0, buckets.probation + ((4 - i) % 2)),
    blocked: Math.max(0, buckets.blocked),
  }));

  const bubblePoints = data.agents.map((a) => {
    const w = warningFor(data, a.id);
    const score = scoreFor(data, a.id) ?? 500;
    const conns = data.edges.filter((e) => e.fromAgentId === a.id || e.toAgentId === a.id).length;
    const bad = (w?.warningPct ?? 0) > 60;
    return { x: score, y: w?.warningPct ?? 0, r: 5 + conns * 1.5, label: `${a.screenName} (${score})`, color: bad ? "#c1121f" : "#2e8b22" };
  });

  const disputeWeeks = [0, 1, 2, 3].map((wk) => data.disputes.filter((_, i) => i % 4 === wk).length + wk);

  const flagged = data.moderationQueue.length;
  const pending = data.moderationQueue.filter((m) => m.status === "pending").length;

  const stats = [
    { num: data.agents.length, label: "Agents" },
    { num: avgScore, label: "Avg Score" },
    { num: buckets.trusted, label: "Trusted" },
    { num: buckets.probation + buckets.blocked, label: "At Risk" },
    { num: pending, label: "Mod Pending" },
    { num: data.peers.length, label: "Fed Peers" },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="pixel-heading text-[12px]">📊 Trust Analytics Command Center</div>
      <div className="text-[10px] text-gray-600">Registry-wide dashboard — all charts rendered with Chart.js. Data is synthetic/dummy for demo.</div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="aim-stat">
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="chart-box"><div className="chart-title">Score Distribution</div><ScoreDistributionHistogram scores={scores} /></div>
        <div className="chart-box"><div className="chart-title">Protocol Mix</div><ProtocolMixPolar counts={protocolCounts} /></div>
        <div className="chart-box"><div className="chart-title">Trust-Tier Population (trend)</div><TrustTierAreaChart series={tierSeries} /></div>
        <div className="chart-box"><div className="chart-title">Warning-Tier Breakdown</div><WarningDistributionBar buckets={buckets} /></div>
        <div className="chart-box"><div className="chart-title">Moderation Flags</div><ModerationBreakdownPie counts={Object.keys(modCounts).length ? modCounts : { benign: 1 }} /></div>
        <div className="chart-box"><div className="chart-title">Disputes Trend</div><DisputesTrendBar counts={disputeWeeks} /></div>
        <div className="chart-box sm:col-span-2"><div className="chart-title">Agent Risk Map (score × warning × connectivity)</div><AgentBubbleChart points={bubblePoints} /></div>
        <div className="chart-box sm:col-span-2"><div className="chart-title">Top Agents by Score</div><ScoreComparatorBar names={data.agents.slice(0, 10).map((a) => a.screenName)} scores={data.agents.slice(0, 10).map((a) => scoreFor(data, a.id) ?? 0)} /></div>
      </div>
    </div>
  );
}

// ---------------- Dynamic Reputation Graph Visualizer (Feature #16, #22) ----------------
export function ReputationGraphPanel({ data }: { data: DashboardData }) {
  const points = useMemo(() => {
    return data.agents.map((a, i) => {
      const w = warningFor(data, a.id);
      const bad = (w?.warningPct ?? 0) > 60;
      const angle = (i / data.agents.length) * Math.PI * 2;
      const cluster = bad ? { x: 8 + Math.cos(angle) * 1.2, y: 2 + Math.sin(angle) * 1.2 } : { x: 4 + Math.cos(angle) * 3, y: 6 + Math.sin(angle) * 3 };
      const score = scoreFor(data, a.id) ?? 500;
      return { x: cluster.x, y: score / 100, label: `${a.screenName} (${score})`, color: bad ? "#c1121f" : "#2e8b22" };
    });
  }, [data]);

  const direct = data.edges.filter((e) => e.edgeType === "direct").length;
  const gossip = data.edges.filter((e) => e.edgeType === "gossip").length;

  const bubblePoints = data.agents.map((a) => {
    const w = warningFor(data, a.id);
    const score = scoreFor(data, a.id) ?? 500;
    const conns = data.edges.filter((e) => e.fromAgentId === a.id || e.toAgentId === a.id).length;
    const bad = (w?.warningPct ?? 0) > 60;
    return { x: score, y: w?.warningPct ?? 0, r: 5 + conns * 1.5, label: `${a.screenName} — ${conns} links`, color: bad ? "#c1121f" : "#2e8b22" };
  });

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🕸️ Dynamic Reputation Graph Visualizer</div>
      <div className="text-[11px]">Direct edges: <b>{direct}</b> | Gossip edges: <b>{gossip}</b>. Isolated red cluster = flagged bad actors.</div>
      <div className="chart-box"><div className="chart-title">Cluster Spread vs Trust Weight</div><ReputationScatter points={points} /></div>
      <div className="chart-box"><div className="chart-title">Connectivity Bubble Map (size = # of edges)</div><AgentBubbleChart points={bubblePoints} /></div>
      <div className="flex gap-3 text-[10px]">
        <span><span className="status-dot status-trusted" /> Cooperative cluster</span>
        <span><span className="status-dot status-blocked" /> Isolated bad actor</span>
      </div>
    </div>
  );
}

// ---------------- Moderation Queue Console + AI Moderator Buddy (Feature #7-9, #29-40) ----------------
export function ModerationQueuePanel({ data, refresh }: { data: DashboardData; refresh: () => void }) {
  const [popup, setPopup] = useState<any>(null);
  const pending = data.moderationQueue.filter((m) => m.status === "pending");

  const act = async (id: number, action: "approved" | "timeout" | "revoked") => {
    await fetch("/api/moderation-queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reviewedBy: "admin" }),
    });
    sounds.warning();
    setPopup(null);
    refresh();
  };

  const counts: Record<string, number> = {};
  data.moderationQueue.forEach((m) => { counts[m.flagType] = (counts[m.flagType] ?? 0) + 1; });

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🚨 Moderation Queue</div>
      <ModerationBreakdownPie counts={counts} />
      <div className="space-y-1">
        {pending.map((m) => (
          <div key={m.id} className="aim-inset p-2 flex items-center gap-2 text-[11px]">
            <BuddyIcon seed={agentName(data, m.agentId)} size={24} />
            <div className="flex-1">
              <div className="font-bold">{agentName(data, m.agentId)}</div>
              <div>{m.flagType} — {Math.round(m.aiConfidence * 100)}% confidence</div>
            </div>
            <button className="aim-btn text-[10px]" onClick={() => setPopup(m)}>Review</button>
          </div>
        ))}
        {pending.length === 0 && <div className="text-[11px] text-gray-500">Queue is clear. ✅</div>}
      </div>

      {popup && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 3000, background: "rgba(0,0,0,0.35)" }}>
          <div className="aim-window w-80">
            <div className="aim-titlebar">📬 You've Got Moderation!</div>
            <div className="p-3 space-y-2 bg-white">
              <div className="text-[11px]">Agent: <b>{agentName(data, popup.agentId)}</b></div>
              <div className="text-[11px]">Flag: <b>{popup.flagType}</b></div>
              <div className="text-[11px]">AI Confidence: <b>{Math.round(popup.aiConfidence * 100)}%</b></div>
              <div className="flex gap-2 pt-2">
                <button className="aim-btn text-[10px] flex-1" onClick={() => act(popup.id, "approved")}>✅ Approve</button>
                <button className="aim-btn text-[10px] flex-1" onClick={() => act(popup.id, "timeout")}>⏸ Timeout</button>
                <button className="aim-btn text-[10px] flex-1 bg-red-200" onClick={() => act(popup.id, "revoked")}>⛔ Revoke</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Warning Level Panel used inside Provenance/Profile could reuse WarningMeter ----------------
export function WarningOverviewPanel({ data }: { data: DashboardData }) {
  const buckets: Record<string, number> = { trusted: 0, review: 0, probation: 0, blocked: 0 };
  data.warnings.forEach((w) => { buckets[w.status] = (buckets[w.status] ?? 0) + 1; });
  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">Warning Level % + Probation Ladder</div>
      <WarningDistributionBar buckets={buckets} />
      <div className="grid grid-cols-2 gap-2">
        {data.warnings.map((w) => (
          <div key={w.id} className="aim-inset p-2">
            <div className="text-[11px] font-bold">{agentName(data, w.agentId)}</div>
            <WarningMeter pct={w.warningPct} status={w.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Guardian Console (Feature #21, #37-39) ----------------
export function GuardianConsolePanel({ data, refresh }: { data: DashboardData; refresh: () => void }) {
  const [selected, setSelected] = useState<number | undefined>(data.delegations[0]?.id);
  const deleg = data.delegations.find((d) => d.id === selected);
  const [rules, setRules] = useState<any>(deleg?.guardianRules ?? { activeHours: { start: "09:00", end: "18:00" }, blockedCategories: [], actionCeiling: 100, autoApprove: false });
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = (id: number) => {
    setSelected(id);
    const d = data.delegations.find((x) => x.id === id);
    setRules(d?.guardianRules ?? {});
  };

  const save = async () => {
    if (!selected) return;
    await fetch("/api/delegation-graph", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected, guardianRules: rules }),
    });
    refresh();
  };

  const testAction = () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
    const inWindow = rules.activeHours ? hh >= rules.activeHours.start && hh <= rules.activeHours.end : true;
    if (!inWindow) {
      setTestResult(`❌ BLOCKED — simulated action at ${hh} is outside allowed hours (${rules.activeHours.start}–${rules.activeHours.end}).`);
    } else {
      setTestResult(`✅ ALLOWED — simulated action at ${hh} passes Guardian rules.`);
    }
  };

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🛡️ Guardian Console — Fleet Governance ("Parental Controls")</div>
      <select className="aim-inset w-full p-1 text-[11px]" value={selected} onChange={(e) => load(Number(e.target.value))}>
        {data.delegations.map((d) => (
          <option key={d.id} value={d.id}>{agentName(data, d.parentAgentId)} → {agentName(data, d.subAgentId)}</option>
        ))}
      </select>
      {selected && (
        <div className="space-y-2 aim-inset p-2">
          <div className="text-[11px] font-bold">Time-of-Day Limits</div>
          <div className="flex gap-2">
            <input type="time" className="aim-inset p-1 text-[11px]" value={rules.activeHours?.start ?? "09:00"} onChange={(e) => setRules({ ...rules, activeHours: { ...rules.activeHours, start: e.target.value } })} />
            <input type="time" className="aim-inset p-1 text-[11px]" value={rules.activeHours?.end ?? "18:00"} onChange={(e) => setRules({ ...rules, activeHours: { ...rules.activeHours, end: e.target.value } })} />
          </div>
          <div className="text-[11px] font-bold">Category Blocks (comma separated)</div>
          <input className="aim-inset w-full p-1 text-[11px]" value={(rules.blockedCategories ?? []).join(", ")} onChange={(e) => setRules({ ...rules, blockedCategories: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
          <div className="text-[11px] font-bold">Action/Spend Ceiling</div>
          <input type="number" className="aim-inset w-full p-1 text-[11px]" value={rules.actionCeiling ?? 100} onChange={(e) => setRules({ ...rules, actionCeiling: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={!!rules.autoApprove} onChange={(e) => setRules({ ...rules, autoApprove: e.target.checked })} />
            Auto-approve routine sub-agent actions
          </label>
          <div className="flex gap-2">
            <button className="aim-btn text-[11px]" onClick={save}>💾 Save Rules</button>
            <button className="aim-btn text-[11px]" onClick={testAction}>🧪 Test Simulated Action Now</button>
          </div>
          {testResult && <div className="text-[11px] font-bold">{testResult}</div>}
        </div>
      )}
    </div>
  );
}

// ---------------- Delegation Graph / Buddy Tree (Feature #5, #15) ----------------
export function DelegationTreePanel({ data, refresh }: { data: DashboardData; refresh: () => void }) {
  const [parentId, setParentId] = useState<number | undefined>(data.agents[0]?.id);
  const [subId, setSubId] = useState<number | undefined>(data.agents[1]?.id);
  const [scopes, setScopes] = useState("read:data");

  const parents = Array.from(new Set(data.delegations.map((d) => d.parentAgentId)));

  const addSub = async () => {
    if (!parentId || !subId) return;
    await fetch("/api/delegation-graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentAgentId: parentId, subAgentId: subId, scopes: scopes.split(",").map((s) => s.trim()) }),
    });
    refresh();
  };

  return (
    <div className="p-3 space-y-3">
      <div className="pixel-heading text-[12px]">🌳 Delegation Graph — "Buddy Tree"</div>
      {parents.map((pid) => (
        <div key={pid} className="aim-inset p-2">
          <div className="font-bold text-[11px] flex items-center gap-2"><BuddyIcon seed={agentName(data, pid)} size={22} />{agentName(data, pid)}</div>
          <div className="pl-4 border-l-2 border-gray-400 ml-2 mt-1 space-y-1">
            {data.delegations.filter((d) => d.parentAgentId === pid).map((d) => (
              <div key={d.id} className="text-[10px] flex items-center gap-2">
                <span>└─</span>
                <BuddyIcon seed={agentName(data, d.subAgentId)} size={18} />
                <span className="font-semibold">{agentName(data, d.subAgentId)}</span>
                <span className="text-gray-500">scopes: {(d.scopes || []).join(", ")}</span>
                <span className="text-gray-500">{d.expiry ? `exp ${new Date(d.expiry).toLocaleDateString()}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="aim-inset p-2 space-y-1">
        <div className="text-[11px] font-bold">+ Add Sub-Agent</div>
        <select className="aim-inset w-full p-1 text-[11px]" value={parentId} onChange={(e) => setParentId(Number(e.target.value))}>
          {data.agents.map((a) => <option key={a.id} value={a.id}>{a.screenName}</option>)}
        </select>
        <select className="aim-inset w-full p-1 text-[11px]" value={subId} onChange={(e) => setSubId(Number(e.target.value))}>
          {data.agents.map((a) => <option key={a.id} value={a.id}>{a.screenName}</option>)}
        </select>
        <input className="aim-inset w-full p-1 text-[11px]" value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="scopes, comma separated" />
        <button className="aim-btn text-[11px]" onClick={addSub}>Add Delegation</button>
      </div>
    </div>
  );
}

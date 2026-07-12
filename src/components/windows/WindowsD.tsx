"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAimStore, sounds } from "@/lib/store";
import { BuddyIcon, StatusDot, Marquee, WarningMeter } from "@/components/retro/Chrome";
import { ScoreBreakdownBar, CapabilityRadar } from "@/components/charts/Charts";
import { DashboardData, scoreFor, warningFor, statusFor, agentName } from "@/lib/types";

// ---------------- Buddy List (Feature #41-42, #52-55) ----------------
export function BuddyListPanel({ data, personaId, refresh }: { data: DashboardData; personaId: number | null; refresh: () => void }) {
  const openWindow = useAimStore((s) => s.openWindow);
  const [menu, setMenu] = useState<{ x: number; y: number; agentId: number } | null>(null);
  const prevStatuses = useRef<Record<number, string>>({});

  useEffect(() => {
    data.agents.forEach((a) => {
      const prev = prevStatuses.current[a.id];
      if (prev && prev !== "revoked" && a.status === "revoked") sounds.revoke();
      prevStatuses.current[a.id] = a.status;
    });
  }, [data.agents]);

  const groups: Record<string, typeof data.agents> = { Trusted: [], Review: [], Probation: [], Blocked: [], Offline: [] };
  for (const a of data.agents) {
    const w = warningFor(data, a.id);
    if (a.status === "revoked" || a.status === "suspended") groups.Offline.push(a);
    else if (w?.status === "blocked") groups.Blocked.push(a);
    else if (w?.status === "probation") groups.Probation.push(a);
    else if (w?.status === "review") groups.Review.push(a);
    else groups.Trusted.push(a);
  }

  const me = data.agents.find((a) => a.id === personaId);

  return (
    <div className="flex flex-col h-full" onClick={() => setMenu(null)}>
      <div className="p-1 border-b border-gray-400 bg-white">
        <div className="flex items-center gap-2 px-1 py-1">
          <BuddyIcon seed={me?.buddyIconSeed ?? "guest"} size={28} />
          <div className="text-[11px]">
            <div className="font-bold">{me?.screenName ?? "Guest"}</div>
            <div className="text-gray-500">{statusFor(data, personaId ?? -1)?.message?.slice(0, 30) || "Online"}</div>
          </div>
        </div>
      </div>
      <Marquee text="🚨 AIM WARNING NETWORK ACTIVE — 2 agents under review — TrustFederation sync live — Buddy Bootcamp enrollment open — 🚨" />
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groups).map(([label, list]) => (
          <div key={label}>
            <div className="bg-[var(--aim-blue-light)] px-2 py-0.5 text-[11px] font-bold flex justify-between">
              <span>{label}</span>
              <span>({list.length})</span>
            </div>
            {list.map((a) => {
              const score = scoreFor(data, a.id);
              const w = warningFor(data, a.id);
              const st = statusFor(data, a.id);
              const cracked = (w?.warningPct ?? 0) > 60;
              return (
                <div
                  key={a.id}
                  className="px-2 py-1 flex items-center gap-2 hover:bg-[var(--aim-blue-light)] cursor-pointer text-[11px]"
                  onDoubleClick={() => openWindow(`chat:${a.id}`, `IM with ${a.screenName}`, { peerId: a.id })}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, agentId: a.id });
                  }}
                >
                  <BuddyIcon seed={a.buddyIconSeed} size={22} cracked={cracked} />
                  <StatusDot status={st?.status ?? "offline"} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{a.screenName}</div>
                    <div className="truncate text-gray-500">{st?.message || "—"}</div>
                  </div>
                  <div className="text-[10px] font-bold">{score ?? "—"}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {menu && (
        <div className="aim-window absolute bg-white" style={{ left: menu.x, top: menu.y, zIndex: 2000, width: 160 }}>
          {[
            ["View Profile", () => openWindow(`profile:${menu.agentId}` as never, `Profile: ${agentName(data, menu.agentId)}`)],
            ["IM", () => openWindow(`chat:${menu.agentId}` as never, `IM with ${agentName(data, menu.agentId)}`, { peerId: menu.agentId })],
            ["Report Abuse", () => openWindow(`profile:${menu.agentId}` as never, `Profile: ${agentName(data, menu.agentId)}`, { reportOpen: true })],
            ["Remove Buddy", () => {}],
          ].map(([label, fn]) => (
            <div key={label as string} className="px-2 py-1 text-[11px] hover:bg-[var(--aim-blue-mid)] hover:text-white" onClick={fn as () => void}>
              {label as string}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- IM Chat Simulator (Feature #43-45, #59-60) ----------------
type ChatMsg = { id: number; fromAgentId: number | null; fromLabel: string; body: string; flagged: boolean; createdAt: string };

export function ChatWindowPanel({ peerId, personaId, data, refresh }: { peerId: number; personaId: number | null; data: DashboardData; refresh: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [turn, setTurn] = useState(0);
  const [modAlert, setModAlert] = useState<string | null>(null);
  const roomId = `demo-room-${Math.min(personaId ?? 0, peerId)}-${Math.max(personaId ?? 0, peerId)}`;
  const peer = data.agents.find((a) => a.id === peerId);
  const me = data.agents.find((a) => a.id === personaId);

  const load = () => fetch(`/api/chat/simulate?roomId=${roomId}`).then((r) => r.json()).then((d) => setMessages(d.messages ?? []));
  useEffect(() => { load(); }, []);

  const nextTurn = async () => {
    setTyping(true);
    const speaker = turn % 2 === 0 ? me : peer;
    const res = await fetch("/api/chat/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, fromAgentId: speaker?.id ?? null, fromLabel: speaker?.screenName ?? "Buddy", turn }),
    });
    const d = await res.json();
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, d.message]);
      sounds.imReceived();
      if (d.moderation) {
        setModAlert(`⚠️ Moderation flag: ${d.moderation.flagType} (${Math.round(d.moderation.aiConfidence * 100)}% confidence)`);
        sounds.warning();
        refresh();
      }
      setTurn((t) => t + 1);
    }, 700);
  };

  const exportChat = () => {
    const text = messages.map((m) => `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.fromLabel}: ${m.body}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aim-chat-${roomId}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      {modAlert && (
        <div className="bg-red-600 text-white text-[11px] px-2 py-1 flex justify-between items-center">
          <span>{modAlert}</span>
          <button className="aim-btn text-[9px]" onClick={() => setModAlert(null)}>Dismiss</button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
        {messages.map((m) => (
          <div key={m.id} className={m.flagged ? "border border-red-500 bg-red-50 p-1" : ""}>
            <span className="font-bold text-[11px]">{m.fromLabel}:</span> <span className="text-[11px]">{m.body}</span>
          </div>
        ))}
        {typing && <div className="text-[10px] italic text-gray-500">{(turn % 2 === 0 ? me?.screenName : peer?.screenName)} is typing...</div>}
      </div>
      <div className="p-1 border-t border-gray-400 flex gap-1 bg-[var(--aim-face)]">
        <button className="aim-btn text-[11px] flex-1" onClick={nextTurn}>▶ Simulate Next Turn</button>
        <button className="aim-btn text-[11px]" onClick={exportChat}>Export</button>
      </div>
    </div>
  );
}

// ---------------- Status Broadcast (Feature #46-47) ----------------
export function StatusBroadcastPanel({ personaId, data, refresh }: { personaId: number | null; data: DashboardData; refresh: () => void }) {
  const current = statusFor(data, personaId ?? -1);
  const [status, setStatus] = useState(current?.status ?? "active");
  const [message, setMessage] = useState(current?.message ?? "");

  const save = async () => {
    await fetch("/api/status-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: personaId, status, message }),
    });
    refresh();
  };

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">Away Message / Status Broadcasting</div>
      <label className="text-[11px] block">Status:</label>
      <select className="aim-inset w-full p-1 text-[11px]" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="active">Active</option>
        <option value="busy">Busy</option>
        <option value="suspended">Suspended</option>
        <option value="revoked">Revoked</option>
      </select>
      <label className="text-[11px] block">Away Message:</label>
      <textarea className="aim-inset w-full p-1 text-[11px]" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      <button className="aim-btn text-[11px]" onClick={save}>Broadcast Status</button>
      <div className="pt-2">
        <div className="text-[11px] font-bold mb-1">Live Ticker Preview:</div>
        <Marquee text={`${data.agents.find(a=>a.id===personaId)?.screenName ?? "You"} is now ${status.toUpperCase()} — "${message || "no message set"}"`} />
      </div>
    </div>
  );
}

// ---------------- Agent Profile (with Report Abuse) ----------------
export function AgentProfilePanel({ agentId, personaId, data, refresh, reportOpen }: { agentId: number; personaId: number | null; data: DashboardData; refresh: () => void; reportOpen?: boolean }) {
  const agent = data.agents.find((a) => a.id === agentId);
  const score = scoreFor(data, agentId);
  const warning = warningFor(data, agentId);
  const st = statusFor(data, agentId);
  const [showReport, setShowReport] = useState(!!reportOpen);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const breakdown = (data.latestScores.find((s) => s.agent_id === agentId)?.score_breakdown ?? {}) as Record<string, number>;
  const caps = (agent?.capabilities || []).slice(0, 6);

  if (!agent) return <div className="p-3 text-[11px]">Agent not found.</div>;

  const submitReport = async () => {
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterAgentId: personaId, reportedAgentId: agentId, reason }),
    });
    const d = await res.json();
    setSubmitted(`Flagged as "${d.moderation.flagType}" (${Math.round(d.moderation.aiConfidence * 100)}%) — sent to Moderation Queue.`);
    sounds.notify();
    refresh();
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-3">
        <BuddyIcon seed={agent.buddyIconSeed} size={48} cracked={(warning?.warningPct ?? 0) > 60} />
        <div>
          <div className="font-bold text-[13px]">{agent.screenName}</div>
          <div className="text-[10px] text-gray-600">{agent.did}</div>
          <div className="text-[11px]">Operator: {agent.operatorName}</div>
        </div>
      </div>
      <div className="aim-inset p-2 text-[11px] space-y-1">
        <div>AgentScore: <b>{score ?? "—"} / 999</b></div>
        <WarningMeter pct={warning?.warningPct ?? 0} status={warning?.status ?? "trusted"} />
        <div>Status: <b className="uppercase">{st?.status}</b> — {st?.message}</div>
        <div>Protocol: {agent.protocolType} | Capabilities: {(agent.capabilities || []).join(", ")}</div>
        <div>Bootcamp: {agent.bootcampComplete ? "✅ Certified" : "⏳ Pending"}</div>
      </div>
      {Object.keys(breakdown).length > 0 && (
        <div className="chart-box"><div className="chart-title">Score Breakdown (components)</div><ScoreBreakdownBar breakdown={breakdown} /></div>
      )}
      {caps.length > 0 && (
        <div className="chart-box"><div className="chart-title">Capability Coverage</div>
          <CapabilityRadar labels={caps} values={caps.map((_, i) => 40 + ((i * 37 + agent.id * 13) % 60))} />
        </div>
      )}
      <div className="flex gap-2">
        <button className="aim-btn text-[11px] bg-red-100" onClick={() => setShowReport((s) => !s)}>🚩 Report Abuse</button>
      </div>
      {showReport && (
        <div className="aim-inset p-2 space-y-1">
          <textarea className="aim-inset w-full p-1 text-[11px]" rows={3} placeholder="Describe the incident (e.g. suspected prompt injection, impersonation)..." value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="aim-btn text-[11px]" onClick={submitReport} disabled={!reason}>Submit Report</button>
          {submitted && <div className="text-[10px] text-green-700">{submitted}</div>}
        </div>
      )}
    </div>
  );
}

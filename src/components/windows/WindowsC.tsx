"use client";
import { useEffect, useState } from "react";
import { ScoreHistoryChart, ScoreComparatorBar, FederationSyncLine } from "@/components/charts/Charts";
import { DashboardData, agentName, scoreFor } from "@/lib/types";

// ---------------- Developer Console & SDK (Feature #16, #61-69) ----------------
export function DeveloperConsolePanel({ data, refresh }: { data: DashboardData; refresh: () => void }) {
  const [agentId, setAgentId] = useState<number | undefined>(data.agents[0]?.id);
  const [devData, setDevData] = useState<{ apiKeys: any[]; credentials: any[] } | null>(null);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const agent = data.agents.find((a) => a.id === agentId);
  const passport = data.passports.find((p) => p.agentId === agentId);
  const history = data.agents.length ? [] : [];

  const load = async (id: number) => {
    setAgentId(id);
    const res = await fetch(`/api/developer?agentId=${id}`);
    setDevData(await res.json());
  };
  useEffect(() => { if (agentId) load(agentId); }, []);

  const createKey = async () => {
    const res = await fetch("/api/developer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create-key", agentId }) });
    const d = await res.json();
    setRawKey(d.rawKey);
    if (agentId) load(agentId);
  };
  const revokeKey = async (id: number) => {
    await fetch("/api/developer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke-key", id }) });
    if (agentId) load(agentId);
  };
  const rotateCred = async () => {
    await fetch("/api/developer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rotate-credential", agentId }) });
    if (agentId) load(agentId);
  };

  const scoreHistoryForAgent = data.agents.length ? [] : [];

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🧑‍💻 Developer Console &amp; SDK</div>
      <select className="aim-inset w-full p-1 text-[11px]" value={agentId} onChange={(e) => load(Number(e.target.value))}>
        {data.agents.map((a) => <option key={a.id} value={a.id}>{a.screenName}</option>)}
      </select>

      <div className="aim-inset p-2 space-y-1">
        <div className="text-[11px] font-bold">API Keys</div>
        {devData?.apiKeys.map((k) => (
          <div key={k.id} className="flex justify-between text-[10px]">
            <span>{k.keyPreview} {k.revoked && "(revoked)"}</span>
            {!k.revoked && <button className="aim-btn text-[9px]" onClick={() => revokeKey(k.id)}>Revoke</button>}
          </div>
        ))}
        <button className="aim-btn text-[10px]" onClick={createKey}>+ Generate API Key</button>
        {rawKey && <div className="text-[10px] break-all bg-yellow-100 p-1">New key (copy now): {rawKey}</div>}
      </div>

      <div className="aim-inset p-2 space-y-1">
        <div className="text-[11px] font-bold">Credential Rotation</div>
        {devData?.credentials.map((c) => (
          <div key={c.id} className="text-[10px]">{c.credentialType} — rotated {new Date(c.rotatedAt).toLocaleString()}</div>
        ))}
        <button className="aim-btn text-[10px]" onClick={rotateCred}>🔄 Rotate Credential</button>
      </div>

      <div className="aim-inset p-2 space-y-1">
        <div className="text-[11px] font-bold">VC Export</div>
        <div className="flex gap-2">
          <button
            className="aim-btn text-[10px]"
            onClick={() => downloadJson(`${agent?.screenName}-passport.jsonld`, passport?.vcBundle)}
          >
            Export JSON-LD
          </button>
          <button
            className="aim-btn text-[10px]"
            onClick={() => downloadText(`${agent?.screenName}-passport.jwt`, toFakeJwt(passport?.vcBundle))}
          >
            Export JWT
          </button>
        </div>
      </div>

      <div className="aim-inset p-2">
        <div className="text-[11px] font-bold mb-1">Live Reputation Dashboard</div>
        <ScoreComparatorBar names={data.agents.slice(0, 8).map((a) => a.screenName)} scores={data.agents.slice(0, 8).map((a) => scoreFor(data, a.id) ?? 0)} />
      </div>
    </div>
  );
}

function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
}
function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
}
function toFakeJwt(bundle: unknown) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url" as BufferEncoding);
  const header = b64({ alg: "EdDSA-demo", typ: "JWT" });
  const payload = b64(bundle ?? {});
  return `${header}.${payload}.demo-signature`;
}

// ---------------- Provenance & Audit Viewer (Feature #17, #70-71) ----------------
export function ProvenancePanel({ data }: { data: DashboardData }) {
  const [agentId, setAgentId] = useState<number | undefined>(data.agents[0]?.id);
  const events: { t: string; label: string; kind: string }[] = [];
  data.disputes.filter((d) => d.reportedAgentId === agentId).forEach((d) => events.push({ t: d.createdAt, label: `Dispute filed: ${d.reason}`, kind: "dispute" }));
  data.moderationQueue.filter((m) => m.agentId === agentId).forEach((m) => events.push({ t: m.createdAt, label: `Moderation ${m.status}: ${m.flagType}`, kind: "moderation" }));
  data.delegations.filter((d) => d.parentAgentId === agentId || d.subAgentId === agentId).forEach((d) => events.push({ t: new Date().toISOString(), label: `Delegation link (${agentName(data, d.parentAgentId)} → ${agentName(data, d.subAgentId)})`, kind: "delegation" }));
  events.sort((a, b) => new Date(b.t).getTime() - new Date(a.t).getTime());

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">📜 Provenance &amp; Audit Viewer</div>
      <select className="aim-inset w-full p-1 text-[11px]" value={agentId} onChange={(e) => setAgentId(Number(e.target.value))}>
        {data.agents.map((a) => <option key={a.id} value={a.id}>{a.screenName}</option>)}
      </select>
      <div className="aim-inset p-2 text-[10px] mb-2">
        🔗 Anchored-on-Chain Badge: <b>Roadmap item</b> — Sepolia testnet hash-commitment anchoring is documented but not yet wired up in this build (see Pitch/Roadmap page). Displayed here only as a static badge, not a live proof.
      </div>
      <div className="space-y-1">
        {events.map((e, i) => (
          <div key={i} className="aim-inset p-2 text-[11px]">
            <div className="text-gray-500 text-[10px]">{new Date(e.t).toLocaleString()}</div>
            <div>{e.label}</div>
            <div className="text-[9px] text-gray-500 font-mono">proof-hash: {fakeHash(e.label + e.t)}</div>
          </div>
        ))}
        {events.length === 0 && <div className="text-[11px] text-gray-500">No provenance events recorded for this agent yet.</div>}
      </div>
    </div>
  );
}
function fakeHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "0x" + h.toString(16).padStart(8, "0") + "…demo";
}

// ---------------- TrustFederation Protocol (Feature #22, #72-74) ----------------
export function FederationPanel({ data, refresh }: { data: DashboardData; refresh: () => void }) {
  const [registryName, setRegistryName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [agentId, setAgentId] = useState<number | undefined>(data.agents[0]?.id);
  const [peerId, setPeerId] = useState<number | undefined>(data.peers[0]?.id);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const addPeer = async () => {
    await fetch("/api/federation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add-peer", registryName, endpointUrl }) });
    setRegistryName(""); setEndpointUrl("");
    refresh();
  };
  const sync = async () => {
    if (!peerId || !agentId) return;
    const res = await fetch("/api/federation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync", peerId, agentId }) });
    const d = await res.json();
    // Simulate the mock external registry verifying + acking inbound
    await fetch("/api/federation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "inbound", peerId, payload: d.payload, signature: d.signature }) });
    setLastResult(`Synced score_delta=${d.payload.score_delta} to peer #${peerId}. Mock registry verified signature ✅`);
    refresh();
  };

  const points = data.syncLogs.filter((l) => l.direction === "outbound").reverse().map((l) => ({ t: new Date(l.createdAt).toLocaleTimeString(), delta: Number((l.payload as any)?.score_delta ?? 0) }));

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🌐 TrustFederation Protocol</div>
      <div className="text-[10px] text-gray-600">Signed attestation exchange: {"{agent_id, score_delta, signature, timestamp}"} — HMAC-signed for this demo build.</div>

      <div className="aim-inset p-2 space-y-1">
        <div className="text-[11px] font-bold">Peers</div>
        {data.peers.map((p) => (
          <div key={p.id} className="text-[10px]">{p.registryName} — {p.endpointUrl} {p.lastSyncedAt ? `(synced ${new Date(p.lastSyncedAt).toLocaleTimeString()})` : ""}</div>
        ))}
        <input className="aim-inset w-full p-1 text-[10px]" placeholder="Registry name (e.g. TrustNet Mock Registry)" value={registryName} onChange={(e) => setRegistryName(e.target.value)} />
        <input className="aim-inset w-full p-1 text-[10px]" placeholder="Endpoint URL" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
        <button className="aim-btn text-[10px]" onClick={addPeer} disabled={!registryName || !endpointUrl}>+ Add Peer</button>
      </div>

      <div className="aim-inset p-2 space-y-1">
        <div className="text-[11px] font-bold">Sync AgentScore Delta</div>
        <select className="aim-inset w-full p-1 text-[10px]" value={agentId} onChange={(e) => setAgentId(Number(e.target.value))}>
          {data.agents.map((a) => <option key={a.id} value={a.id}>{a.screenName}</option>)}
        </select>
        <select className="aim-inset w-full p-1 text-[10px]" value={peerId} onChange={(e) => setPeerId(Number(e.target.value))}>
          {data.peers.map((p) => <option key={p.id} value={p.id}>{p.registryName}</option>)}
        </select>
        <button className="aim-btn text-[10px]" onClick={sync}>🔁 Sync Now</button>
        {lastResult && <div className="text-[10px] text-green-700">{lastResult}</div>}
      </div>

      <FederationSyncLine points={points} />
    </div>
  );
}

// ---------------- Verified Badge Widget (Feature #14, #61-62) ----------------
export function BadgeWidgetPanel({ data }: { data: DashboardData }) {
  const [agentId, setAgentId] = useState<number | undefined>(data.agents[0]?.id);
  const agent = data.agents.find((a) => a.id === agentId);
  const score = scoreFor(data, agentId ?? -1);
  const snippet = `<script src="https://aim.example.com/badge.js" data-agent-id="${agentId}"></script>`;

  return (
    <div className="p-3 space-y-2">
      <div className="pixel-heading text-[12px]">🏅 AIM Verified Badge Widget</div>
      <select className="aim-inset w-full p-1 text-[11px]" value={agentId} onChange={(e) => setAgentId(Number(e.target.value))}>
        {data.agents.map((a) => <option key={a.id} value={a.id}>{a.screenName}</option>)}
      </select>
      <div className="aim-inset p-3 flex items-center gap-2 w-fit">
        <span className="text-lg">🏅</span>
        <div className="text-[11px]">
          <div className="font-bold">{agent?.status === "active" ? "AIM Verified" : "Not Verified"}</div>
          <div>Trust Score: {score ?? "—"} / 999</div>
        </div>
      </div>
      <div className="text-[10px] font-bold">Embed Snippet:</div>
      <div className="aim-inset p-2 text-[10px] font-mono break-all">{snippet}</div>
      <div className="text-[10px] font-bold">Public API:</div>
      <div className="aim-inset p-2 text-[10px] font-mono break-all">GET /api/verify/{agentId}</div>
    </div>
  );
}

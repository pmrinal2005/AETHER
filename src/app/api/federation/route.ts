import { store, nextId } from "@/lib/datastore";
import { signAttestation, verifyAttestation } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = store();
  const logs = [...s.federationSyncLog].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30);
  return Response.json({ peers: s.federationPeers, logs });
}

// TrustFederation Protocol (Feature #22): outbound push + inbound verify against a
// signed attestation payload {agent_id, score_delta, signature, timestamp}. The "mock
// external registry" peer is simulated in-process (self-referential verify).
export async function POST(req: Request) {
  const s = store();
  const body = await req.json();
  const { action } = body as { action: "add-peer" | "sync" | "inbound" };

  if (action === "add-peer") {
    const { registryName, endpointUrl } = body as { registryName: string; endpointUrl: string };
    const peer = {
      id: nextId("federationPeers"),
      registryName,
      endpointUrl,
      publicKey: "demo-pubkey-" + Math.random().toString(36).slice(2, 10),
      lastSyncedAt: null,
    };
    s.federationPeers.push(peer);
    return Response.json({ peer });
  }

  if (action === "sync") {
    const { peerId, agentId } = body as { peerId: number; agentId: number };
    const latest = [...s.scoresHistory.filter((r) => r.agentId === agentId)].sort(
      (a, b) => new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime()
    )[0];
    const agent = s.agents.find((a) => a.id === agentId);
    const payload = {
      agent_id: agent?.did ?? String(agentId),
      score_delta: latest?.score ?? 0,
      timestamp: new Date().toISOString(),
    };
    const signature = signAttestation(payload);
    const log = {
      id: nextId("federationSyncLog"),
      peerId,
      direction: "outbound",
      payload: { ...payload, signature },
      signatureValid: true,
      createdAt: new Date().toISOString(),
    };
    s.federationSyncLog.push(log);
    const peer = s.federationPeers.find((p) => p.id === peerId);
    if (peer) peer.lastSyncedAt = new Date().toISOString();
    return Response.json({ log, payload, signature });
  }

  if (action === "inbound") {
    const { peerId, payload, signature } = body as { peerId: number; payload: Record<string, unknown>; signature: string };
    const valid = verifyAttestation(payload, signature);
    const log = {
      id: nextId("federationSyncLog"),
      peerId,
      direction: "inbound",
      payload,
      signatureValid: valid,
      createdAt: new Date().toISOString(),
    };
    s.federationSyncLog.push(log);
    return Response.json({ log, valid });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}

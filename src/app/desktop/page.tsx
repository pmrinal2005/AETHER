"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAimStore, sounds } from "@/lib/store";
import { RetroWindow, Toolbar2000 } from "@/components/retro/Chrome";
import { Taskbar } from "@/components/retro/Taskbar";
import { WhoisPanel, YellowPagesPanel, NewBuddyWizard, BootcampPanel } from "@/components/windows/WindowsA";
import { ReputationGraphPanel, ModerationQueuePanel, GuardianConsolePanel, DelegationTreePanel } from "@/components/windows/WindowsB";
import { DeveloperConsolePanel, ProvenancePanel, FederationPanel, BadgeWidgetPanel } from "@/components/windows/WindowsC";
import { BuddyListPanel, ChatWindowPanel, StatusBroadcastPanel, AgentProfilePanel } from "@/components/windows/WindowsD";
import { DashboardData } from "@/lib/types";

const EMPTY: DashboardData = {
  agents: [], warnings: [], statuses: [], latestScores: [], disputes: [], moderationQueue: [], edges: [],
  delegations: [], peers: [], syncLogs: [], bootcamps: [], apiKeys: [], passports: [],
};

export default function DesktopPage() {
  const router = useRouter();
  const store = useAimStore();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [toast, setToast] = useState<string[]>([]);
  const cursorRef = useRef(0);
  const [resetting, setResetting] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const d = await res.json();
    setData(d);
  }, []);

  useEffect(() => {
    const personaId = Number(localStorage.getItem("aim_persona_id") ?? "0") || null;
    store.setPersona(personaId);
    store.openWindow("buddylist", "My Buddy List");
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  // Poll simulated Upstash revocation-bus channel for live "Buddy Signed Off" toasts.
  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch(`/api/revocation?since=${cursorRef.current}`);
      const d = await res.json();
      if (d.events?.length) {
        cursorRef.current = Math.max(cursorRef.current, ...d.events.map((e: any) => e.id));
        d.events.forEach((e: any) => {
          setToast((t) => [...t, `📴 Buddy signed off — Agent #${e.agentId} was ${e.eventType}.`]);
          sounds.revoke();
        });
        refresh();
      }
    }, 3500);
    return () => clearInterval(poll);
  }, [refresh]);

  const signOff = () => {
    sounds.signOff();
    router.push("/");
  };

  const resetDemo = async () => {
    setResetting(true);
    await fetch("/api/seed", { method: "POST" });
    await refresh();
    setResetting(false);
  };

  const toolbarAction = (action: string) => {
    if (action === "verify") store.openWindow("badge", "Verified Badge Widget");
    if (action === "provenance") store.openWindow("provenance", "Provenance & Audit Viewer");
    if (action === "moderate") store.openWindow("moderation", "Moderation Queue");
    if (action === "api") store.openWindow("developer", "Developer Console & SDK");
  };

  const renderContent = (key: string, winData?: Record<string, unknown>) => {
    if (key === "buddylist") return <BuddyListPanel data={data} personaId={store.currentPersonaId} refresh={refresh} />;
    if (key === "whois") return <WhoisPanel refresh={refresh} />;
    if (key === "yellowpages") return <YellowPagesPanel data={data} />;
    if (key === "newbuddy") return <NewBuddyWizard refresh={refresh} />;
    if (key === "bootcamp") return <BootcampPanel data={data} refresh={refresh} presetAgentId={winData?.agentId as number | undefined} />;
    if (key === "reputation") return <ReputationGraphPanel data={data} />;
    if (key === "moderation") return <ModerationQueuePanel data={data} refresh={refresh} />;
    if (key === "guardian") return <GuardianConsolePanel data={data} refresh={refresh} />;
    if (key === "delegation") return <DelegationTreePanel data={data} refresh={refresh} />;
    if (key === "developer") return <DeveloperConsolePanel data={data} refresh={refresh} />;
    if (key === "provenance") return <ProvenancePanel data={data} />;
    if (key === "federation") return <FederationPanel data={data} refresh={refresh} />;
    if (key === "badge") return <BadgeWidgetPanel data={data} />;
    if (key === "status") return <StatusBroadcastPanel personaId={store.currentPersonaId} data={data} refresh={refresh} />;
    if (key.startsWith("chat:")) return <ChatWindowPanel peerId={Number(key.split(":")[1])} personaId={store.currentPersonaId} data={data} refresh={refresh} />;
    if (key.startsWith("profile:")) return <AgentProfilePanel agentId={Number(key.split(":")[1])} personaId={store.currentPersonaId} data={data} refresh={refresh} reportOpen={!!winData?.reportOpen} />;
    return <div className="p-3 text-[11px]">Unknown window.</div>;
  };

  return (
    <div className="aim-desktop-bg h-screen w-screen relative overflow-hidden">
      <div className="absolute top-2 right-2 z-[50] flex gap-2">
        <button className="aim-btn text-[10px]" onClick={resetDemo} disabled={resetting}>
          {resetting ? "Reseeding..." : "🔄 Reset Demo Data"}
        </button>
        <button className="aim-btn text-[10px]" onClick={() => router.push("/features")}>📋 100 Features</button>
        <button className="aim-btn text-[10px]" onClick={() => router.push("/pitch")}>🎤 Pitch/Roadmap</button>
      </div>

      <Toolbar2000 onAction={toolbarAction} />

      {store.windows.map((w) => (
        <RetroWindow key={w.key} winKey={w.key} title={w.title} z={w.z} x={w.x} y={w.y} minimized={w.minimized}>
          {renderContent(w.key, w.data)}
        </RetroWindow>
      ))}

      <div className="absolute top-2 left-2 z-[50] flex flex-col gap-2">
        {toast.map((t, i) => (
          <div key={i} className="aim-window w-72">
            <div className="aim-titlebar text-[10px]">📨 You've Got A.I.M.!</div>
            <div className="p-2 text-[10px] bg-white flex justify-between gap-2">
              <span>{t}</span>
              <button className="aim-btn text-[9px]" onClick={() => setToast((arr) => arr.filter((_, idx) => idx !== i))}>x</button>
            </div>
          </div>
        ))}
      </div>

      <Taskbar
        onOpen={(k, t) => store.openWindow(k, t)}
        onSignOff={signOff}
      />
    </div>
  );
}

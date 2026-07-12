"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAimStore, sounds, WindowKey } from "@/lib/store";
import { useIsMobile } from "@/lib/useIsMobile";
import { RetroWindow, Toolbar2000, MobileWindow } from "@/components/retro/Chrome";
import { Taskbar, APPS } from "@/components/retro/Taskbar";
import { WhoisPanel, YellowPagesPanel, NewBuddyWizard, BootcampPanel } from "@/components/windows/WindowsA";
import { ReputationGraphPanel, ModerationQueuePanel, GuardianConsolePanel, DelegationTreePanel, AnalyticsDashboardPanel } from "@/components/windows/WindowsB";
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
  const isMobile = useIsMobile();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [toast, setToast] = useState<string[]>([]);
  const cursorRef = useRef(0);
  const [resetting, setResetting] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (key === "analytics") return <AnalyticsDashboardPanel data={data} />;
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

  const toasts = (
    <div className={isMobile ? "fixed top-1 left-1 right-1 z-[3000] flex flex-col gap-1" : "absolute top-2 left-2 z-[50] flex flex-col gap-2"}>
      {toast.map((t, i) => (
        <div key={i} className="aim-window w-full sm:w-72">
          <div className="aim-titlebar text-[10px]">📨 You&apos;ve Got A.I.M.!</div>
          <div className="p-2 text-[10px] bg-white flex justify-between gap-2">
            <span>{t}</span>
            <button className="aim-btn text-[9px]" onClick={() => setToast((arr) => arr.filter((_, idx) => idx !== i))}>x</button>
          </div>
        </div>
      ))}
    </div>
  );

  // ---------------- MOBILE SHELL ----------------
  if (isMobile) {
    // The top-most (highest z) non-minimized window is the active mobile view.
    const visible = store.windows.filter((w) => !w.minimized);
    const active = visible.length ? visible.reduce((a, b) => (b.z > a.z ? b : a)) : null;
    return (
      <div className="mobile-shell aim-desktop-bg">
        {/* Mobile top bar */}
        <div className="aim-panel flex items-center justify-between px-2 py-1 shrink-0">
          <button className="aim-btn text-[11px] font-bold" onClick={() => setMobileMenu((m) => !m)}>☰ Apps</button>
          <span className="pixel-heading text-[11px]">A.I.M.</span>
          <div className="flex gap-1">
            <button className="aim-btn text-[10px]" onClick={resetDemo} disabled={resetting}>{resetting ? "…" : "🔄"}</button>
            <button className="aim-btn text-[10px]" onClick={signOff}>Off</button>
          </div>
        </div>

        {toasts}

        {/* Active window content */}
        <div className="flex-1 overflow-hidden p-1">
          {active ? (
            <MobileWindow title={active.title} onClose={() => store.closeWindow(active.key)}>
              {renderContent(active.key, active.data)}
            </MobileWindow>
          ) : (
            <div className="mobile-window">
              <div className="aim-titlebar">A.I.M. Desktop</div>
              <div className="p-4 text-[12px] text-center">Tap <b>☰ Apps</b> to open a tool.</div>
            </div>
          )}
        </div>

        {/* App drawer */}
        {mobileMenu && (
          <div className="fixed inset-0 z-[2500]" onClick={() => setMobileMenu(false)}>
            <div className="absolute top-[38px] left-1 right-1 aim-window max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="aim-titlebar">A.I.M. Start — Choose a Tool</div>
              <div className="bg-white grid grid-cols-2">
                {APPS.map((a) => (
                  <div key={a.key} className="px-2 py-2 text-[12px] border-b border-r border-gray-200 flex items-center gap-2 active:bg-[var(--aim-blue-mid)] active:text-white"
                    onClick={() => { store.openWindow(a.key, a.label); setMobileMenu(false); }}>
                    <span>{a.icon}</span><span className="truncate">{a.label}</span>
                  </div>
                ))}
                <div className="px-2 py-2 text-[12px] border-b border-gray-200 flex items-center gap-2" onClick={() => { router.push("/features"); }}>📋 100 Features</div>
                <div className="px-2 py-2 text-[12px] border-b border-gray-200 flex items-center gap-2" onClick={() => { router.push("/pitch"); }}>🎤 Pitch/Roadmap</div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom quick-nav of open windows */}
        <nav className="mobile-nav">
          {store.windows.map((w) => (
            <button key={w.key} className={`aim-btn ${active?.key === w.key ? "font-bold" : ""}`} onClick={() => { store.toggleMinimize(w.key); store.focusWindow(w.key); }}>
              <span>🗔</span><span className="truncate max-w-[52px]">{w.title.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // ---------------- DESKTOP SHELL ----------------
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
        <RetroWindow key={w.key} winKey={w.key as WindowKey} title={w.title} z={w.z} x={w.x} y={w.y} minimized={w.minimized}
          width={w.key === "analytics" ? 680 : 480} height={w.key === "analytics" ? 560 : 420}>
          {renderContent(w.key, w.data)}
        </RetroWindow>
      ))}

      {toasts}

      <Taskbar onOpen={(k, t) => store.openWindow(k, t)} onSignOff={signOff} />
    </div>
  );
}

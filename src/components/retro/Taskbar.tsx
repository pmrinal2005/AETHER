"use client";
import { useEffect, useState } from "react";
import { useAimStore, WindowKey } from "@/lib/store";

export const APPS: { key: WindowKey; label: string; icon: string }[] = [
  { key: "buddylist", label: "Buddy List", icon: "👥" },
  { key: "analytics", label: "Analytics Center", icon: "📊" },
  { key: "whois", label: "AgentWhois", icon: "🔍" },
  { key: "yellowpages", label: "Yellow Pages", icon: "📒" },
  { key: "newbuddy", label: "New Buddy Setup", icon: "🧙" },
  { key: "bootcamp", label: "Buddy Bootcamp", icon: "🎓" },
  { key: "reputation", label: "Reputation Graph", icon: "🕸️" },
  { key: "moderation", label: "Moderation Queue", icon: "🚨" },
  { key: "guardian", label: "Guardian Console", icon: "🛡️" },
  { key: "delegation", label: "Buddy Tree", icon: "🌳" },
  { key: "developer", label: "Developer Console", icon: "🧑‍💻" },
  { key: "provenance", label: "Provenance Viewer", icon: "📜" },
  { key: "federation", label: "TrustFederation", icon: "🌐" },
  { key: "badge", label: "Verified Badge", icon: "🏅" },
  { key: "status", label: "Set Status", icon: "💬" },
];

export function StartMenu({ onOpen, onClose }: { onOpen: (k: WindowKey, t: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-[38px] left-0 aim-window w-64" style={{ zIndex: 1000 }}>
      <div className="aim-titlebar">A.I.M. Start</div>
      <div className="bg-white">
        {APPS.map((a) => (
          <div
            key={a.key}
            className="px-2 py-1.5 text-[12px] hover:bg-[var(--aim-blue-mid)] hover:text-white cursor-pointer flex items-center gap-2"
            onClick={() => {
              onOpen(a.key, a.label);
              onClose();
            }}
          >
            <span>{a.icon}</span>
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Taskbar({ onOpen, onSignOff }: { onOpen: (k: WindowKey, t: string) => void; onSignOff: () => void }) {
  const [now, setNow] = useState<string>("");
  const [startOpen, setStartOpen] = useState(false);
  const windows = useAimStore((s) => s.windows);
  const focusWindow = useAimStore((s) => s.focusWindow);
  const toggleMinimize = useAimStore((s) => s.toggleMinimize);
  const soundOn = useAimStore((s) => s.soundOn);
  const toggleSound = useAimStore((s) => s.toggleSound);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[38px] aim-panel flex items-center gap-1 px-1" style={{ zIndex: 999 }}>
      <button
        className="aim-btn font-bold text-[12px] bg-[var(--aim-trusted)] text-white px-3"
        onClick={() => setStartOpen((o) => !o)}
      >
        ⚡ Start
      </button>
      {startOpen && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={() => setStartOpen(false)} />
          <StartMenu onOpen={onOpen} onClose={() => setStartOpen(false)} />
        </>
      )}
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {windows.map((w) => (
          <button
            key={w.key}
            className="aim-btn text-[10px] max-w-[140px] truncate"
            onClick={() => {
              if (w.minimized) toggleMinimize(w.key);
              focusWindow(w.key);
            }}
          >
            {w.title}
          </button>
        ))}
      </div>
      <button className="aim-btn text-[11px]" onClick={toggleSound} title="Toggle sound cues">
        {soundOn ? "🔊" : "🔇"}
      </button>
      <button className="aim-btn text-[11px]" onClick={onSignOff}>
        Sign Off
      </button>
      <div className="aim-inset px-2 py-1 text-[11px]">{now}</div>
    </div>
  );
}

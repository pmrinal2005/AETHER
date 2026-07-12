"use client";
import { create } from "zustand";

export type WindowKey =
  | "buddylist"
  | "whois"
  | "yellowpages"
  | "newbuddy"
  | "bootcamp"
  | "reputation"
  | "moderation"
  | "guardian"
  | "delegation"
  | "developer"
  | "provenance"
  | "federation"
  | "badge"
  | "toolbar"
  | "status"
  | `chat:${string}`
  | `profile:${number}`;

export type OpenWindow = {
  key: WindowKey;
  title: string;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  data?: Record<string, unknown>;
};

let zCounter = 10;

type AimState = {
  currentPersonaId: number | null;
  soundOn: boolean;
  windows: OpenWindow[];
  notifications: { id: string; text: string; kind: string }[];
  setPersona: (id: number | null) => void;
  toggleSound: () => void;
  openWindow: (key: WindowKey, title: string, data?: Record<string, unknown>) => void;
  closeWindow: (key: WindowKey) => void;
  focusWindow: (key: WindowKey) => void;
  toggleMinimize: (key: WindowKey) => void;
  pushNotification: (text: string, kind?: string) => void;
  dismissNotification: (id: string) => void;
};

export const useAimStore = create<AimState>((set, get) => ({
  currentPersonaId: null,
  soundOn: true,
  windows: [],
  notifications: [],
  setPersona: (id) => set({ currentPersonaId: id }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  openWindow: (key, title, data) => {
    const existing = get().windows.find((w) => w.key === key);
    zCounter += 1;
    if (existing) {
      set({
        windows: get().windows.map((w) =>
          w.key === key ? { ...w, minimized: false, z: zCounter, data: data ?? w.data } : w
        ),
      });
      return;
    }
    const offset = get().windows.length * 24;
    set({
      windows: [
        ...get().windows,
        { key, title, x: 120 + offset, y: 80 + offset, z: zCounter, minimized: false, data },
      ],
    });
  },
  closeWindow: (key) => set({ windows: get().windows.filter((w) => w.key !== key) }),
  focusWindow: (key) => {
    zCounter += 1;
    set({ windows: get().windows.map((w) => (w.key === key ? { ...w, z: zCounter } : w)) });
  },
  toggleMinimize: (key) =>
    set({ windows: get().windows.map((w) => (w.key === key ? { ...w, minimized: !w.minimized } : w)) }),
  pushNotification: (text, kind = "info") =>
    set({ notifications: [...get().notifications, { id: Math.random().toString(36).slice(2), text, kind }] }),
  dismissNotification: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),
}));

// ---------- Web Audio retro sound cues (Feature set: 2000s sound design) ----------
let audioCtx: AudioContext | null = null;
function ctx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

function beep(freqs: number[], durations: number[], gain = 0.05) {
  const c = ctx();
  if (!c) return;
  let t = c.currentTime;
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "square";
    osc.frequency.value = f;
    g.gain.value = gain;
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + durations[i]);
    t += durations[i];
  });
}

export const sounds = {
  signOn: () => beep([440, 660, 880], [0.09, 0.09, 0.14]),
  signOff: () => beep([880, 660, 440], [0.09, 0.09, 0.14]),
  imReceived: () => beep([700, 1000], [0.06, 0.08]),
  warning: () => beep([300, 220, 300, 220], [0.08, 0.08, 0.08, 0.08], 0.07),
  revoke: () => beep([500, 300, 150], [0.1, 0.1, 0.2], 0.08),
  notify: () => beep([950], [0.09]),
};

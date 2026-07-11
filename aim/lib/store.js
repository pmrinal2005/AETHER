'use client';
import { create } from 'zustand';

// Global retro-shell state (Phase 1.1).
// buddyList, activeWindows, currentUser, notifications
let winZ = 100;

export const useAimStore = create((set, get) => ({
  // ── current human operator ──
  currentUser: null,
  setCurrentUser: (u) => set({ currentUser: u }),

  // ── buddy list (agents grouped by status) ──
  buddyList: [],
  setBuddyList: (list) => set({ buddyList: list }),
  upsertBuddy: (agent) =>
    set((s) => {
      const idx = s.buddyList.findIndex((b) => b.id === agent.id);
      if (idx === -1) return { buddyList: [...s.buddyList, agent] };
      const next = [...s.buddyList];
      next[idx] = { ...next[idx], ...agent };
      return { buddyList: next };
    }),

  // ── draggable windows ──
  activeWindows: [], // { id, title, kind, x, y, z, payload }
  openWindow: (win) =>
    set((s) => {
      const existing = s.activeWindows.find((w) => w.id === win.id);
      winZ += 1;
      if (existing) {
        return {
          activeWindows: s.activeWindows.map((w) =>
            w.id === win.id ? { ...w, z: winZ, minimized: false } : w
          ),
        };
      }
      return {
        activeWindows: [
          ...s.activeWindows,
          {
            x: 120 + s.activeWindows.length * 24,
            y: 90 + s.activeWindows.length * 24,
            z: winZ,
            minimized: false,
            ...win,
          },
        ],
      };
    }),
  closeWindow: (id) =>
    set((s) => ({ activeWindows: s.activeWindows.filter((w) => w.id !== id) })),
  focusWindow: (id) =>
    set((s) => {
      winZ += 1;
      return {
        activeWindows: s.activeWindows.map((w) =>
          w.id === id ? { ...w, z: winZ, minimized: false } : w
        ),
      };
    }),
  moveWindow: (id, x, y) =>
    set((s) => ({
      activeWindows: s.activeWindows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),
  minimizeWindow: (id) =>
    set((s) => ({
      activeWindows: s.activeWindows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w
      ),
    })),

  // ── notifications ("You've Got Mail!"-style toasts) ──
  notifications: [],
  pushNotification: (n) =>
    set((s) => ({
      notifications: [...s.notifications, { id: crypto.randomUUID(), ...n }],
    })),
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  // ── global sound toggle ──
  soundOn: true,
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
}));

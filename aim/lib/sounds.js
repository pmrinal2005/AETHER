'use client';
// Web Audio API retro sound cues (Phase 1.1) — synthesized, ships zero .wav files.
let ctx = null;
function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.15) {
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(a.destination);
  const t0 = a.currentTime + start;
  osc.start(t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.stop(t0 + dur);
}

export const sounds = {
  // rising two-tone "door open"
  signOn() {
    tone(523.25, 0, 0.18, 'sine', 0.18);
    tone(783.99, 0.14, 0.28, 'sine', 0.18);
  },
  // falling two-tone "door close"
  signOff() {
    tone(783.99, 0, 0.16, 'sine', 0.18);
    tone(523.25, 0.13, 0.3, 'sine', 0.18);
  },
  // short IM blip
  imReceive() {
    tone(880, 0, 0.09, 'square', 0.1);
    tone(1174.66, 0.08, 0.09, 'square', 0.1);
  },
  // warning buzzer
  warning() {
    tone(220, 0, 0.14, 'sawtooth', 0.14);
    tone(196, 0.14, 0.22, 'sawtooth', 0.14);
  },
  // resume audio ctx after a user gesture (browsers block autoplay)
  resume() {
    const a = ac();
    if (a && a.state === 'suspended') a.resume();
  },
};

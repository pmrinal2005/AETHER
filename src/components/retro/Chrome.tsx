"use client";
import { Rnd } from "react-rnd";
import { ReactNode, useState } from "react";
import { useAimStore, WindowKey } from "@/lib/store";
import { generateIdenticonSvg } from "@/lib/core";

export function RetroWindow({
  winKey,
  title,
  z,
  x,
  y,
  minimized,
  width = 480,
  height = 420,
  children,
}: {
  winKey: WindowKey;
  title: string;
  z: number;
  x: number;
  y: number;
  minimized: boolean;
  width?: number;
  height?: number;
  children: ReactNode;
}) {
  const closeWindow = useAimStore((s) => s.closeWindow);
  const focusWindow = useAimStore((s) => s.focusWindow);
  const toggleMinimize = useAimStore((s) => s.toggleMinimize);

  if (minimized) return null;

  return (
    <Rnd
      default={{ x, y, width, height }}
      minWidth={280}
      minHeight={160}
      bounds="parent"
      style={{ zIndex: z }}
      dragHandleClassName="drag-handle"
      onMouseDown={() => focusWindow(winKey)}
    >
      <div className="aim-window flex flex-col h-full w-full overflow-hidden">
        <div className="aim-titlebar drag-handle shrink-0">
          <span className="truncate">{title}</span>
          <div className="flex gap-1">
            <div className="aim-titlebtn" onClick={() => toggleMinimize(winKey)}>_</div>
            <div className="aim-titlebtn" onClick={() => closeWindow(winKey)}>×</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[var(--aim-face)] text-[12px]">{children}</div>
      </div>
    </Rnd>
  );
}

export function BuddyIcon({ seed, size = 32, cracked = false }: { seed: string; size?: number; cracked?: boolean }) {
  const svg = generateIdenticonSvg(seed, cracked);
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 aim-inset"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function StatusDot({ status }: { status: string }) {
  return <span className={`status-dot status-${status}`} title={status} />;
}

export function WarningMeter({ pct, status }: { pct: number; status: string }) {
  const color =
    status === "trusted" ? "var(--aim-trusted)" : status === "review" ? "var(--aim-review)" : status === "probation" ? "var(--aim-probation)" : "var(--aim-blocked)";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span>Warning Level</span>
        <span className="font-bold">{pct.toFixed(0)}%</span>
      </div>
      <div className="aim-inset h-4 w-full">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px] mt-0.5 uppercase font-bold" style={{ color }}>
        {status}
      </div>
    </div>
  );
}

export function Marquee({ text }: { text: string }) {
  return (
    <div className="aim-inset marquee-track py-1">
      <div className="marquee-inner text-[11px] px-2">{text}</div>
    </div>
  );
}

// Mobile shell window: a single full-screen retro window with a header and a
// scrollable body. Used on phone viewports instead of the draggable desktop.
export function MobileWindow({ title, onClose, children }: { title: string; onClose?: () => void; children: ReactNode }) {
  return (
    <div className="mobile-window">
      <div className="aim-titlebar shrink-0">
        <span className="truncate">{title}</span>
        {onClose && <div className="aim-titlebtn" onClick={onClose}>×</div>}
      </div>
      <div className="mobile-window-body bg-[var(--aim-face)] text-[12px]">{children}</div>
    </div>
  );
}

export function Toolbar2000({ onAction }: { onAction: (action: string) => void }) {
  const [pos, setPos] = useState({ x: 20, y: 20 });
  return (
    <Rnd
      default={{ x: pos.x, y: pos.y, width: 210, height: 40 }}
      bounds="parent"
      dragHandleClassName="tb-drag"
      style={{ zIndex: 500 }}
      enableResizing={false}
    >
      <div className="aim-panel flex items-center gap-1 p-1 h-full">
        <div className="tb-drag cursor-move px-1 text-[14px]">⠿</div>
        <button className="aim-btn text-[10px]" onClick={() => onAction("verify")}>Verify</button>
        <button className="aim-btn text-[10px]" onClick={() => onAction("provenance")}>Provenance</button>
        <button className="aim-btn text-[10px]" onClick={() => onAction("moderate")}>Moderate</button>
        <button className="aim-btn text-[10px]" onClick={() => onAction("api")}>Trust API</button>
      </div>
    </Rnd>
  );
}

'use client';
import { useRef } from 'react';
import { useAimStore } from '@/lib/store';

// Draggable retro window (Phase 1.1 shell primitive).
export default function Window({ win, children, width = 320, footer = null }) {
  const { moveWindow, focusWindow, closeWindow, minimizeWindow } = useAimStore();
  const dragging = useRef(null);

  if (win.minimized) return null;

  function onMouseDown(e) {
    focusWindow(win.id);
    dragging.current = { sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
  function onMouseMove(e) {
    if (!dragging.current) return;
    const { sx, sy, ox, oy } = dragging.current;
    moveWindow(win.id, Math.max(0, ox + e.clientX - sx), Math.max(0, oy + e.clientY - sy));
  }
  function onMouseUp() {
    dragging.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  return (
    <div
      className="window-95 absolute"
      style={{ left: win.x, top: win.y, width, zIndex: win.z }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div className="titlebar" onMouseDown={onMouseDown}>
        <span className="flex items-center gap-1 truncate">
          <span aria-hidden>🏃</span>
          {win.title}
        </span>
        <span className="flex gap-0.5">
          <button
            className="tb-btn"
            title="Minimize"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
          >
            _
          </button>
          <button
            className="tb-btn"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
          >
            ✕
          </button>
        </span>
      </div>
      <div className="p-2">{children}</div>
      {footer && <div className="px-2 pb-2">{footer}</div>}
    </div>
  );
}

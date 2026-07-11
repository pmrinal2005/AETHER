'use client';
// CSS/SVG "under construction" banner — no binary GIF shipped.
export default function UnderConstruction({ label = 'UNDER CONSTRUCTION' }) {
  return (
    <div
      className="flex items-center justify-center gap-2 text-[10px] font-bold text-black py-1 px-2 border border-black blink"
      style={{
        background:
          'repeating-linear-gradient(45deg, #ffcc00 0 10px, #000 10px 20px)',
      }}
    >
      <span className="bg-aim-yellow px-1">🚧 {label} 🚧</span>
    </div>
  );
}

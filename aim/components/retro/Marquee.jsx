'use client';
export default function Marquee({ children }) {
  return (
    <div className="marquee bg-black text-aim-yellow text-xs py-0.5 border border-win-shadow">
      <span>{children}</span>
    </div>
  );
}

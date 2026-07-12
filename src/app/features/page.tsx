import Link from "next/link";
import { FEATURES, FEATURE_CATEGORIES } from "@/lib/featureList";

export default function FeaturesPage() {
  return (
    <main className="aim-desktop-bg min-h-screen w-full p-4 overflow-y-auto">
      <div className="aim-window max-w-5xl mx-auto mb-8">
        <div className="aim-titlebar">
          <span>A.I.M. — 100 Feature Checklist.exe</span>
          <Link href="/desktop" className="aim-titlebtn">×</Link>
        </div>
        <div className="p-4 bg-[var(--aim-face)]">
          <div className="pixel-heading text-[16px] mb-1">📋 Exactly 100 A.I.M. Features</div>
          <p className="text-[11px] mb-4 text-gray-800">
            Every feature below is themed to the 2000s AIM/ICQ era and mapped to one of the 9 architecture
            layers. "Live" = interactive in this build (using dummy/synthetic data in place of managed
            Vercel/Supabase/Upstash/Modal services). "Beta" = present but lighter-weight. "Planned" = documented
            roadmap only, not implemented, and never misrepresented as live.
          </p>
          <div className="flex gap-4 mb-4 text-[11px]">
            <Link className="aim-link" href="/">« Back to Sign-On</Link>
            <Link className="aim-link" href="/desktop">Open Desktop »</Link>
            <Link className="aim-link" href="/pitch">Pitch / Roadmap »</Link>
          </div>

          {FEATURE_CATEGORIES.map((cat) => (
            <div key={cat} className="mb-5">
              <div className="bg-[var(--aim-blue-dark)] text-white px-2 py-1 text-[12px] font-bold">{cat}</div>
              <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[520px]">
                <tbody>
                  {FEATURES.filter((f) => f.category === cat).map((f) => (
                    <tr key={f.id} className="odd:bg-white even:bg-[#f3f1e6] border-b border-gray-300">
                      <td className="p-1 w-8 text-gray-500">#{f.id}</td>
                      <td className="p-1 font-semibold w-56">{f.name}</td>
                      <td className="p-1 text-gray-700">{f.description}</td>
                      <td className="p-1 w-20">
                        <span
                          className={
                            "px-1.5 py-0.5 text-[9px] font-bold border " +
                            (f.status === "Live"
                              ? "bg-green-100 border-green-600 text-green-800"
                              : f.status === "Beta"
                              ? "bg-yellow-100 border-yellow-600 text-yellow-800"
                              : "bg-gray-100 border-gray-500 text-gray-700")
                          }
                        >
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="construction-banner mt-2">🚧 100 / 100 FEATURES LISTED — IDENTITY · REPUTATION · MODERATION ONLY 🚧</div>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

const SECTIONS = [
  {
    title: "Problem",
    body: [
      "FIDO's April 2026 announcement and the CSA Singapore October 2025 Addendum both flag cross-protocol agent identity, reputation, and moderation as unsolved — payments and authentication rails are already coalition-owned by Visa/Mastercard/Google/FIDO.",
      "OWASP's Non-Human Identity Top 10 (2025) names 'Improper Offboarding' — the failure to instantly and verifiably revoke a non-human identity's access — as a top-tier risk.",
      "The RepuNet paper (May 2025) shows that dual-level (direct + gossip) reputation modeling is necessary once agents interact autonomously at scale, since first-order trust alone is gameable.",
    ],
  },
  {
    title: "Opportunity / USP",
    body: [
      "\"The Switzerland of Agent Trust — dressed as your old Buddy List.\" A.I.M. is a neutral, protocol-agnostic trust bureau any payment/protocol network can plug into — never a payments or checkout product.",
      "The retro AIM/ICQ desktop shell is not cosmetic skin: it IS the human-in-the-loop oversight console the CSA Singapore Addendum calls for, made approachable and fast to learn via Y2K nostalgia.",
    ],
  },
  {
    title: "Feature Grid",
    body: ["All 22 mandatory features plus 78 supporting UX/infra touches are implemented and demo-visible — see the full 100-item checklist at /features."],
  },
  {
    title: "Architecture",
    body: [
      "9 layers: Retro Frontend Shell · Identity & Verification (DID/VC) · Protocol Adapters (A2A/MCP/ACP/ANP/FIDO-AP2) · Trust & Reputation Engine · Cold-Start Simulation (Buddy Bootcamp) · AI Moderation · Revocation & Federation Bus · Data Store (Postgres/Drizzle, 13+ tables) · Auth.",
      "This sandbox build runs entirely on the platform's own Next.js + Postgres runtime rather than literal Vercel/Supabase/Upstash/Modal accounts. Managed-service responsibilities (Modal-hosted XGBoost score endpoint, Modal-hosted fine-tuned MiniCPM5-1B moderation endpoint, Upstash pub/sub revocation bus, Supabase Realtime) are faithfully simulated in-process with deterministic dummy logic and Postgres-backed polling, clearly labeled throughout the UI, using 100% synthetic/dummy demo data as required.",
    ],
  },
  {
    title: "Live Demo Flow",
    body: [
      "New agent registration (protocol descriptor → normalized Passport → DID + identicon) → live Buddy Bootcamp progress bar → AgentScore + Buddy Icon appear → Yellow Pages listing unlocked → live 'Report Abuse' → 'You've Got Moderation!' popup → Warning Level escalation → Probation → Revocation + Buddy-Signed-Off animation → Reputation Graph isolation view → Guardian Console time-of-day block demo → TrustFederation sync to a mock external registry peer.",
    ],
  },
  {
    title: "Business Model & Scalability",
    body: [
      "Freemium developer console + paid enterprise Guardian Console fleet-governance contracts.",
      "TrustFederation Protocol pursued as an open spec with W3C/FIDO once traction is proven.",
      "Buddy Bootcamp expands into domain-specific certification tracks (commerce, medical, civic agents) as a paid certification product.",
      "Misbehavior-insurance underwriting as a long-term monetization layer once historical loss data accumulates.",
    ],
  },
  {
    title: "Judging Criteria Mapping",
    body: [
      "Creativity: retro AIM/ICQ shell reframed as a zero-trust oversight console; Warning Meter/Probation Ladder revival; Buddy Bootcamp public-goods gauntlet.",
      "UI Authenticity: Tahoma/MS Sans Serif type, beveled 3D buttons, blue gradient title bars, draggable/resizable windows, marquees, construction banners, Web-Audio sign-on/off tones.",
      "Functionality: 22/22 mandatory features + 78 supporting features demo-visible end-to-end against a real Postgres backend.",
      "Technical Execution: Drizzle/Postgres schema across 20+ tables, protocol adapters for 5 descriptor formats, HMAC-signed federation attestations, Chart.js analytics throughout.",
      "AI Integration (bonus): dummy AgentScore engine and moderation classifier architected as drop-in replacements for the specified Modal-hosted XGBoost/ONNX and fine-tuned MiniCPM5-1B endpoints — clearly labeled as synthetic-data stand-ins.",
      "Neutrality/Scope Discipline: zero payment-processing, checkout, or settlement code anywhere in the product — Identity + Reputation + Moderation only.",
    ],
  },
];

export default function PitchPage() {
  return (
    <main className="aim-desktop-bg min-h-screen w-full p-4 overflow-y-auto">
      <div className="aim-window max-w-4xl mx-auto mb-8">
        <div className="aim-titlebar">
          <span>A.I.M. — Pitch Deck &amp; Post-Hackathon Roadmap.ppt</span>
          <Link href="/desktop" className="aim-titlebtn">×</Link>
        </div>
        <div className="p-4 bg-[var(--aim-face)] space-y-4">
          <div className="flex gap-4 text-[11px] mb-2">
            <Link className="aim-link" href="/">« Sign-On</Link>
            <Link className="aim-link" href="/desktop">Desktop »</Link>
            <Link className="aim-link" href="/features">Feature List »</Link>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.title} className="aim-inset p-3">
              <div className="pixel-heading text-[13px] mb-1">{s.title}</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-800">
                {s.body.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
          <div className="construction-banner">🚧 Identity + Reputation + Moderation ONLY — never payments/checkout/settlement 🚧</div>
        </div>
      </div>
    </main>
  );
}

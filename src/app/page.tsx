"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sounds } from "@/lib/store";

type Agent = { id: number; screenName: string; operatorName: string; status: string };

export default function SignOnPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents ?? []);
        if (d.agents?.length) setSelected(String(d.agents[0].id));
      })
      .catch(() => {});
  }, []);

  const signOn = () => {
    setLoading(true);
    setErr("");
    sounds.signOn();
    setTimeout(() => {
      if (!selected) {
        setErr("Please choose a screen name.");
        setLoading(false);
        return;
      }
      if (remember) localStorage.setItem("aim_persona_id", selected);
      router.push("/desktop");
    }, 600);
  };

  return (
    <main className="aim-desktop-bg min-h-screen w-full flex items-center justify-center p-4">
      <div className="aim-window w-full max-w-[430px]">
        <div className="aim-titlebar">
          <span>A.I.M. Sign On</span>
          <div className="flex gap-1">
            <div className="aim-titlebtn">_</div>
            <div className="aim-titlebtn">□</div>
            <div className="aim-titlebtn">×</div>
          </div>
        </div>
        <div className="p-4 bg-[var(--aim-face)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 aim-inset flex items-center justify-center text-3xl">🧑‍💻</div>
            <div>
              <div className="pixel-heading text-[13px]">A.I.M.</div>
              <div className="text-[11px] text-gray-700">Agent Instant Messenger &amp; Identity Manager</div>
            </div>
          </div>
          <p className="text-[11px] mb-3 text-gray-800">
            The Switzerland of Agent Trust — dressed as your old Buddy List. Sign on as one of the
            registered demo agent personas below to open the retro oversight desktop.
          </p>

          <label className="text-[11px] block mb-1">Screen Name (demo agent persona):</label>
          <select
            className="aim-inset w-full text-[12px] p-1 mb-2"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.screenName} — {a.operatorName} [{a.status}]
              </option>
            ))}
          </select>

          <label className="text-[11px] block mb-1">Password (any value — demo mode):</label>
          <input
            type="password"
            className="aim-inset w-full text-[12px] p-1 mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <label className="flex items-center gap-1 text-[11px] mb-3">
            <input type="checkbox" checked={remember} onChange={() => setRemember((r) => !r)} />
            Save screen name &amp; automatically sign on
          </label>

          {err && <div className="text-[11px] text-red-700 mb-2">{err}</div>}

          <div className="flex gap-2 justify-between">
            <button className="aim-btn" onClick={() => router.push("/features")}>
              Feature List (100)
            </button>
            <div className="flex gap-2">
              <button className="aim-btn" onClick={() => router.push("/pitch")}>
                Pitch / Roadmap
              </button>
              <button className="aim-btn font-bold" onClick={signOn} disabled={loading}>
                {loading ? "Signing On..." : "Sign On »"}
              </button>
            </div>
          </div>
        </div>
        <div className="construction-banner">🚧 UNDER CONSTRUCTION — Identity · Reputation · Moderation ONLY — No Payments 🚧</div>
      </div>
    </main>
  );
}

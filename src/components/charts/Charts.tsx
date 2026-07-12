"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar, Scatter, Radar, Pie, PolarArea, Bubble } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { font: { size: 10 } } } },
  scales: undefined as any,
};

export function ScoreHistoryChart({ points }: { points: { computedAt: string; score: number }[] }) {
  const data = {
    labels: points.map((p) => new Date(p.computedAt).toLocaleDateString()),
    datasets: [
      {
        label: "AgentScore (0-999)",
        data: points.map((p) => p.score),
        borderColor: "#0a246a",
        backgroundColor: "#a6caf0",
        tension: 0.25,
      },
    ],
  };
  return (
    <div style={{ height: 180 }}>
      <Line data={data} options={{ ...baseOptions, scales: { y: { min: 0, max: 999 } } }} />
    </div>
  );
}

export function CooperationDoughnut({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const data = {
    labels: ["Cooperate", "Defect"],
    datasets: [{ data: [pct, 100 - pct], backgroundColor: ["#2e8b22", "#c1121f"] }],
  };
  return (
    <div style={{ height: 160 }}>
      <Doughnut data={data} options={baseOptions} />
    </div>
  );
}

export function ModerationBreakdownPie({ counts }: { counts: Record<string, number> }) {
  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [
      {
        data: labels.map((l) => counts[l]),
        backgroundColor: ["#c1121f", "#d2691e", "#d8a900", "#3a6ea5", "#2e8b22", "#8a2be2"],
      },
    ],
  };
  return (
    <div style={{ height: 170 }}>
      <Pie data={data} options={baseOptions} />
    </div>
  );
}

export function ScoreComparatorBar({ names, scores }: { names: string[]; scores: number[] }) {
  const data = {
    labels: names,
    datasets: [{ label: "AgentScore", data: scores, backgroundColor: "#3a6ea5" }],
  };
  return (
    <div style={{ height: 200 }}>
      <Bar data={data} options={{ ...baseOptions, scales: { y: { min: 0, max: 999 } } }} />
    </div>
  );
}

export function ReputationScatter({
  points,
}: {
  points: { x: number; y: number; label: string; color: string }[];
}) {
  const data = {
    datasets: [
      {
        label: "Agents",
        data: points.map((p) => ({ x: p.x, y: p.y })),
        backgroundColor: points.map((p) => p.color),
        pointRadius: 7,
      },
    ],
  };
  return (
    <div style={{ height: 260 }}>
      <Scatter
        data={data}
        options={{
          ...baseOptions,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => points[ctx.dataIndex]?.label ?? "",
              },
            },
          },
          scales: { x: { title: { display: true, text: "Cluster spread" } }, y: { title: { display: true, text: "Trust weight" } } },
        }}
      />
    </div>
  );
}

export function CapabilityRadar({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Coverage",
        data: values,
        backgroundColor: "rgba(58,110,165,0.35)",
        borderColor: "#0a246a",
      },
    ],
  };
  return (
    <div style={{ height: 200 }}>
      <Radar data={data} options={baseOptions} />
    </div>
  );
}

export function WarningDistributionBar({ buckets }: { buckets: Record<string, number> }) {
  const labels = ["trusted", "review", "probation", "blocked"];
  const data = {
    labels,
    datasets: [
      {
        label: "Agents",
        data: labels.map((l) => buckets[l] ?? 0),
        backgroundColor: ["#2e8b22", "#d8a900", "#d2691e", "#c1121f"],
      },
    ],
  };
  return (
    <div style={{ height: 170 }}>
      <Bar data={data} options={baseOptions} />
    </div>
  );
}

export function FederationSyncLine({ points }: { points: { t: string; delta: number }[] }) {
  const data = {
    labels: points.map((p) => p.t),
    datasets: [{ label: "Score delta synced", data: points.map((p) => p.delta), borderColor: "#8a2be2", backgroundColor: "#e0c6ff", tension: 0.3 }],
  };
  return (
    <div style={{ height: 160 }}>
      <Line data={data} options={baseOptions} />
    </div>
  );
}

export function DisputesTrendBar({ counts }: { counts: number[]; }) {
  const data = {
    labels: counts.map((_, i) => `Wk ${i + 1}`),
    datasets: [{ label: "Disputes filed", data: counts, backgroundColor: "#d2691e" }],
  };
  return (
    <div style={{ height: 160 }}>
      <Bar data={data} options={baseOptions} />
    </div>
  );
}

// ===================== ADDED CHARTS (Chart.js only) =====================

// Protocol mix across the whole registry (PolarArea).
export function ProtocolMixPolar({ counts }: { counts: Record<string, number> }) {
  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [
      {
        data: labels.map((l) => counts[l]),
        backgroundColor: ["#0a246a", "#3a6ea5", "#ff8c00", "#2e8b57", "#8a2be2", "#c1121f"],
      },
    ],
  };
  return (
    <div style={{ height: 200 }}>
      <PolarArea data={data} options={baseOptions} />
    </div>
  );
}

// Registry-wide score distribution histogram (Bar over 100-pt buckets).
export function ScoreDistributionHistogram({ scores }: { scores: number[] }) {
  const buckets = new Array(10).fill(0);
  scores.forEach((s) => { buckets[Math.min(9, Math.floor(s / 100))] += 1; });
  const data = {
    labels: buckets.map((_, i) => `${i * 100}-${i * 100 + 99}`),
    datasets: [{ label: "Agents", data: buckets, backgroundColor: "#316ac5" }],
  };
  return (
    <div style={{ height: 170 }}>
      <Bar data={data} options={{ ...baseOptions, scales: { y: { ticks: { precision: 0 } } } }} />
    </div>
  );
}

// Stacked area of trust-tier population over time (mocked from current buckets).
export function TrustTierAreaChart({ series }: { series: { label: string; trusted: number; review: number; probation: number; blocked: number }[] }) {
  const data = {
    labels: series.map((s) => s.label),
    datasets: [
      { label: "Trusted", data: series.map((s) => s.trusted), borderColor: "#2e8b22", backgroundColor: "rgba(46,139,34,0.35)", fill: true, tension: 0.3 },
      { label: "Review", data: series.map((s) => s.review), borderColor: "#d8a900", backgroundColor: "rgba(216,169,0,0.35)", fill: true, tension: 0.3 },
      { label: "Probation", data: series.map((s) => s.probation), borderColor: "#d2691e", backgroundColor: "rgba(210,105,30,0.35)", fill: true, tension: 0.3 },
      { label: "Blocked", data: series.map((s) => s.blocked), borderColor: "#c1121f", backgroundColor: "rgba(193,18,31,0.35)", fill: true, tension: 0.3 },
    ],
  };
  return (
    <div style={{ height: 190 }}>
      <Line data={data} options={{ ...baseOptions, scales: { y: { stacked: true } } }} />
    </div>
  );
}

// Score breakdown as a horizontal-ish signed bar (positive vs penalty components).
export function ScoreBreakdownBar({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown).filter(([k]) => k !== "model" && k !== "base");
  const data = {
    labels: entries.map(([k]) => k.replace(/([A-Z])/g, " $1")),
    datasets: [
      {
        label: "Points",
        data: entries.map(([, v]) => Number(v)),
        backgroundColor: entries.map(([, v]) => (Number(v) >= 0 ? "#2e8b22" : "#c1121f")),
      },
    ],
  };
  return (
    <div style={{ height: 190 }}>
      <Bar data={data} options={{ ...baseOptions, indexAxis: "y" as const }} />
    </div>
  );
}

// Bubble chart: agents plotted by score (x), warning% (y), sized by connections.
export function AgentBubbleChart({ points }: { points: { x: number; y: number; r: number; label: string; color: string }[] }) {
  const data = {
    datasets: [
      {
        label: "Agents",
        data: points.map((p) => ({ x: p.x, y: p.y, r: p.r })),
        backgroundColor: points.map((p) => p.color),
      },
    ],
  };
  return (
    <div style={{ height: 240 }}>
      <Bubble
        data={data}
        options={{
          ...baseOptions,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => points[ctx.dataIndex]?.label ?? "" } },
          },
          scales: {
            x: { title: { display: true, text: "AgentScore" }, min: 0, max: 999 },
            y: { title: { display: true, text: "Warning %" }, min: 0, max: 100 },
          },
        }}
      />
    </div>
  );
}

// Bootcamp round-by-round cooperation line for a single run.
export function BootcampRoundsLine({ rounds }: { rounds: { round: number; coop: number }[] }) {
  const data = {
    labels: rounds.map((r) => `R${r.round}`),
    datasets: [
      {
        label: "Cooperated (1) / Defected (0)",
        data: rounds.map((r) => r.coop),
        borderColor: "#2e8b22",
        backgroundColor: "rgba(46,139,34,0.3)",
        stepped: true as const,
        fill: true,
      },
    ],
  };
  return (
    <div style={{ height: 150 }}>
      <Line data={data} options={{ ...baseOptions, scales: { y: { min: -0.1, max: 1.1, ticks: { stepSize: 1 } } } }} />
    </div>
  );
}

// Moderation confidence gauge-ish doughnut for a single flag.
export function ConfidenceGauge({ confidence, label }: { confidence: number; label: string }) {
  const pct = Math.round(confidence * 100);
  const color = pct > 80 ? "#c1121f" : pct > 60 ? "#d2691e" : "#d8a900";
  const data = {
    labels: [label, "remaining"],
    datasets: [{ data: [pct, 100 - pct], backgroundColor: [color, "#dfdccf"], borderWidth: 0 }],
  };
  return (
    <div style={{ height: 130, position: "relative" }}>
      <Doughnut data={data} options={{ ...baseOptions, cutout: "68%", plugins: { legend: { display: false } } }} />
    </div>
  );
}

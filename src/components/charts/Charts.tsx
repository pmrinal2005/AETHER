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

// ===================== ENHANCED ANALYTICS CHARTS (Chart.js only) =====================
// Additional retro-styled charts feeding the reimagined Analytics Command Center and
// individual feature windows. All data is synthetic/dummy for demo purposes.

const RETRO_COLORS = ["#0a246a", "#316ac5", "#ff8c00", "#2e8b57", "#8a2be2", "#c1121f", "#008080", "#b8860b"];

// Multi-series line: registry average score trend split by protocol (mocked history).
export function ScoreTrendMultiLine({ series, labels }: { series: { name: string; data: number[] }[]; labels: string[] }) {
  const data = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.name,
      data: s.data,
      borderColor: RETRO_COLORS[i % RETRO_COLORS.length],
      backgroundColor: RETRO_COLORS[i % RETRO_COLORS.length] + "44",
      tension: 0.3,
      pointRadius: 2,
    })),
  };
  return (
    <div style={{ height: 200 }}>
      <Line data={data} options={{ ...baseOptions, scales: { y: { min: 0, max: 999 } } }} />
    </div>
  );
}

// Stacked bar: moderation outcomes (approved/timeout/revoked/pending) per flag type.
export function ModerationOutcomeStacked({ labels, approved, timeout, revoked, pending }: {
  labels: string[]; approved: number[]; timeout: number[]; revoked: number[]; pending: number[];
}) {
  const data = {
    labels,
    datasets: [
      { label: "Approved", data: approved, backgroundColor: "#2e8b22" },
      { label: "Timeout", data: timeout, backgroundColor: "#d8a900" },
      { label: "Revoked", data: revoked, backgroundColor: "#c1121f" },
      { label: "Pending", data: pending, backgroundColor: "#3a6ea5" },
    ],
  };
  return (
    <div style={{ height: 190 }}>
      <Bar data={data} options={{ ...baseOptions, scales: { x: { stacked: true }, y: { stacked: true, ticks: { precision: 0 } } } }} />
    </div>
  );
}

// Horizontal bar: operator fleet sizes (agents per operator org).
export function OperatorFleetBar({ operators, counts }: { operators: string[]; counts: number[] }) {
  const data = {
    labels: operators,
    datasets: [{ label: "Agents", data: counts, backgroundColor: "#316ac5" }],
  };
  return (
    <div style={{ height: 200 }}>
      <Bar data={data} options={{ ...baseOptions, indexAxis: "y" as const, scales: { x: { ticks: { precision: 0 } } } }} />
    </div>
  );
}

// Radar: registry-wide capability coverage across capability tags.
export function CapabilityCoverageRadar({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels,
    datasets: [{ label: "# Agents offering", data: values, backgroundColor: "rgba(138,43,226,0.30)", borderColor: "#8a2be2", pointBackgroundColor: "#8a2be2" }],
  };
  return (
    <div style={{ height: 220 }}>
      <Radar data={data} options={baseOptions} />
    </div>
  );
}

// Doughnut: agent status broadcast mix (active/busy/suspended/revoked).
export function StatusMixDoughnut({ counts }: { counts: Record<string, number> }) {
  const labels = Object.keys(counts);
  const palette: Record<string, string> = { active: "#2e8b22", busy: "#d8a900", suspended: "#d2691e", revoked: "#c1121f" };
  const data = {
    labels,
    datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: labels.map((l) => palette[l] ?? "#3a6ea5") }],
  };
  return (
    <div style={{ height: 170 }}>
      <Doughnut data={data} options={baseOptions} />
    </div>
  );
}

// Mixed chart: bars = agents onboarded per day, line = cumulative registry size.
export function OnboardingMixedChart({ labels, daily, cumulative }: { labels: string[]; daily: number[]; cumulative: number[] }) {
  const data = {
    labels,
    datasets: [
      { type: "bar" as const, label: "Onboarded", data: daily, backgroundColor: "#ff8c00", yAxisID: "y" },
      { type: "line" as const, label: "Cumulative", data: cumulative, borderColor: "#0a246a", backgroundColor: "#0a246a", tension: 0.3, yAxisID: "y1" },
    ],
  };
  return (
    <div style={{ height: 190 }}>
      <Bar
        data={data as any}
        options={{
          ...baseOptions,
          scales: {
            y: { position: "left" as const, ticks: { precision: 0 } },
            y1: { position: "right" as const, grid: { drawOnChartArea: false }, ticks: { precision: 0 } },
          },
        }}
      />
    </div>
  );
}

// Federation health: outbound vs inbound sync counts per peer (grouped bar).
export function FederationGroupedBar({ peers, outbound, inbound }: { peers: string[]; outbound: number[]; inbound: number[] }) {
  const data = {
    labels: peers,
    datasets: [
      { label: "Outbound", data: outbound, backgroundColor: "#8a2be2" },
      { label: "Inbound", data: inbound, backgroundColor: "#2e8b57" },
    ],
  };
  return (
    <div style={{ height: 180 }}>
      <Bar data={data} options={{ ...baseOptions, scales: { y: { ticks: { precision: 0 } } } }} />
    </div>
  );
}

// Small reusable score gauge (doughnut) for a single agent, 0-999.
export function ScoreGauge({ score, label }: { score: number; label?: string }) {
  const pct = Math.round((score / 999) * 100);
  const color = score >= 700 ? "#2e8b22" : score >= 450 ? "#d8a900" : "#c1121f";
  const data = {
    labels: ["Score", "remaining"],
    datasets: [{ data: [score, 999 - score], backgroundColor: [color, "#dfdccf"], borderWidth: 0 }],
  };
  return (
    <div style={{ height: 130, position: "relative" }}>
      <Doughnut data={data} options={{ ...baseOptions, cutout: "70%", plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "Courier New, monospace", color }}>{score}</span>
        <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, color: "#444" }}>{label ?? `${pct}%`}</span>
      </div>
    </div>
  );
}

// Polar: dispute reasons distribution.
export function DisputeReasonPolar({ counts }: { counts: Record<string, number> }) {
  const labels = Object.keys(counts).length ? Object.keys(counts) : ["none"];
  const data = {
    labels,
    datasets: [{ data: labels.map((l) => counts[l] ?? 1), backgroundColor: RETRO_COLORS }],
  };
  return (
    <div style={{ height: 190 }}>
      <PolarArea data={data} options={baseOptions} />
    </div>
  );
}

// ===================== PROVENANCE / FEDERATION / DEVELOPER CHARTS (Chart.js only) =====================

// Provenance: event-type breakdown for one agent's audit trail (doughnut).
export function ProvenanceEventDoughnut({ counts }: { counts: Record<string, number> }) {
  const labels = Object.keys(counts).length ? Object.keys(counts) : ["none"];
  const palette: Record<string, string> = {
    dispute: "#c1121f", moderation: "#d2691e", delegation: "#3a6ea5",
    score: "#2e8b22", credential: "#8a2be2", none: "#b8b5a2",
  };
  const data = {
    labels,
    datasets: [{ data: labels.map((l) => counts[l] ?? 1), backgroundColor: labels.map((l) => palette[l] ?? "#316ac5"), borderWidth: 0 }],
  };
  return (
    <div style={{ height: 160 }}>
      <Doughnut data={data} options={{ ...baseOptions, cutout: "55%" }} />
    </div>
  );
}

// Provenance: cumulative audit-event count over time (stepped line).
export function ProvenanceTimelineLine({ points }: { points: { t: string; count: number }[] }) {
  const data = {
    labels: points.map((p) => p.t),
    datasets: [{
      label: "Cumulative audited events",
      data: points.map((p) => p.count),
      borderColor: "#0a246a", backgroundColor: "rgba(58,110,165,0.30)",
      stepped: true as const, fill: true, pointRadius: 2,
    }],
  };
  return (
    <div style={{ height: 160 }}>
      <Line data={data} options={{ ...baseOptions, scales: { y: { ticks: { precision: 0 } } } }} />
    </div>
  );
}

// Federation: trust-flow gauge showing net synced score-delta direction (doughnut gauge).
export function FederationFlowGauge({ outbound, inbound }: { outbound: number; inbound: number }) {
  const total = outbound + inbound || 1;
  const data = {
    labels: ["Outbound deltas", "Inbound deltas"],
    datasets: [{ data: [outbound, inbound], backgroundColor: ["#8a2be2", "#2e8b57"], borderWidth: 0 }],
  };
  return (
    <div style={{ height: 150, position: "relative" }}>
      <Doughnut data={data} options={{ ...baseOptions, cutout: "62%" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "Courier New, monospace", color: "#0a246a" }}>{total}</span>
        <span style={{ fontSize: 8, textTransform: "uppercase", color: "#444" }}>sync events</span>
      </div>
    </div>
  );
}

// Federation: per-peer last-sync freshness (horizontal bar of minutes since sync).
export function PeerFreshnessBar({ peers, minutes }: { peers: string[]; minutes: number[] }) {
  const data = {
    labels: peers,
    datasets: [{
      label: "Minutes since last sync",
      data: minutes,
      backgroundColor: minutes.map((m) => (m < 0 ? "#b8b5a2" : m < 5 ? "#2e8b22" : m < 30 ? "#d8a900" : "#c1121f")),
    }],
  };
  return (
    <div style={{ height: 160 }}>
      <Bar data={data} options={{ ...baseOptions, indexAxis: "y" as const, scales: { x: { ticks: { precision: 0 } } } }} />
    </div>
  );
}

// Developer: single-agent AgentScore history (reuses score points).
export function DevScoreTrendLine({ points }: { points: { computedAt: string; score: number }[] }) {
  const data = {
    labels: points.map((p) => new Date(p.computedAt).toLocaleDateString()),
    datasets: [{
      label: "This agent's AgentScore",
      data: points.map((p) => p.score),
      borderColor: "#2e8b22", backgroundColor: "rgba(46,139,34,0.25)", fill: true, tension: 0.3, pointRadius: 2,
    }],
  };
  return (
    <div style={{ height: 160 }}>
      <Line data={data} options={{ ...baseOptions, scales: { y: { min: 0, max: 999 } } }} />
    </div>
  );
}

// Developer: API-key lifecycle mix (active vs revoked) doughnut.
export function ApiKeyStatusDoughnut({ active, revoked }: { active: number; revoked: number }) {
  const data = {
    labels: ["Active", "Revoked"],
    datasets: [{ data: [active, revoked], backgroundColor: ["#2e8b22", "#c1121f"], borderWidth: 0 }],
  };
  return (
    <div style={{ height: 140 }}>
      <Doughnut data={data} options={{ ...baseOptions, cutout: "58%" }} />
    </div>
  );
}

// Developer: synthetic weekly API call volume for the selected agent (bar).
export function ApiUsageBar({ labels, calls }: { labels: string[]; calls: number[] }) {
  const data = {
    labels,
    datasets: [{ label: "Trust-query API calls", data: calls, backgroundColor: "#316ac5" }],
  };
  return (
    <div style={{ height: 150 }}>
      <Bar data={data} options={{ ...baseOptions, scales: { y: { ticks: { precision: 0 } } } }} />
    </div>
  );
}

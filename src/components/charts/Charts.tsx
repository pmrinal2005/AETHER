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
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar, Scatter, Radar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
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

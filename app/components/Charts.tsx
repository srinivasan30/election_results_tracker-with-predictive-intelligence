"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { ElectionData, PARTY_CONFIGS, MAGIC_NUMBER } from "@/app/types";

interface ChartsProps {
  data: ElectionData;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; total: number; won: number; leading: number }; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const config = PARTY_CONFIGS[d.name] ?? PARTY_CONFIGS["Others"];
  return (
    <div className="glass-card-strong rounded-xl p-3 border shadow-2xl text-sm">
      <p className="font-bold text-white mb-2" style={{ color: config.accentColor }}>
        {config.shortName}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Won</span>
          <span className="text-white font-semibold">{d.won}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Leading</span>
          <span className="font-semibold" style={{ color: config.accentColor }}>{d.leading}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
          <span className="text-slate-300">Total</span>
          <span className="text-white font-bold">{d.total}</span>
        </div>
      </div>
    </div>
  );
}

// ── Custom Donut Tooltip ───────────────────────────────────────────────────────
function CustomPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { voteShare: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const config = PARTY_CONFIGS[d.name] ?? PARTY_CONFIGS["Others"];
  return (
    <div className="glass-card-strong rounded-xl p-3 shadow-2xl text-sm">
      <p className="font-bold mb-1" style={{ color: config.accentColor }}>
        {config.shortName}
      </p>
      <p className="text-white text-xs">{d.payload.voteShare.toFixed(2)}% vote share</p>
    </div>
  );
}

export default function Charts({ data }: ChartsProps) {
  const sorted = [...data.parties].sort((a, b) => b.total - a.total);

  const barData = sorted.map((p) => ({
    name: p.party,
    total: p.total,
    won: p.won,
    leading: p.leading,
    voteShare: p.voteShare,
    fill: PARTY_CONFIGS[p.party]?.chartColor ?? "#475569",
  }));

  const pieData = sorted
    .filter((p) => p.voteShare > 0)
    .map((p) => ({
      name: p.party,
      value: p.voteShare,
      voteShare: p.voteShare,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="charts-section">
      {/* Bar Chart */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-sm">
            📊
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
              Seat Tally
            </h3>
            <p className="text-slate-500 text-xs">Won + Leading</p>
          </div>
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, Math.max(MAGIC_NUMBER + 20, ...barData.map((d) => d.total + 10))]}
              />
              {/* Majority reference line */}
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="rgba(234,179,8,0.4)"
                horizontal={true}
                vertical={false}
                horizontalCoordinatesGenerator={(props) => {
                  const { yAxis } = props as { yAxis: { scale: (v: number) => number } };
                  return [yAxis.scale(MAGIC_NUMBER)];
                }}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-2 justify-end">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-amber-400/60" />
          <span className="text-amber-400/70 text-xs">Majority ({MAGIC_NUMBER})</span>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm">
            🍩
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
              Vote Share
            </h3>
            <p className="text-slate-500 text-xs">% of total votes polled</p>
          </div>
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius="50%"
                outerRadius="75%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PARTY_CONFIGS[entry.name]?.chartColor ?? "#475569"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>
                    {PARTY_CONFIGS[value]?.shortName ?? value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

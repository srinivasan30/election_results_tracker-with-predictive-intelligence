"use client";

import { ElectionData, PARTY_CONFIGS, MAGIC_NUMBER, TOTAL_SEATS } from "@/app/types";

interface MagicNumberProps {
  data: ElectionData;
}

export default function MagicNumberSection({ data }: MagicNumberProps) {
  const sorted = [...data.parties].sort((a, b) => b.total - a.total);
  const leader = sorted[0];
  const runnerUp = sorted[1];

  if (!leader) return null;

  const leaderConfig = PARTY_CONFIGS[leader.party] ?? PARTY_CONFIGS["Others"];
  const leaderPct = (leader.total / TOTAL_SEATS) * 100;
  const toMagic = Math.max(0, MAGIC_NUMBER - leader.total);
  const hasMajority = leader.total >= MAGIC_NUMBER;
  const gap = leader.total - (runnerUp?.total ?? 0);

  const seatsReported = data.parties.reduce((s, p) => s + p.total, 0);
  const seatsRemaining = TOTAL_SEATS - seatsReported;
  const countingPct = Math.min(100, (seatsReported / TOTAL_SEATS) * 100);

  return (
    <section className="glass-card p-5 sm:p-6" id="magic-number-section">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm">
          🎯
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
            Majority Projection
          </h2>
          <p className="text-slate-500 text-xs">Magic number: {MAGIC_NUMBER} seats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Leader card */}
        <div
          className="rounded-xl p-4 border"
          style={{ background: `${leaderConfig.accentColor}11`, borderColor: `${leaderConfig.accentColor}33` }}
        >
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Currently Leading</p>
          <p className="font-display text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>
            {leaderConfig.shortName}
          </p>
          <p
            className="text-4xl font-black font-display tabular-nums"
            style={{ fontFamily: "Outfit, sans-serif", color: leaderConfig.accentColor }}
          >
            {leader.total}
          </p>
          <p className="text-slate-400 text-xs mt-1">seats won + leading</p>
        </div>

        {/* Magic number status */}
        <div className="rounded-xl p-4 bg-white/5 border border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
            {hasMajority ? "Majority Status" : "To Majority"}
          </p>
          {hasMajority ? (
            <>
              <div className="text-4xl font-black text-green-400 font-display" style={{ fontFamily: "Outfit, sans-serif" }}>
                ✓ Done
              </div>
              <p className="text-green-400/70 text-xs mt-1">
                Exceeds by {leader.total - MAGIC_NUMBER} seats
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-black text-amber-400 font-display tabular-nums" style={{ fontFamily: "Outfit, sans-serif" }}>
                {toMagic}
              </p>
              <p className="text-slate-400 text-xs mt-1">more seats needed</p>
            </>
          )}
        </div>

        {/* Lead gap */}
        <div className="rounded-xl p-4 bg-white/5 border border-white/10 sm:col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Lead Over #2</p>
          <p className="text-4xl font-black text-blue-400 font-display tabular-nums" style={{ fontFamily: "Outfit, sans-serif" }}>
            +{gap}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            vs {PARTY_CONFIGS[runnerUp?.party ?? "Others"]?.shortName ?? "Runner-up"} ({runnerUp?.total ?? 0} seats)
          </p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{seatsReported} seats reported ({countingPct.toFixed(0)}%)</span>
          <span>{seatsRemaining} remaining</span>
        </div>

        {/* Stacked bar */}
        <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden border border-white/10">
          {/* Party segments */}
          {(() => {
            let offset = 0;
            return sorted.map((p) => {
              const config = PARTY_CONFIGS[p.party] ?? PARTY_CONFIGS["Others"];
              const pct = (p.total / TOTAL_SEATS) * 100;
              const style = {
                position: "absolute" as const,
                left: `${offset}%`,
                width: `${pct}%`,
                height: "100%",
                background: config.accentColor,
                transition: "width 0.8s ease, left 0.8s ease",
              };
              offset += pct;
              return (
                <div key={p.party} style={style} title={`${config.shortName}: ${p.total}`}>
                  {pct > 5 && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {config.shortName}
                    </span>
                  )}
                </div>
              );
            });
          })()}

          {/* Majority line */}
          <div
            className="majority-line"
            style={{ left: `${(MAGIC_NUMBER / TOTAL_SEATS) * 100}%` }}
            title={`Majority: ${MAGIC_NUMBER}`}
          >
            <div className="absolute -top-0 left-1 text-amber-400 text-xs font-bold whitespace-nowrap">
              {MAGIC_NUMBER}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-3">
          {sorted.map((p) => {
            const config = PARTY_CONFIGS[p.party] ?? PARTY_CONFIGS["Others"];
            return (
              <div key={p.party} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: config.accentColor }} />
                <span className="text-slate-400 text-xs">{config.shortName} ({p.total})</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-amber-400 opacity-70" />
            <span className="text-slate-400 text-xs">Majority ({MAGIC_NUMBER})</span>
          </div>
        </div>
      </div>

      {/* Trend text */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{
          background: hasMajority
            ? `${leaderConfig.accentColor}11`
            : "rgba(255,255,255,0.03)",
          borderColor: hasMajority ? `${leaderConfig.accentColor}33` : "rgba(255,255,255,0.08)",
          border: "1px solid",
        }}
      >
        {hasMajority ? (
          <p className="text-white">
            <span style={{ color: leaderConfig.accentColor }} className="font-bold">
              {leaderConfig.shortName}
            </span>{" "}
            is projected to form the government with{" "}
            <span className="font-bold text-white">{leader.total} seats</span> —{" "}
            <span className="text-green-400 font-semibold">{leader.total - MAGIC_NUMBER} seats above majority</span>.
          </p>
        ) : seatsRemaining < toMagic ? (
          <p className="text-slate-300">
            <span style={{ color: leaderConfig.accentColor }} className="font-bold">
              {leaderConfig.shortName}
            </span>{" "}
            cannot achieve an independent majority. Only{" "}
            <span className="text-amber-400 font-semibold">{seatsRemaining} seats remaining</span> but needs{" "}
            <span className="font-bold text-white">{toMagic} more</span>. A coalition may be required.
          </p>
        ) : (
          <p className="text-slate-300">
            <span style={{ color: leaderConfig.accentColor }} className="font-bold">
              {leaderConfig.shortName}
            </span>{" "}
            needs <span className="text-amber-400 font-semibold">{toMagic} more seats</span> to secure majority.{" "}
            <span className="text-slate-400">{seatsRemaining} seats still being counted.</span>
          </p>
        )}
      </div>
    </section>
  );
}

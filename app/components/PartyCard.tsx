"use client";

import { PartyResult, PARTY_CONFIGS, MAGIC_NUMBER, TOTAL_SEATS } from "@/app/types";
import { useEffect, useRef, useState } from "react";

interface PartyCardProps {
  party: PartyResult;
  rank: number;
  isLeading: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return;
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const tick = (t: number) => {
      const progress = Math.min((t - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prevRef.current = value;
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

export default function PartyCard({ party, rank, isLeading }: PartyCardProps) {
  const config = PARTY_CONFIGS[party.party] ?? PARTY_CONFIGS["Others"];
  const totalPct = TOTAL_SEATS > 0 ? (party.total / TOTAL_SEATS) * 100 : 0;
  const toMagic = Math.max(0, MAGIC_NUMBER - party.total);
  const barWidth = Math.min(100, totalPct);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-default ${config.cardClass} ${
        isLeading ? (party.party === "DMK" ? "glow-red" : "glow-green") : ""
      }`}
      id={`party-card-${party.party.toLowerCase()}`}
    >
      {/* Rank badge */}
      {rank <= 3 && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
          #{rank}
        </div>
      )}

      {/* Leading crown */}
      {isLeading && (
        <div className="absolute top-3 right-10 text-amber-400 text-sm animate-bounce">👑</div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${config.accentColor}22`, border: `1px solid ${config.accentColor}44` }}
        >
          {config.icon}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-tight font-display" style={{ fontFamily: "Outfit, sans-serif" }}>
            {config.shortName}
          </p>
          <p className="text-white/50 text-xs leading-tight truncate max-w-[160px]">{config.name}</p>
        </div>
      </div>

      {/* Main number */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-display text-4xl sm:text-5xl font-black text-white"
            style={{ fontFamily: "Outfit, sans-serif", textShadow: `0 0 30px ${config.accentColor}66` }}
          >
            <AnimatedNumber value={party.total} />
          </span>
          <span className="text-white/40 text-sm font-medium">/ {TOTAL_SEATS}</span>
        </div>
        <p className="text-white/40 text-xs uppercase tracking-widest">Total (Won + Leading)</p>
      </div>

      {/* Progress bar toward majority */}
      <div className="mb-4">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${barWidth}%`,
              background: `linear-gradient(90deg, ${config.accentColor}88, ${config.accentColor})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-white/40 text-xs">{totalPct.toFixed(1)}% of seats</span>
          {toMagic > 0 ? (
            <span className="text-amber-400/70 text-xs">Need {toMagic} more</span>
          ) : (
            <span className="text-green-400 text-xs font-semibold">✓ Majority</span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-white font-bold text-lg">
            <AnimatedNumber value={party.won} />
          </p>
          <p className="text-white/40 text-xs">Won</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-white font-bold text-lg" style={{ color: config.accentColor }}>
            <AnimatedNumber value={party.leading} />
          </p>
          <p className="text-white/40 text-xs">Leading</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-white font-bold text-lg">{party.voteShare.toFixed(1)}%</p>
          <p className="text-white/40 text-xs">Vote %</p>
        </div>
      </div>
    </div>
  );
}

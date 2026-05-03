"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date; // 8 AM IST on election day
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const digits = [
    { label: "Days", value: pad(timeLeft.days) },
    { label: "Hours", value: pad(timeLeft.hours) },
    { label: "Mins", value: pad(timeLeft.minutes) },
    { label: "Secs", value: pad(timeLeft.seconds) },
  ];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-red-700/30 to-red-900/50 border border-red-700/40 flex items-center justify-center text-5xl shadow-2xl">
          🗳
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <span className="text-xs">⏳</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
        Results Haven&#39;t Started Yet
      </h2>
      <p className="text-slate-400 text-base sm:text-lg mb-2 max-w-md">
        Counting begins at <span className="text-white font-semibold">8:00 AM IST</span>
      </p>
      <p className="text-slate-500 text-sm mb-12">
        Tamil Nadu Legislative Assembly Election 2026
      </p>

      {/* Countdown */}
      <div className="flex items-end gap-3 sm:gap-4 mb-10">
        {digits.map((d, i) => (
          <div key={d.label} className="flex items-end gap-3 sm:gap-4">
            <div className="countdown-digit flex flex-col items-center">
              <span className="font-display text-3xl sm:text-5xl font-bold text-white tabular-nums" style={{ fontFamily: "Outfit, sans-serif" }}>
                {d.value}
              </span>
              <span className="text-slate-500 text-xs mt-1 uppercase tracking-widest">{d.label}</span>
            </div>
            {i < digits.length - 1 && (
              <span className="text-slate-600 text-3xl sm:text-4xl font-light mb-4">:</span>
            )}
          </div>
        ))}
      </div>

      {/* Waiting indicator */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400"
              style={{ animation: `livePulse 1.5s ease-in-out ${i * 0.3}s infinite` }}
            />
          ))}
        </div>
        <span className="text-slate-300 text-sm">Waiting for official ECI data…</span>
      </div>

      {/* Party preview */}
      <div className="mt-16 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl w-full">
        {[
          { name: "DMK", color: "#CC0000", icon: "☀" },
          { name: "AIADMK", color: "#00AA00", icon: "🌿" },
          { name: "TVK", color: "#FFD700", icon: "⭐" },
          { name: "NTK", color: "#FF6600", icon: "🔥" },
          { name: "Others", color: "#64748B", icon: "◆" },
        ].map((p) => (
          <div
            key={p.name}
            className="glass-card p-3 flex flex-col items-center gap-1 hover:scale-105 transition-transform duration-200"
          >
            <span className="text-lg">{p.icon}</span>
            <span className="text-xs font-bold text-white">{p.name}</span>
            <div className="w-8 h-1 rounded-full mt-1" style={{ background: p.color }} />
          </div>
        ))}
      </div>
    </div>
  );
}

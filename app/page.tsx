"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ElectionData, PARTY_CONFIGS } from "@/app/types";
import Header from "@/app/components/Header";
import PartyCard from "@/app/components/PartyCard";
import Charts from "@/app/components/Charts";
import MagicNumber from "@/app/components/MagicNumber";
import CountdownTimer from "@/app/components/CountdownTimer";
import ErrorBanner from "@/app/components/ErrorBanner";

// Election day: May 4, 2026 8:00 AM IST
const ELECTION_RESULT_DATE = new Date("2026-05-04T02:30:00.000Z"); // 08:00 IST = 02:30 UTC
const POLL_INTERVAL_MS = 20_000;

// Ordered party display list
const PARTY_ORDER = ["DMK", "AIADMK", "TVK", "NTK", "Others"];

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 shimmer" style={{ background: "rgba(255,255,255,0.04)", minHeight: 220 }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl shimmer bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded shimmer bg-white/5 w-20" />
          <div className="h-3 rounded shimmer bg-white/5 w-32" />
        </div>
      </div>
      <div className="h-12 rounded shimmer bg-white/5 mb-4 w-24" />
      <div className="h-2 rounded shimmer bg-white/5 mb-4" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-lg shimmer bg-white/5" />
        ))}
      </div>
    </div>
  );
}

function SummaryBanner({ data }: { data: ElectionData }) {
  const sorted = [...data.parties].sort((a, b) => b.total - a.total);
  const leader = sorted[0];
  const total = data.parties.reduce((s, p) => s + p.total, 0);
  const config = PARTY_CONFIGS[leader?.party ?? ""] ?? PARTY_CONFIGS["Others"];

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 mb-2"
      style={{
        background: `linear-gradient(135deg, ${config.accentColor}15 0%, rgba(255,255,255,0.03) 100%)`,
        border: `1px solid ${config.accentColor}30`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Current Status</p>
          <p className="text-white font-bold text-lg font-display" style={{ fontFamily: "Outfit, sans-serif" }}>
            {data.countingStatus}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">
            <span className="text-white font-semibold">{total}</span> of{" "}
            <span className="text-white font-semibold">{data.totalSeats}</span> seats reported
          </p>
        </div>
        {leader && (
          <div className="text-right">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Ahead</p>
            <p className="font-bold text-xl" style={{ color: config.accentColor, fontFamily: "Outfit, sans-serif" }}>
              {config.shortName}
            </p>
            <p className="text-white font-black text-3xl tabular-nums" style={{ fontFamily: "Outfit, sans-serif" }}>
              {leader.total}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniCountdownBanner({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-xl p-3 mb-2 bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-center gap-4">
      <span className="text-amber-400/80 text-sm font-medium">Time until counting starts</span>
      <span className="font-display text-xl font-bold text-amber-400 tabular-nums" style={{ fontFamily: "Outfit, sans-serif" }}>
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<ElectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isPreElection, setIsPreElection] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ElectionData = await res.json();

      // Always show the dashboard even if data is zero (user request)
      setIsPreElection(false);

      setData(json);
      setLastFetched(new Date());

      // Only show error if it's a real connectivity issue, not a pre-election notice
      if (json.error && totalSeats > 0) {
        setError(json.error);
      } else if (json.error && json.dataSource === "mock" && totalSeats > 0) {
        setError(json.error);
      } else {
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(`Failed to fetch: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Sort parties in preferred order
  const sortedParties = data
    ? PARTY_ORDER.map((name) => data.parties.find((p) => p.party === name)).filter(Boolean)
    : [];

  const leadingParty = data
    ? [...(data.parties ?? [])].sort((a, b) => b.total - a.total)[0]
    : null;

  return (
    <div className="min-h-screen">
      <Header
        data={data}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchData}
        lastFetched={lastFetched}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Pre-election countdown */}
        {isPreElection && !data?.parties?.length ? (
          <CountdownTimer targetDate={ELECTION_RESULT_DATE} />
        ) : (
          <div className="space-y-6 animate-fade-in">

            {/* Error banner */}
            {error && (
              <ErrorBanner message={error} hasStaleData={!!data} />
            )}

            <MiniCountdownBanner targetDate={ELECTION_RESULT_DATE} />

            {/* Summary banner */}
            {data && !isLoading && <SummaryBanner data={data} />}

            {/* Party cards grid */}
            <section id="party-cards">
              <div className="flex items-center gap-2 mb-4">
                <h2
                  className="font-display text-lg font-bold text-white"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  Party Results
                </h2>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-slate-500 text-xs">234 total seats</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {isLoading && !data
                  ? PARTY_ORDER.map((name) => <SkeletonCard key={name} />)
                  : sortedParties.map((party, i) => {
                      if (!party) return null;
                      return (
                        <PartyCard
                          key={party.party}
                          party={party}
                          rank={i + 1}
                          isLeading={party.party === leadingParty?.party}
                        />
                      );
                    })}
              </div>
            </section>

            {/* Charts */}
            {data && data.parties.length > 0 && (
              <section id="charts">
                <div className="flex items-center gap-2 mb-4">
                  <h2
                    className="font-display text-lg font-bold text-white"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    Visualisations
                  </h2>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <Charts data={data} />
              </section>
            )}

            {/* Magic number / projection */}
            {data && data.parties.length > 0 && (
              <section id="projection">
                <div className="flex items-center gap-2 mb-4">
                  <h2
                    className="font-display text-lg font-bold text-white"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    Majority Projection
                  </h2>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <MagicNumber data={data} />
              </section>
            )}

            {/* Footer info */}
            <footer className="pt-4 pb-8 text-center">
              <p className="text-slate-600 text-xs">
                Data sourced from{" "}
                <a
                  href="https://results.eci.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-400 underline"
                >
                  results.eci.gov.in
                </a>{" "}
                · Auto-refreshes every 20 seconds · For informational purposes only
              </p>
              <p className="text-slate-700 text-xs mt-1">
                Built by Srinivasan with love for Tamil Nadu
              </p>
            </footer>
          </div>
        )}
      </main>

      {/* Floating refresh countdown ring — mobile */}
      <RefreshRing onRefresh={fetchData} isLoading={isLoading} interval={POLL_INTERVAL_MS} />
    </div>
  );
}

// Mini countdown ring showing seconds until next auto-refresh
function RefreshRing({ onRefresh, isLoading, interval }: { onRefresh: () => void; isLoading: boolean; interval: number }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = (elapsed % interval) / interval;
      setProgress(pct);
    }, 250);
    return () => clearInterval(t);
  }, [interval, isLoading]);

  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);

  return (
    <button
      onClick={onRefresh}
      disabled={isLoading}
      className="fixed bottom-6 right-4 sm:hidden z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95"
      style={{ background: "rgba(10,15,30,0.9)", border: "1px solid rgba(255,255,255,0.12)" }}
      title="Refresh now"
      id="floating-refresh-btn"
    >
      <svg width="52" height="52" viewBox="0 0 52 52" className="absolute">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={isLoading ? "#22c55e" : "#e11d48"}
          strokeWidth="2"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <span className="text-lg">{isLoading ? "⏳" : "🔄"}</span>
    </button>
  );
}

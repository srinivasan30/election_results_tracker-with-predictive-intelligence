"use client";

import { ElectionData } from "@/app/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface HeaderProps {
  data: ElectionData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  lastFetched: Date | null;
}

export default function Header({
  data,
  isLoading,
  error,
  onRefresh,
  lastFetched,
}: HeaderProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsAgo = lastFetched
    ? Math.floor((now.getTime() - lastFetched.getTime()) / 1000)
    : null;

  return (
    <header className="header-blur sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-lg shadow-lg">
                🗳
              </div>
            </div>
            <div className="min-w-0">
              <h1
                className="font-display font-bold text-sm sm:text-base text-white leading-tight truncate"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                TN Election 2026
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tamil Nadu Assembly Results • Live
              </p>
            </div>
          </div>

          {/* Status + Refresh */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live badge */}
            {!error && data && (
              <div className="hidden sm:flex items-center gap-1.5 bg-green-950/50 border border-green-700/40 rounded-full px-3 py-1">
                <span className="live-dot" />
                <span className="text-green-400 text-xs font-semibold">LIVE</span>
              </div>
            )}

            {/* Last updated */}
            {lastFetched && (
              <div className="hidden md:block text-right">
                <p className="text-xs text-slate-500">Updated</p>
                <p className="text-xs text-slate-300 font-medium">
                  {format(lastFetched, "hh:mm:ss a")}
                </p>
              </div>
            )}

            {/* Refresh button */}
            <button
              id="refresh-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-red-700/20 hover:bg-red-700/40 border border-red-700/40 hover:border-red-600/60 text-red-300 hover:text-white rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">
                {isLoading ? "Refreshing…" : "Refresh"}
              </span>
            </button>
            {/* Made by Srini */}
            <a
              href="https://github.com/srinivasan30"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
            >
              <span>Made by Srini</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom row — status bar */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {data && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  {data.countingStatus}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">234 Constituencies</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-amber-400 text-xs">⚠ {error.slice(0, 50)}</span>
            )}
            {secondsAgo !== null && (
              <span className="text-slate-600">
                {secondsAgo < 5
                  ? "Just now"
                  : secondsAgo < 60
                  ? `${secondsAgo}s ago`
                  : `${Math.floor(secondsAgo / 60)}m ago`}
              </span>
            )}
            {data?.dataSource && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  data.dataSource === "live"
                    ? "bg-green-900/40 text-green-400"
                    : data.dataSource === "cached"
                    ? "bg-blue-900/40 text-blue-400"
                    : "bg-amber-900/40 text-amber-400"
                }`}
              >
                {data.dataSource.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

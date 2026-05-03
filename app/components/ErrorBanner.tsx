"use client";

interface ErrorBannerProps {
  message: string;
  hasStaleData: boolean;
}

export default function ErrorBanner({ message, hasStaleData }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4 border animate-fade-in"
      role="alert"
      id="error-banner"
      style={{
        background: "rgba(161,98,7,0.12)",
        borderColor: "rgba(217,119,6,0.35)",
      }}
    >
      <span className="text-amber-400 text-xl flex-shrink-0 mt-0.5">⚠</span>
      <div className="min-w-0">
        <p className="text-amber-300 font-semibold text-sm mb-0.5">
          Experiencing delays from ECI servers
        </p>
        <p className="text-amber-400/70 text-xs leading-relaxed">
          {message || "Unable to fetch live data from the Election Commission of India website."}
        </p>
        {hasStaleData && (
          <p className="text-slate-400 text-xs mt-1">
            📦 Showing last known data — results may not reflect latest counts.
          </p>
        )}
      </div>
    </div>
  );
}

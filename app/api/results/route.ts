import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ── Types ────────────────────────────────────────────────────────────────────
export interface PartyResult {
  party: string;
  won: number;
  leading: number;
  total: number;
  voteShare: number;
}

export interface ElectionData {
  state: string;
  totalSeats: number;
  majorityMark: number;
  countingStatus: string;
  lastUpdated: string;
  parties: PartyResult[];
  dataSource: "live" | "mock" | "cached";
  cacheAge?: number;
  error?: string;
}

// ── In-memory cache ──────────────────────────────────────────────────────────
let cache: { data: ElectionData | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL_MS = 20_000; // 20 seconds

// ── ECI candidate URLs for TN 2026 state election ────────────────────────────
// Tamil Nadu state code on ECI results site: S22
// The exact path changes per election cycle; we try multiple known patterns.
const ECI_URLS = [
  // Live TN state election pattern (May 2026)
  "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm",
  "https://results.eci.gov.in/AcResultGen2026/partywiseresult-S22.htm",
  "https://results.eci.gov.in/AcResult2026/partywiseresult-S22.htm",
  "https://results.eci.gov.in/partywiseresult-S22.htm",
  // Fallback: main results portal
  "https://results.eci.gov.in/",
];

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9,ta;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://results.eci.gov.in/",
};

// ── Pre-election representative data ─────────────────────────────────────────
// Shown when ECI site has no data yet (before counting begins).
// Based on 2021 election results as baseline — will be replaced by live data.
function getPreElectionPlaceholder(): ElectionData {
  return {
    state: "Tamil Nadu",
    totalSeats: 234,
    majorityMark: 118,
    countingStatus: "Awaiting Results — Counting begins at 8 AM IST",
    lastUpdated: new Date().toISOString(),
    dataSource: "mock",
    parties: [
      { party: "DMK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "AIADMK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "TVK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "NTK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "Others", won: 0, leading: 0, total: 0, voteShare: 0 },
    ],
    error: "Election counting has not started yet. Data will update automatically at 8:00 AM IST on counting day.",
  };
}

// Representative sample data (used if ECI down mid-count for demo purposes)
function getMockData(): ElectionData {
  return {
    state: "Tamil Nadu",
    totalSeats: 234,
    majorityMark: 118,
    countingStatus: "Counting in Progress",
    lastUpdated: new Date().toISOString(),
    dataSource: "mock",
    parties: [
      { party: "DMK", won: 92, leading: 45, total: 137, voteShare: 38.2 },
      { party: "AIADMK", won: 28, leading: 18, total: 46, voteShare: 22.7 },
      { party: "TVK", won: 8, leading: 12, total: 20, voteShare: 10.4 },
      { party: "NTK", won: 2, leading: 4, total: 6, voteShare: 6.1 },
      { party: "Others", won: 12, leading: 13, total: 25, voteShare: 22.6 },
    ],
    error: "Live data unavailable. Displaying representative sample data — not actual results.",
  };
}

// ── Main scraper ──────────────────────────────────────────────────────────────
async function scrapeECI(): Promise<ElectionData> {
  const errors: string[] = [];

  for (const url of ECI_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);

      const res = await fetch(url, {
        headers: HEADERS,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!res.ok) {
        errors.push(`${url}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();

      // Check if this page has Tamil Nadu election result data
      const parsed = parseECIHtml(html, url);
      if (parsed && parsed.parties.some((p) => p.total > 0)) {
        console.log(`[ECI] ✓ Live data from ${url}`);
        return { ...parsed, dataSource: "live", lastUpdated: new Date().toISOString() };
      }

      // Page loaded but no TN result data → still counting/before results
      if (parsed) {
        console.log(`[ECI] Page loaded but zero data from ${url} — pre-election state`);
        errors.push(`${url}: Page has TN structure but all zeros (pre-counting)`);
      } else {
        errors.push(`${url}: No Tamil Nadu data found`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${url}: ${msg}`);
    }
  }

  console.warn("[ECI Scraper] No live data available:", errors.join(" | "));

  // Return pre-election placeholder (zeros) — frontend will show countdown
  const placeholder = getPreElectionPlaceholder();
  placeholder.error = `ECI servers not yet serving results. Counting may not have started. (${errors[0]})`;
  return placeholder;
}

// ── HTML parser ───────────────────────────────────────────────────────────────
function parseECIHtml(html: string, _url: string): ElectionData | null {
  try {
    const $ = cheerio.load(html);

    // Heuristic: does this page mention Tamil Nadu?
    const bodyText = $("body").text().toLowerCase();
    const hasTN =
      bodyText.includes("tamil") ||
      bodyText.includes("s22") ||
      $("title").text().toLowerCase().includes("tamil");

    if (!hasTN) return null;

    const partiesMap = new Map<string, PartyResult>();

    // Strategy: scan every table for party-result rows
    $("table").each((_i, table) => {
      $(table)
        .find("tr")
        .each((_j, row) => {
          const cells = $(row).find("td");
          if (cells.length < 3) return;

          const col0 = $(cells[0]).text().trim();
          const col1 = $(cells[1]).text().trim();
          const col2 = $(cells[2]).text().trim();

          // Skip headers / total rows
          if (!col0 || /^(party|total|sl\.?no|s\.?no|#)/i.test(col0)) return;
          if (/^(total|grand total)/i.test(col0)) return;

          const won = parseNum(col1);
          const leading = cells.length >= 4 ? parseNum($(cells[2]).text()) : 0;
          const totalCell = cells.length >= 4 ? $(cells[3]).text() : $(cells[2]).text();
          const total = parseNum(totalCell) || won + leading;
          const voteShareCell = cells.length >= 5 ? $(cells[4]).text() : "0";
          const voteShare = parseFloat(voteShareCell.replace(/[^0-9.]/g, "")) || 0;

          const normName = normaliseParty(col0);
          if (normName && (won + leading + voteShare > 0)) {
            const existing = partiesMap.get(normName);
            if (existing) {
              existing.won += won;
              existing.leading += leading;
              existing.total += total;
              existing.voteShare = Math.max(existing.voteShare, voteShare);
            } else {
              partiesMap.set(normName, { party: normName, won, leading, total, voteShare });
            }
          }
        });
    });

    if (partiesMap.size === 0) {
      // Try a fallback: look for JSON-LD or data- attributes
      return null;
    }

    // Consolidate known parties vs Others
    const KNOWN = ["DMK", "AIADMK", "TVK", "NTK"];
    const mainParties: PartyResult[] = [];
    let othWon = 0, othLeading = 0, othVs = 0;

    for (const [, p] of partiesMap) {
      if (KNOWN.includes(p.party)) {
        mainParties.push(p);
      } else {
        othWon += p.won;
        othLeading += p.leading;
        othVs += p.voteShare;
      }
    }

    // Ensure all known parties present (with zeros if absent)
    for (const k of KNOWN) {
      if (!mainParties.find((p) => p.party === k)) {
        mainParties.push({ party: k, won: 0, leading: 0, total: 0, voteShare: 0 });
      }
    }

    mainParties.push({
      party: "Others",
      won: othWon,
      leading: othLeading,
      total: othWon + othLeading,
      voteShare: Math.round(othVs * 10) / 10,
    });

    const totalReported = mainParties.reduce((s, p) => s + p.total, 0);
    const countingStatus =
      totalReported === 0
        ? "Awaiting Results"
        : totalReported < 200
        ? "Counting in Progress"
        : "Counting Complete";

    return {
      state: "Tamil Nadu",
      totalSeats: 234,
      majorityMark: 118,
      countingStatus,
      lastUpdated: new Date().toISOString(),
      dataSource: "live",
      parties: mainParties,
    };
  } catch (err) {
    console.error("[parseECIHtml]", err);
    return null;
  }
}

function parseNum(s: string): number {
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function normaliseParty(raw: string): string {
  const u = raw.toUpperCase().replace(/\s+/g, " ").trim();
  // IMPORTANT: Check AIADMK BEFORE DMK — both contain "DRAVIDA MUNNETRA"
  if (u === "AIADMK" || u.includes("ALL INDIA ANNA") || u.includes("ANNA DRAVIDA") || u.includes("A.I.A.D.M.K")) return "AIADMK";
  if (u === "DMK" || u.includes("DRAVIDA MUNNETRA")) return "DMK";
  if (u === "TVK" || u.includes("TAMILAGA VETTRI") || u.includes("VETTRI KAZHAGAM")) return "TVK";
  if (u === "NTK" || u.includes("NAM TAMILAR")) return "NTK";
  if (u === "INC" || u.includes("INDIAN NATIONAL CONGRESS")) return "INC";
  if (u === "BJP" || u.includes("BHARATIYA JANATA")) return "BJP";
  // Return non-empty party names as-is for Others aggregation
  return raw.trim().length > 1 ? raw.trim() : "";
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now();

  // Serve from cache if still fresh
  if (cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cache.data,
      dataSource: "cached" as const,
      cacheAge: Math.round((now - cache.timestamp) / 1000),
    });
  }

  try {
    const data = await scrapeECI();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/results] Unhandled:", msg);

    // Stale cache fallback
    if (cache.data) {
      return NextResponse.json({
        ...cache.data,
        dataSource: "cached" as const,
        error: `Refresh failed: ${msg}`,
        cacheAge: Math.round((now - (cache.timestamp || now)) / 1000),
      });
    }

    // Last resort: zeros placeholder
    const fallback = getPreElectionPlaceholder();
    fallback.error = `ECI unavailable: ${msg}`;
    return NextResponse.json(fallback, { status: 200 });
  }
}

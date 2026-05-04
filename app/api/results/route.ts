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

// ── ECI URL ──────────────────────────────────────────────────────────────────
const ECI_URL = "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm";

// Google Apps Script proxy URL — set this env var on Vercel
// This is needed because ECI blocks all datacenter IPs (Vercel, AWS, etc.)
// Google's IPs are NOT blocked, so a Google Apps Script acts as a relay
const GAS_PROXY_URL = process.env.GAS_PROXY_URL || "";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9,ta;q=0.8",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://results.eci.gov.in/",
};

// ── Pre-election placeholder ─────────────────────────────────────────────────
function getPreElectionPlaceholder(): ElectionData {
  return {
    state: "Tamil Nadu",
    totalSeats: 234,
    majorityMark: 118,
    countingStatus: "Awaiting Results",
    lastUpdated: new Date().toISOString(),
    dataSource: "mock",
    parties: [
      { party: "DMK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "AIADMK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "TVK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "NTK", won: 0, leading: 0, total: 0, voteShare: 0 },
      { party: "Others", won: 0, leading: 0, total: 0, voteShare: 0 },
    ],
  };
}

// ── Fetch HTML from ECI (multiple strategies) ────────────────────────────────
async function fetchECIHtml(): Promise<{ html: string; source: string } | null> {
  const errors: string[] = [];

  // Strategy 1: Direct fetch (works from residential IPs / localhost)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(ECI_URL, {
      headers: HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const html = await res.text();
      if (html.length > 500) {
        console.log("[ECI] ✓ Direct fetch succeeded");
        return { html, source: "direct" };
      }
    } else {
      errors.push(`direct: HTTP ${res.status}`);
    }
  } catch (err) {
    errors.push(`direct: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Strategy 2: Google Apps Script proxy (works from Vercel)
  if (GAS_PROXY_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const gasUrl = `${GAS_PROXY_URL}?url=${encodeURIComponent(ECI_URL)}`;
      const res = await fetch(gasUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        // GAS might return JSON wrapper or raw HTML
        let html = text;
        try {
          const json = JSON.parse(text);
          html = json.html || json.content || json.data || text;
        } catch {
          // Already raw HTML
        }
        if (html.length > 500) {
          console.log("[ECI] ✓ Google Apps Script proxy succeeded");
          return { html, source: "gas-proxy" };
        }
      } else {
        errors.push(`gas-proxy: HTTP ${res.status}`);
      }
    } catch (err) {
      errors.push(`gas-proxy: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.warn("[ECI] All fetch strategies failed:", errors.join(" | "));
  return null;
}

// ── Main scraper ──────────────────────────────────────────────────────────────
async function scrapeECI(): Promise<ElectionData> {
  const result = await fetchECIHtml();

  if (!result) {
    const placeholder = getPreElectionPlaceholder();
    placeholder.error = "ECI data unavailable. If on Vercel, set GAS_PROXY_URL env var.";
    return placeholder;
  }

  const parsed = parseECIHtml(result.html);
  if (parsed && parsed.parties.some((p) => p.total > 0)) {
    return { ...parsed, dataSource: "live", lastUpdated: new Date().toISOString() };
  }

  // Page loaded but zero data — pre-election state
  const placeholder = getPreElectionPlaceholder();
  placeholder.error = "ECI page loaded but no results data yet.";
  return placeholder;
}

// ── HTML parser ───────────────────────────────────────────────────────────────
function parseECIHtml(html: string): ElectionData | null {
  try {
    const $ = cheerio.load(html);

    const bodyText = $("body").text().toLowerCase();
    const hasTN =
      bodyText.includes("tamil") ||
      bodyText.includes("s22") ||
      $("title").text().toLowerCase().includes("tamil");

    if (!hasTN) return null;

    const partiesMap = new Map<string, PartyResult>();

    // Scan every table for party-result rows
    $("table").each((_i, table) => {
      $(table)
        .find("tr")
        .each((_j, row) => {
          const cells = $(row).find("td");
          if (cells.length < 3) return;

          const col0 = $(cells[0]).text().trim();

          // Skip headers / total rows
          if (!col0 || /^(party|total|sl\.?no|s\.?no|#)/i.test(col0)) return;
          if (/^(total|grand total)/i.test(col0)) return;

          const won = parseNum($(cells[1]).text());
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

    if (partiesMap.size === 0) return null;

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

    // Ensure all known parties present
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
        : totalReported < 234
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

    // Last resort
    const fallback = getPreElectionPlaceholder();
    fallback.error = `ECI unavailable: ${msg}`;
    return NextResponse.json(fallback, { status: 200 });
  }
}

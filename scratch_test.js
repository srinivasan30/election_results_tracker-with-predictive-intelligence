const cheerio = require('cheerio');

const ECI_URLS = [
  "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm",
];

const HEADERS = {
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

function parseNum(s) {
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function normaliseParty(raw) {
  const u = raw.toUpperCase().replace(/\s+/g, " ").trim();
  if (u === "DMK" || u.includes("DRAVIDA MUNNETRA")) return "DMK";
  if (u === "AIADMK" || u.includes("ANNA DRAVIDA") || u.includes("ALL INDIA ANNA")) return "AIADMK";
  if (u === "TVK" || u.includes("TAMILAGA VETTRI") || u.includes("VETTRI KAZHAGAM")) return "TVK";
  if (u === "NTK" || u.includes("NAM TAMILAR")) return "NTK";
  if (u === "INC" || u.includes("INDIAN NATIONAL CONGRESS")) return "INC";
  if (u === "BJP" || u.includes("BHARATIYA JANATA")) return "BJP";
  return raw.trim().length > 1 ? raw.trim() : "";
}

function parseECIHtml(html, _url) {
  try {
    const $ = cheerio.load(html);

    const bodyText = $("body").text().toLowerCase();
    const hasTN =
      bodyText.includes("tamil") ||
      bodyText.includes("s22") ||
      $("title").text().toLowerCase().includes("tamil");

    if (!hasTN) return null;

    const partiesMap = new Map();

    $("table").each((_i, table) => {
      $(table)
        .find("tr")
        .each((_j, row) => {
          const cells = $(row).find("td");
          if (cells.length < 3) return;

          const col0 = $(cells[0]).text().trim();
          const col1 = $(cells[1]).text().trim();
          const col2 = $(cells[2]).text().trim();

          if (!col0 || /^(party|total|sl\.?no|s\.?no|#)/i.test(col0)) return;
          if (/^(total|grand total)/i.test(col0)) return;

          const won = parseNum(col1);
          const leading = cells.length >= 4 ? parseNum($(cells[2]).text()) : 0;
          const totalCell = cells.length >= 5 ? $(cells[3]).text() : $(cells[2]).text();
          const total = parseNum(totalCell) || won + leading;
          const voteShareCell = cells.length >= 5 ? $(cells[4]).text() : $(cells[3])?.text() ?? "0";
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
      return null;
    }

    const KNOWN = ["DMK", "AIADMK", "TVK", "NTK"];
    const mainParties = [];
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

    return { parties: mainParties };
  } catch (err) {
    console.error("[parseECIHtml]", err);
    return null;
  }
}

async function scrapeECI() {
  for (const url of ECI_URLS) {
    const res = await fetch(url, { headers: HEADERS });
    const html = await res.text();
    console.log(`Fetched ${url}, size: ${html.length}`);
    const parsed = parseECIHtml(html, url);
    console.log(JSON.stringify(parsed, null, 2));
  }
}

scrapeECI().catch(console.error);

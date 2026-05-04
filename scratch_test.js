// Test if proxy services can fetch ECI data
const proxies = [
  { name: "direct", url: "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm" },
  { name: "allorigins", url: "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm") },
  { name: "codetabs", url: "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent("https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm") },
];

async function test() {
  for (const p of proxies) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(p.url, { signal: controller.signal });
      clearTimeout(timeout);
      const text = await res.text();
      const hasTN = text.toLowerCase().includes("tamil");
      console.log(`${p.name}: status=${res.status}, size=${text.length}, hasTN=${hasTN}`);
    } catch (err) {
      console.log(`${p.name}: ERROR - ${err.message}`);
    }
  }
}
test();

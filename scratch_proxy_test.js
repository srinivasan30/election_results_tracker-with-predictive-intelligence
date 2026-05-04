const PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];
const targetUrl = "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm";

async function testProxies() {
  for (const proxy of PROXIES) {
    const fetchUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
    console.log(`\nTesting proxy: ${proxy}`);
    try {
      const res = await fetch(fetchUrl);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Length: ${text.length}`);
      const hasTN = text.toLowerCase().includes("tamil");
      console.log(`Has TN: ${hasTN}`);
      if (!hasTN) {
        console.log(`Preview: ${text.substring(0, 200).replace(/\n/g, '')}`);
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

testProxies();

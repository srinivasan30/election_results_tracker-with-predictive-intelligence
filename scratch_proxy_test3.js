const proxies = [
  "https://cors-anywhere.herokuapp.com/",
  "https://thingproxy.freeboard.io/fetch/",
  "https://crossorigin.me/",
  "https://yacdn.org/proxy/",
  "https://api.codetabs.com/v1/proxy?quest=",
];
const url = "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm";

async function test() {
  for (const proxy of proxies) {
    try {
      console.log("Testing:", proxy);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(proxy + url, { signal: controller.signal });
      clearTimeout(timeout);
      const text = await res.text();
      const hasTN = text.toLowerCase().includes("tamil");
      console.log(`Status: ${res.status}, Length: ${text.length}, HasTN: ${hasTN}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}
test();

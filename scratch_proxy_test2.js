async function test() {
  const url = "https://corsproxy.io/?" + encodeURIComponent("https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm");
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(res.status, text.substring(0, 200).replace(/\n/g, ''));
  } catch (e) {
    console.log(e);
  }
}
test();

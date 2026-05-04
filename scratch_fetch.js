fetch('https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm')
  .then(r => r.text())
  .then(html => {
    const start = html.indexOf('<table');
    const end = html.indexOf('</table>', start) + 8;
    console.log(html.substring(start, end));
  })
  .catch(console.error);

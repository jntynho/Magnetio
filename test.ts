async function run() {
  const url = "https://javtrailers.com/video/mida00402";
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  console.log(res.status);
  const json = await res.json();
  const html = json.contents;
  console.log(html.substring(0, 500));
}
run();

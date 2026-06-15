async function run() {
  const url = "https://javtrailers.com/video/mida00402";
  
  const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  
  try {
    console.log("Testing:", proxy);
    const res = await fetch(proxy, { headers: { Origin: "http://localhost:3000" } });
    console.log(res.status);
    const text = await res.text();
    console.log(text.substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
run();

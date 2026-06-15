async function run() {
  const url = "https://javtrailers.com/video/mida00402";
  
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  
  for (const proxy of proxies) {
    try {
      console.log("Testing:", proxy);
      const res = await fetch(proxy);
      console.log(res.status);
      const text = await res.text();
      console.log(text.substring(0, 100));
    } catch (e) {
      console.error(e);
    }
  }
}
run();

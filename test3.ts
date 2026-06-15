async function run() {
  const url = "https://javtrailers.com/video/mida00402";
  
  const proxies = [
    `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
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

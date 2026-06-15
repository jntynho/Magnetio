async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/extract/javtrailers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://javtrailers.com/video/mida00402" })
    });
    console.log(res.status);
    const text = await res.text();
    console.log(text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}
run();

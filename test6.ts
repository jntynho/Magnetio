async function run() {
  try {
    const id = "mida00402";
    const res = await fetch(`https://api.r18.dev/videos?site=dmm&id=${id}`);
    console.log(res.status);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();

import cloudscraper from 'cloudscraper';

async function fetchThePornDB() {
  const q = encodeURIComponent("SexMex Coordinated Desires");
  try {
    const html = await (cloudscraper as any).get(`https://api.metadataapi.net/scenes?q=${q}&parse=true`);
    const data = JSON.parse(html);
    console.log(data.data[0].performers);
  } catch (e) {
    console.error("Error with TPDB:", e.message);
  }
}
fetchThePornDB();

import cloudscraper from 'cloudscraper';

async function fetchTPDB() {
  const q = encodeURIComponent("Nia Bleu My Pervy Family");
  console.log("Querying TPDB for:", q);
  try {
    const html = await (cloudscraper as any).get(`https://theporndb.net/search?q=${q}`);
    console.log("HTML response length:", html.length);
    console.log("Snippet:", html.substring(0, 1000));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
void fetchTPDB();


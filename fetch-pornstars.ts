import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function fetchPornstars() {
  const query = `SELECT ?itemLabel WHERE { ?item wdt:P106 wd:Q488111. SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  console.log("Fetching pornstars from Wikidata...");
  try {
    const r = await axios.get('https://query.wikidata.org/sparql?query=' + encodeURIComponent(query) + '&format=json', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Node.js)' },
      timeout: 10000
    });
    const starsInfo = r.data.results.bindings;
    const starsArray = starsInfo.map((b: any) => b.itemLabel.value)
      .filter((name: string) => name.length >= 4 && !name.includes('http'));
      
    // Deduplicate
    const uniqueStars = [...new Set(starsArray)];
    
    fs.writeFileSync(path.join(process.cwd(), 'pornstars.json'), JSON.stringify(uniqueStars, null, 2));
    console.log(`Saved ${uniqueStars.length} pornstars to pornstars.json`);
  } catch (error) {
    console.error("Failed to fetch pornstars from Wikidata:", error.message);
  }
}

fetchPornstars();

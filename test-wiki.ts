import axios from 'axios';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function testWikidata() {
  const query = `SELECT ?itemLabel WHERE { ?item wdt:P106 wd:Q488111. SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  const r = await axios.get('https://query.wikidata.org/sparql?query=' + encodeURIComponent(query) + '&format=json', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Node.js)' }
  });
  const starsInfo = r.data.results.bindings;
  const starsArray = starsInfo.map((b: any) => b.itemLabel.value);
  
  const title = "JulesJordan 24 12 08 Connie Perignon And Payton Preslee Double D Bubble Butt Babes Double Up On Lexington Steeles BBC XXX 1080p MP4-P2P [XC]";
  
  const found = starsArray.filter((name: string) => {
     if (name.length < 4 || name.includes('http')) return false;
     try {
       const regex = new RegExp('\\b' + escapeRegExp(name) + '\\b', 'i');
       return regex.test(title);
     } catch (e) {
       return false;
     }
  });
  
  // also check Lexington Steeles (with 's')
  // but let's see if the regex matches without it first.
  console.log("Found:", found);
}

testWikidata();

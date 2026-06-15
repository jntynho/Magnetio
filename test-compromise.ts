import nlp from 'compromise';
const titles = [
  "SexMex 26 02 19 Coordinated Desires XXX 1080p",
  "Brazzers 21 05 20 Abella Danger And Johnny Sins In The Kitchen XXX 4K",
  "Reality Kings 19 01 15 Mia Khalifa Big Tit Surprise 1080p"
];
for (const t of titles) {
  const partsRegex = /^([a-zA-Z0-9\s\-]+?)\s+(\d{2}\s\d{2}\s\d{2})\s+([\s\S]+?)(?:\s+XXX|\s+\d{3,4}p|\s+4K|\s+8K)/i;
  const match = t.match(partsRegex);
  if (match) {
     const text = match[3];
     const people = nlp(text).people().out('array');
     console.log('Text:', text);
     console.log('People:', people);
  }
}

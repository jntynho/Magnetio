import fs from 'fs';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const stars = JSON.parse(fs.readFileSync('./pornstars.json', 'utf8'));

// precompile regexes to save time
const compiledRegexes = stars.map((name: string) => ({
  name,
  // allow optional 's' or 'z' at the end just in case.
  regex: new RegExp('\\b' + escapeRegExp(name) + 's?\\b', 'i')
}));


export function extractNamesWithDB(title: string) {
  const found: string[] = [];
  for (const star of compiledRegexes) {
    if (star.regex.test(title)) {
      found.push(star.name);
    }
  }
  
  // Sort by length descending, so "Angela White" comes before "Angela"
  found.sort((a, b) => b.length - a.length);
  
  // Remove overlapping subnames (e.g., if "Riley Reid" is found, don't keep "Riley")
  const filtered: string[] = [];
  for (let i = 0; i < found.length; i++) {
    let isSubname = false;
    for (let j = 0; j < filtered.length; j++) {
      if (filtered[j].includes(found[i])) {
        isSubname = true;
        break;
      }
    }
    if (!isSubname) {
      filtered.push(found[i]);
    }
  }
  
  return filtered;
}

const start = Date.now();
const t1 = "JulesJordan 24 12 08 Connie Perignon And Payton Preslee Double D Bubble Butt Babes Double Up On Lexington Steeles BBC XXX 1080p MP4-P2P [XC]";
console.log(extractNamesWithDB(t1));
const t2 = "Cubbi Thompson Coordinated Desires";
console.log(extractNamesWithDB(t2));
console.log(extractNamesWithDB("Angela White Two For Her Pleasure XXX 1080p MP4"));
console.log(extractNamesWithDB("Anai Loves Daniela Andrea And Devil Khloe XXX 2160p MP4"));
console.log(extractNamesWithDB("Mia Khalifa Big Tit Surprise"));
console.log(`Took ${Date.now() - start}ms`);

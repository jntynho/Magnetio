function parsePornNames(actorsStr: string) {
  const stopWords = new Set([
      "gangbang", "welcome", "anal", "teen", "teens", "milf", "mom", "creampie", "threesome", 
      "orgy", "facial", "squirt", "massage", "sex", "porn", "xxx", "vr", "big", "tits", 
      "ass", "dick", "step", "sister", "brother", "mother", "father", "pussy", "fuck", 
      "hardcore", "lesbian", "bff", "cum", "cumshot", "swallow", "deepthroat", "blowjob",
      "dp", "double", "penetration", "interracial", "bbc", "pov", "stepmom", "stepdad",
      "stepbrother", "stepsister", "cuckold", "wife", "husband", "amateur", "mature",
      "vintage", "hd", "1080p", "4k", "8k", "60fps", "vr180", "vr360", "bkk", "sc",
      "onlyfans", "patreon", "fansly", "leaked", "leak", "compilation", "collection",
      "scene", "episode", "part", "vol", "volume", "update", "pack", "in", "the", "on", "a",
      "with", "my", "is", "for", "to", "coordinated", "desire", "desires", "club", "party",
      "house", "bts", "behind", "scenes", "seduction", "seducing", "seduces", "share", "sharing",
      "swallows", "gives", "takes", "gets", "bang", "bangs", "riding", "rides", "and", "und",
      "loves", "fucks", "sucks", "two", "three", "four", "one", "her", "his", "their", "pleasure",
      "first", "time", "bareback", "raw", "new", "exclusive", "interview", "casting", "girl",
      "boy", "guy", "student", "teacher", "doctor", "nurse", "maid", "pool", "boy", "poolboy",
      "about", "that", "those", "these", "this", "it"
  ]);

  const words = actorsStr.split(/\s+/);
  const nameChunks: string[] = [];
  let currentChunk: string[] = [];

  for (const w of words) {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (stopWords.has(lower) || lower === 'and' || lower === '') {
      if (currentChunk.length > 0) {
        nameChunks.push(currentChunk.join(" "));
        currentChunk = [];
      }
    } else {
      currentChunk.push(w);
    }
  }
  if (currentChunk.length > 0) {
    nameChunks.push(currentChunk.join(" "));
  }

  // Now nameChunks might be like [ 'Anai', 'Daniela Andrea', 'Devil Khloe' ] or ['Angela White']
  // Sometimes a chunk might be 4 words like "Ana Foxxx Lisa Ann", which should be 2 actors.
  const extractedActors: string[] = [];
  for (const chunk of nameChunks) {
    const pieces = chunk.split(/(?:,)/i).map(s => s.trim()).filter(Boolean); // split by comma if any
    for (const p of pieces) {
      const pw = p.split(/\s+/);
      if (pw.length > 4) {
         // too long, probably not a name, maybe a title phrase we missed with stopwords.
         // Let's just take the first 2 words as a safety fallback.
         extractedActors.push(pw.slice(0, 2).join(' '));
      } else if (pw.length === 4) {
         // Likely 2 actors (2 words each) without 'and' separating them
         extractedActors.push(pw.slice(0, 2).join(' '));
         extractedActors.push(pw.slice(2, 4).join(' '));
      } else if (pw.length > 0) {
         extractedActors.push(p);
      }
    }
  }

  return extractedActors;
}

console.log("TESTING");
console.log(parsePornNames("Angela White Two For Her Pleasure"));
console.log(parsePornNames("Anai Loves Daniela Andrea And Devil Khloe"));
console.log(parsePornNames("Kari Cachonda And Loree Sexlove Gangbang Welcome"));
console.log(parsePornNames("Angela White & Riley Reid Double Team"));
console.log(parsePornNames("Cubbi Thompson Coordinated Desires"));

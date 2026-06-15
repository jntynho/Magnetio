const cheerio = require('cheerio');
const fs = require('fs');

async function run() {
  const url = 'https://www.naughtyamerica.com/pornstar/payton-preslee';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      console.log(`Failed to fetch: ${res.status} ${res.statusText}`);
      return;
    }

    const html = await res.text();
    fs.writeFileSync('naughty.html', html);
    console.log('Saved to naughty.html');

    const $ = cheerio.load(html);

    // Let's print out some elements to see what is there
    // A links, img tags, anything that suggests videos
    const videoLinks = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('/scene/') || href.includes('/show/') || href.includes('/video/'))) {
        videoLinks.push({
          href,
          text: $(el).text().trim(),
          title: $(el).attr('title')
        });
      }
    });

    console.log(`Found ${videoLinks.length} video-like links:`);
    console.log(videoLinks.slice(0, 30));

  } catch (err) {
    console.error(err);
  }
}

run();

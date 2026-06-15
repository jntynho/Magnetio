const fs = require('fs');
const cheerio = require('cheerio');

async function testCookies() {
  const url = 'https://www.naughtyamerica.com/pornstar/payton-preslee';
  
  // Try passing different adult confirmation cookies!
  const cookiesList = [
    'is_sfw=0',
    'view_adult=1',
    'age_consent=1',
    'NA_accept=1',
    'compliancy_accepted=1',
    'agree=1',
    'view_adult_content=1',
    'naughty_session=3d6SvRl33u6cdkASeH6yy9Uf8EeSpB7714yK0HhH'
  ];

  const cookieStr = cookiesList.join('; ');
  console.log(`Fetching with Cookie: "${cookieStr}"`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookieStr,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.naughtyamerica.com/'
      }
    });

    console.log('Status:', res.status);
    const html = await res.text();
    fs.writeFileSync('naughty_with_cookies.html', html);
    console.log('Saved to naughty_with_cookies.html. Length:', html.length);

    const $ = cheerio.load(html);
    console.log('Title:', $('title').text());

    // Check if there are scene cards or actor elements or scene links
    // Often scene links on NA look like: https://www.naughtyamerica.com/scene/012345/some-title
    // or just `/scene/...` or have class "scene-card" or similar
    const scenes = [];
    $('a[href*="/scene/"]').each((i, el) => {
      scenes.push({
        href: $(el).attr('href'),
        text: $(el).text().trim(),
        title: $(el).attr('title')
      });
    });

    console.log(`Found ${scenes.length} scene links!`);
    if (scenes.length > 0) {
      console.log('First 10 scene links:', scenes.slice(0, 10));
    } else {
      // Let's print out all a href links that don't go to join or are external
      const otherLinks = [];
      $('a').each((i, el) => {
        const h = $(el).attr('href') || '';
        if (!h.includes('join') && !h.startsWith('#') && h) {
          otherLinks.push({ href: h, text: $(el).text().trim() });
        }
      });
      console.log('Other non-join links:', otherLinks.slice(0, 20));
    }

  } catch (e) {
    console.error(e);
  }
}

testCookies();

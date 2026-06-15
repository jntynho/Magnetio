const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
  const html = fs.readFileSync('naughty.html', 'utf8');
  const $ = cheerio.load(html);
  console.log("Title of page:", $('title').text());
  console.log("HTML length:", html.length);
  
  // print all anchor tags with context
  const links = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      links.push({
        href,
        text: $(el).text().trim().substring(0, 50)
      });
    }
  });
  console.log(`Found ${links.length} total links`);
  console.log("Sample links:", links.slice(0, 20));

  // Let's print out text that might indicate scenes
  const bodyText = $('body').text();
  console.log("Body text sample (first 1000 chars):", bodyText.replace(/\s+/g, ' ').substring(0, 1000));
}

test();

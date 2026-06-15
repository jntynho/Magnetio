import fs from 'fs';
async function fetchXXXClub() {
  try {
    const res = await fetch("https://xxxclub.to/torrents/details/~2060608047528141718", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    fs.writeFileSync('xxxclub.html', html);
    console.log("Written to xxxclub.html");
  } catch (e) {
    console.error(e);
  }
}
fetchXXXClub();

const fs = require('fs');

async function testCookies() {
  const url = 'https://www.naughtyamerica.com/pornstar/payton-preslee';
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'manual'
    });

    console.log('Status:', res.status);
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const setCookie = res.headers.get('set-cookie');
    console.log('Set-Cookie:', setCookie);

  } catch (e) {
    console.error(e);
  }
}

testCookies();

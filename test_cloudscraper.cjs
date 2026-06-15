const cloudscraper = require('cloudscraper');
cloudscraper.get('https://javtrailers.com/api/video/mida00402').then(console.log).catch(console.error);

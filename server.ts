import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Dedicated endpoint for requestdl to avoid browser redirect/CORS issues
  app.get('/api/torbox-dl', async (req, res) => {
    const { token, torrent_id, file_id } = req.query;
    try {
      const response = await fetch(`https://api.torbox.app/v1/api/torrents/requestdl?token=${token}&torrent_id=${torrent_id}&file_id=${file_id}&zip_link=false`, {
        headers: { 'Authorization': `Bearer ${token}` },
        redirect: 'manual'
      });
      
      // If Torbox returns a direct redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          return res.json({ success: true, data: location });
        }
      }
      
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch (e) {
        return res.status(500).json({ success: false, detail: "Invalid response from Torbox", raw: text });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, detail: error.message });
    }
  });

  // Proxy to Torbox API to bypass CORS
  app.use('/api/torbox', createProxyMiddleware({
    target: 'https://api.torbox.app/v1/api',
    changeOrigin: true,
    pathRewrite: {
      '^/api/torbox': '', 
    }
  }));

  // Proxy to Real Debrid API to bypass CORS
  app.use('/api/rd', createProxyMiddleware({
    target: 'https://api.real-debrid.com/rest/1.0',
    changeOrigin: true,
    pathRewrite: {
      '^/api/rd': '', 
    }
  }));

  // Robust Pixeldrain Streaming Proxy
  app.get('/api/pixeldrain/:id', async (req, res) => {
    const { id } = req.params;
    const range = req.headers.range;

    try {
      const targetUrl = `https://pixeldrain.com/api/file/${id}`;
      
      const axiosResponse = await axios({
        method: 'get',
        url: targetUrl,
        responseType: 'stream',
        headers: {
          'Range': range,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://pixeldrain.com/'
        }
      });

      // Forward relevant headers
      const headersToForward = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'content-disposition'
      ];

      headersToForward.forEach(header => {
        const value = axiosResponse.headers[header];
        if (value) {
          res.setHeader(header, value);
        }
      });

      // If it's a partial content (range request), set 206 status
      if (axiosResponse.status === 206) {
        res.status(206);
      }

      // Ensure CORS
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Pipe the stream
      axiosResponse.data.pipe(res);

      res.on('close', () => {
        axiosResponse.data.destroy();
      });

    } catch (error: any) {
      console.error('Pixeldrain Proxy Error:', error.message);
      if (error.response) {
        res.status(error.response.status).send(error.response.statusText);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  });

  app.post('/api/extract/javtrailers', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });
      
      let title = '';
      let date = '';
      let actors: string[] = [];
      let cover = '';
      let tag = '';
      
      const idMatch = url.match(/\/video\/([a-z0-9]+)/i);
      const videoId = idMatch ? idMatch[1].toLowerCase() : '';
      
      // Attempt proxy fetch
      try {
        // @ts-ignore
        const html = await cloudscraper.get(url);
        
        if (html && !html.includes('Just a moment...')) {
          // Date Match
          const dateMatch = html.match(/<meta property="video:release_date" content="([^"]+)"/i);
          if (dateMatch && dateMatch[1]) {
             const d = new Date(dateMatch[1]);
             const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
             date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
          }
          
          // Cover Match
          const coverMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
          if (coverMatch && coverMatch[1]) {
             cover = coverMatch[1];
          }
          
          // Cast Match
          const castAreaMatch = html.match(/Cast\(s\):<\/span>.*?<\/p>/i);
          if (castAreaMatch) {
             const actorRegex = /<a[^>]*>([^<]+)<\/a>/g;
             let m;
             while((m = actorRegex.exec(castAreaMatch[0])) !== null) {
                let rawActors = m[1].trim();
                let englishName = rawActors.replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g, '').trim();
                if (englishName) actors.push(englishName);
             }
          }
          
          // Title Match
          const titleMatch = html.match(/<meta name="twitter:title" content="([^"]+)"/i) || html.match(/<meta property="twitter:title" content="([^"]+)"/i);
          if (titleMatch && titleMatch[1]) {
             title = titleMatch[1].trim();
             tag = title;
          }
        }
      } catch (e: any) {
        console.error("Cloudscraper failed, falling back to ID extraction", e.message);
      }
      
      // Fallback
      if (!title && videoId) {
         const match = videoId.match(/^([a-z]+)[^0-9a-z]*0*([0-9]+)$/i);
         if (match) {
           let num = match[2];
           while(num.length < 3 && videoId.match(/^([a-z]+)0+([0-9]+)$/i)) {
             num = '0' + num;
           }
           title = `${match[1].toUpperCase()}-${num.padStart(3, '0')}`;
           tag = title;
         } else {
           title = videoId.toUpperCase();
           tag = title;
         }
      }
      
      if (!cover && videoId) {
         cover = `https://pics.dmm.co.jp/digital/video/${videoId}/${videoId}pl.jpg`;
      }
      
      if (!title && !cover) {
         return res.status(200).json({ error: 'Failed to extract data: Anti-bot protection blocked the site.' });
      }
      
      return res.json({ tag, date, actors, cover });
    } catch (error: any) {
      console.error('JavTrailers Proxy Error:', error.message);
      return res.status(200).json({ error: 'Internal Server Error: ' + error.message });
    }
  });

  app.post('/api/extract/xxxclub', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });
      
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!pageRes.ok) return res.status(pageRes.status).json({ error: 'Failed to access url' });
      const html = await pageRes.text();
      
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      let title = titleMatch ? titleMatch[1].replace(/ - XXXCLUB(.*?)$/i, '').trim() : '';
      if (!title) {
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (h1Match) title = h1Match[1].trim();
      }
      
      const magnetMatch = html.match(/href="(magnet:\?xt=urn:btih:[^"]+)"/);
      const magnet = magnetMatch ? magnetMatch[1] : '';

      // Helper function to smart-standardize date format to 'YY MM DD'
      const standardizeDateString = (dateStr: string): string => {
        const parts = dateStr.trim().split(/\s+/);
        if (parts.length !== 3) return dateStr;
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const p3 = parseInt(parts[2], 10);
        if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return dateStr;

        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(p1)} ${pad(p2)} ${pad(p3)}`;
      };

      // Fallback local parsing
      let parsedData: { tag: string; date: string; actors: string[]; quality: string } | null = null;
      const partsRegex = /^([a-zA-Z0-9\s\-]+?)\s+(\d{2}\s\d{2}\s\d{2})\s+([\s\S]+?)(?:\s+XXX|\s+\d{3,4}p|\s+4K|\s+8K)/i;
      const match = title.match(partsRegex);
      if (match) {
        let tag = match[1].trim();
        let dateVal = match[2].trim();
        dateVal = standardizeDateString(dateVal);
        const qualityRegex = /(\d{3,4}p|4K|8K|2160p)/i;
        const qualityMatch = title.match(qualityRegex);
        const quality = qualityMatch ? qualityMatch[1].trim() : '';

        parsedData = { tag, date: dateVal, actors: [], quality };
      }

      res.json({ title, magnet, parsed: parsedData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Extractor proxy for hstream.moe
  app.post('/api/hstream/extract', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }

      // 1. Fetch the page to get e_id and CSRF token and cookies
      const pageObj = await fetch(url);
      const textHtml = await pageObj.text();
      
      const eidMatch = textHtml.match(/<input id="e_id" type="hidden" value="(\d+)"/);
      const csrfMatch = textHtml.match(/data-csrf="([^"]+)"/);
      
      if (!eidMatch || !csrfMatch) {
        return res.status(404).json({ error: 'Could not extract required tokens from page' });
      }
      
      const episodeId = eidMatch[1];
      const csrf = csrfMatch[1];
      
      const setCookie = pageObj.headers.getSetCookie ? pageObj.headers.getSetCookie() : [pageObj.headers.get('set-cookie')];
      const cookiesArray = setCookie.filter(Boolean).map((c: string) => c.split(';')[0]);
      const cookies = cookiesArray.join('; ');

      // 2. Call the player API
      const apiRes = await fetch("https://hstream.moe/player/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": url,
          "X-CSRF-TOKEN": csrf,
          "Cookie": cookies
        },
        body: JSON.stringify({ episode_id: episodeId })
      });
      
      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ error: 'Failed to access player API' });
      }
      
      const data = await apiRes.json();
      
      // We get { stream_url, stream_domains, extra_subtitles }
      if (!data.stream_url || !data.stream_domains || data.stream_domains.length === 0) {
        return res.status(404).json({ error: 'Invalid data returned from player API' });
      }
      
      const domain = data.stream_domains[0];
      const qualities: any[] = [];
      const urlBase = domain.startsWith('http') ? `${domain}/${data.stream_url}` : `https://${domain}/${data.stream_url}`;
      
      let has2160 = false;
      try {
        const headRes2160 = await fetch(`${urlBase}/2160/manifest.mpd`, { 
          method: 'HEAD', 
          signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(3000) : undefined 
        });
        has2160 = headRes2160.ok;
      } catch (e) {
         has2160 = false;
      }
      
      let has1080 = true;
      try {
        const headRes = await fetch(`${urlBase}/1080/manifest.mpd`, { 
          method: 'HEAD', 
          signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(3000) : undefined 
        });
        has1080 = headRes.ok;
      } catch (e) {
         has1080 = false;
      }
      
      if (has2160) {
        qualities.push({ html: '2160p', url: `${urlBase}/2160/manifest.mpd` });
      }
      
      if (has1080) {
        qualities.push({ html: '1080p', url: `${urlBase}/1080/manifest.mpd`, default: true });
        qualities.push({ html: '720p', url: `${urlBase}/720/manifest.mpd` });
      } else {
        qualities.push({ html: '720p', url: `${urlBase}/720/manifest.mpd`, default: true });
      }

      const defaultUrl = has1080 ? `${urlBase}/1080/manifest.mpd` : `${urlBase}/720/manifest.mpd`;

      // Add Subtitles
      const subtitles = [];
      subtitles.push({
          html: 'English',
          url: `/api/hstream/subtitle?url=${encodeURIComponent(`https://hstream.moe/player/subtitles/${episodeId}/en`)}`, 
          default: true
      });
      if (data.extra_subtitles) {
          // data.extra_subtitles is { "es": "Spanish", "ar": "Arabic" }
          for (const [code, lang] of Object.entries(data.extra_subtitles)) {
              subtitles.push({
                 html: `${lang} (Auto)`,
                 url: `/api/hstream/subtitle?url=${encodeURIComponent(`https://hstream.moe/player/subtitles/${episodeId}/${code}`)}`,
              });
          }
      }
      
      res.json({ qualities, subtitles, url: defaultUrl });
    } catch (error: any) {
      console.error('Error extracting hstream url:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/hstream/subtitle', async (req, res) => {
      try {
          const { url } = req.query;
          if (!url || typeof url !== 'string') {
              return res.status(400).send('Missing url parameter');
          }
          const subRes = await fetch(url, {
              headers: {
                  "Referer": "https://hstream.moe/",
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
              }
          });
          if (!subRes.ok) {
              return res.status(subRes.status).send('Failed to fetch subtitle from origin');
          }
          const text = await subRes.text();
          res.setHeader('Content-Type', 'text/vtt');
          res.send(text);
      } catch (e: any) {
          res.status(500).send(e.message);
      }
  });

  app.post('/api/scrape/sexmex', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping SexMex Model page:', url);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      const html = await response.text();
      if (!html || html.length < 500) {
        return res.status(response.status || 500).json({ error: `Failed to fetch SexMex page content (HTML is too short or empty)` });
      }
      const $ = cheerio.load(html);
      
      // Determine the main model's name from URL as a fallback, e.g. EstelaOsorio -> Estela Osorio
      let modelUrlName = '';
      const urlMatch = url.match(/\/models\/([^/]+)\.html/i);
      if (urlMatch) {
        let rawName = urlMatch[1];
        // Split camelcase / pascalcase to words
        modelUrlName = rawName.replace(/([A-Z])/g, ' $1').trim();
      }

      const scenes: any[] = [];
      $('.thumb').each((i, el) => {
        const $el = $(el);

        // Strict scene update link detection to avoid picking up profile / actor cards
        let hasUpdateLink = false;
        $el.find('a').each((_i, aEl) => {
          const href = $(aEl).attr('href') || '';
          if (href.includes('/updates/') || href.includes('/tour/updates/')) {
            hasUpdateLink = true;
          }
        });

        if (!hasUpdateLink) {
          return;
        }

        let title = $el.find('h5.scene-title a').text().trim();
        if (!title) {
          title = $el.find('.videothumbnail a').attr('title')?.trim() || '';
        }

        if (!title) {
          return;
        }

        let coverUrl = $el.find('.videothumbnail img').attr('src')?.trim();
        if (!coverUrl) {
          coverUrl = $el.find('img').attr('src')?.trim() || '';
        }

        if (coverUrl && coverUrl.startsWith('//')) {
          coverUrl = 'https:' + coverUrl;
        }

        // Extract dates
        let dateStr = $el.find('.scene-date').text().trim();
        let releaseDate: number | undefined;
        if (dateStr) {
          // Parse format MM/DD/YYYY, e.g. 05/25/2026
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const mm = parseInt(parts[0], 10);
            const dd = parseInt(parts[1], 10);
            const yyyy = parseInt(parts[2], 10);
            const parsed = new Date(yyyy, mm - 1, dd).getTime();
            if (!isNaN(parsed)) {
              releaseDate = parsed;
            }
          }
        }

        // Smart Title and Cast parsing
        let cleanTitle = title;
        const actors: string[] = [];

        // 1. Precise Actor Extraction via HTML Model Links
        $el.find('a').each((_idx, aEl) => {
          const href = $(aEl).attr('href') || '';
          if (href.includes('/models/')) {
            const name = $(aEl).text().trim();
            if (name && !actors.includes(name)) {
              actors.push(name);
            }
          }
        });

        // Decode basic HTML entities that might appear in title
        title = title
          .replace(/&rsquo;/g, "'")
          .replace(/&lsquo;/g, "'")
          .replace(/&rdquo;/g, '"')
          .replace(/&ldquo;/g, '"')
          .replace(/&amp;/g, '&');

        if (title.includes(' . ')) {
          const parts = title.split(' . ');
          cleanTitle = parts[0].trim();
          const actorsStr = parts[1].trim();
          if (actors.length === 0) {
            const individualActors = actorsStr.split(/, | & /);
            individualActors.forEach(act => {
              const trimmed = act.trim();
              if (trimmed && !actors.includes(trimmed)) {
                actors.push(trimmed);
              }
            });
          }
        } else if (title.includes(' .')) {
          const parts = title.split(' .');
          cleanTitle = parts[0].trim();
          const actorsStr = parts[1].trim();
          if (actors.length === 0) {
            const individualActors = actorsStr.split(/, | & /);
            individualActors.forEach(act => {
              const trimmed = act.trim();
              if (trimmed && !actors.includes(trimmed)) {
                actors.push(trimmed);
              }
            });
          }
        } else if (title.includes('.')) {
          const parts = title.split('.');
          cleanTitle = parts[0].trim();
          const actorsStr = parts.slice(1).join('.').trim();
          if (actors.length === 0 && actorsStr && actorsStr.length < 50) {
            const individualActors = actorsStr.split(/, | & /);
            individualActors.forEach(act => {
              const trimmed = act.trim();
              if (trimmed && !actors.includes(trimmed)) {
                actors.push(trimmed);
              }
            });
          }
        }

        // Fallback actors
        if (actors.length === 0 && modelUrlName) {
          actors.push(modelUrlName);
        }

        if (cleanTitle || coverUrl) {
          // Normalize and clean actor names (remove accents/diacritics like Márquez -> Marquez)
          const normalizedActors = actors.map(name =>
            name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
          );

          scenes.push({
            title: cleanTitle,
            actors: normalizedActors,
            coverUrl,
            date: dateStr,
            releaseDate: releaseDate,
            tag: 'SexMex'
          });
        }
      });

      console.log(`Extracted ${scenes.length} scenes from ${url}`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('SexMex Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });



  app.post('/api/scrape/mylf', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping MYLF Model page:', url);
      const response = await axios.get(url, {
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const html = response.data;
      if (!html || typeof html !== 'string') {
        return res.status(500).json({ error: 'Failed to fetch MYLF page content' });
      }

      let initialStateRaw = '';
      if (html.includes('window.__INITIAL_STATE__ = {')) {
         const startMatch = html.indexOf('window.__INITIAL_STATE__ = {');
         if (startMatch !== -1) {
             const start = startMatch + 'window.__INITIAL_STATE__ = '.length;
             const endText = html.indexOf('window.__INITIAL_STATE__.options', start);
             if (endText !== -1) {
               initialStateRaw = html.substring(start, html.lastIndexOf('}', endText) + 1);
             } else {
               initialStateRaw = html.substring(start, html.lastIndexOf('}') + 1);
             }
         }
      }

      if (!initialStateRaw) {
        return res.status(500).json({ error: 'Failed to find INITIAL_STATE in MYLF page' });
      }

      const data = JSON.parse(initialStateRaw);
      const modelsContent = data?.content?.modelsContent;
      if (!modelsContent || typeof modelsContent !== 'object') {
         return res.status(500).json({ error: 'Failed to find modelsContent in MYLF state' });
      }

      const modelKeys = Object.keys(modelsContent);
      if (modelKeys.length === 0) {
         return res.status(404).json({ error: 'No models found on page' });
      }

      const alias = modelKeys[0];
      const modelData = modelsContent[alias];
      const modelName = modelData.name || modelData.title || alias;
      const movies = modelData.movies || [];

      const scenes: any[] = [];
      for (const m of movies) {
         let coverUrl = m.img || m.cover;
         let releaseDate: number | undefined;
         if (m.publishedDate) {
            const parsed = new Date(m.publishedDate).getTime();
            if (!isNaN(parsed)) releaseDate = parsed;
         }
         
         const actors = [modelName];

         scenes.push({
            title: m.title,
            actors,
            coverUrl,
            date: m.publishedDate ? m.publishedDate.split('T')[0] : '',
            releaseDate,
            tag: 'Mylf'
         });
      }

      console.log(`Extracted ${scenes.length} scenes from ${url}`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('MYLF Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });

  app.post('/api/scrape/mypervyfamily', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping MyPervyFamily Model page:', url);
      
      // Extract model name slug from URL, e.g. /models/490181/nia-bleu -> nia-bleu
      const match = url.match(/\/models?\/(?:[0-9]+\/)?([^/]+)/i);
      if (!match) {
        return res.status(400).json({ error: 'Invalid MyPervyFamily model URL format.' });
      }

      const slug = match[1];
      const rawModelName = slug.replace(/-/g, ' ').trim();
      const modelName = rawModelName
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      console.log(`Fetching HTML for MyPervyFamily model: "${url}"`);

      // Just fetch the exact URL provided by the user.
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        }
      });

      if (!response.ok) {
         return res.status(response.status).json({ error: `Failed to retrieve MyPervyFamily page: ${response.statusText}` });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Fetch sitemap to get dates for scenes
      let sitemapDates = new Map<string, { date: string; releaseDate: number }>();
      try {
        const sitemapUrl = 'https://www.mypervyfamily.com/scenes_sitemap1.xml';
        const sitemapResponse = await fetch(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (sitemapResponse.ok) {
          const sitemapXml = await sitemapResponse.text();
          const $sitemap = cheerio.load(sitemapXml, { xmlMode: true });
          $sitemap('url').each((_, el) => {
            const loc = $sitemap(el).find('loc').text().trim();
            const lastmod = $sitemap(el).find('lastmod').text().trim();
            if (loc && lastmod) {
              const parsed = new Date(lastmod).getTime();
              sitemapDates.set(loc, {
                date: lastmod.split('T')[0],
                releaseDate: isNaN(parsed) ? Date.now() : parsed
              });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching sitemap for dates', err);
      }

      const scenesMap = new Map();

      $('a[href*="/video/"]').each((i, el) => {
        const href = $(el).attr('href');
        let title = $(el).attr('title') || $(el).text().trim();
        if (!title && href) {
           title = href.split('/').pop()?.replace(/-/g, ' ') || '';
        }
        
        let img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || $(el).find('img').attr('data-lazy');
        
        // Also check if we are dealing with a <picture><source srcset="..."> structure
        if (!img) {
           const srcSet = $(el).find('source').attr('srcset');
           if (srcSet) {
             img = srcSet.split(' ')[0]; // take the first if it's a comma separated list
           }
        }
        
        if (!href) return;
        const fullLink = href.startsWith('http') ? href : `https://www.mypervyfamily.com${href}`;
        
        let dateInfo = sitemapDates.get(fullLink);
        
        if (!dateInfo || !dateInfo.date) {
            let matchedDate = '';
            let parent = $(el);
            for (let k = 0; k < 6; k++) {
              parent = parent.parent();
              const text = parent.text().replace(/\s+/g, ' ');
              const match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}/);
              if (match) {
                matchedDate = match[0];
                break;
              }
            }
            if (matchedDate) {
              const d = new Date(matchedDate);
              dateInfo = {
                date: isNaN(d.getTime()) ? matchedDate : d.toISOString().split('T')[0],
                releaseDate: isNaN(d.getTime()) ? Date.now() : d.getTime()
              };
            } else {
              dateInfo = { date: '', releaseDate: Date.now() };
            }
        }

        if (scenesMap.has(fullLink)) {
           const existing = scenesMap.get(fullLink);
           if (!existing.coverUrl && img) existing.coverUrl = img;
           if ((!existing.title || existing.title === existing.link.split('/').pop()?.replace(/-/g, ' ')) && title) existing.title = title;
           if (!existing.date && dateInfo.date) {
               existing.date = dateInfo.date;
               existing.releaseDate = dateInfo.releaseDate;
           }
        } else {
           scenesMap.set(fullLink, {
             title: title || 'Unknown Title',
             actors: [modelName], // Assume the current model is one of the actors
             coverUrl: img || '',
             date: dateInfo.date,
             releaseDate: dateInfo.releaseDate,
             tag: 'MyPervyFamily',
             link: fullLink // Optional, but useful for debugging
           });
        }
      });
      
      const scenes = Array.from(scenesMap.values());
      
      // Clean up titles (optional)
      scenes.forEach(scene => {
          if (scene.title && scene.title.includes(' - ')) {
              const parts = scene.title.split(' - ');
              if (parts.length > 1) {
                  scene.title = parts.slice(1).join(' - ').trim();
              }
          }
      });

      console.log(`Extracted ${scenes.length} MyPervyFamily scenes for ${modelName}`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('MyPervyFamily Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });

  app.post('/api/scrape/bangbros', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping BangBros Model page:', url);
      
      const match = url.match(/\/models?\/(?:[0-9]+\/)?([^/]+)/i);
      if (!match) {
        return res.status(400).json({ error: 'Invalid BangBros model URL format. Expected containing /model/ or /models/ and model slug' });
      }

      const slug = match[1].replace(/\/+$/, '');
      const rawModelName = slug.replace(/-/g, ' ').trim();
      const modelName = rawModelName
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      console.log(`Fetching HTML for BangBros model: "${url}"`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
         return res.status(response.status).json({ error: `Failed to retrieve BangBros page: ${response.statusText}` });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const scenesMap = new Map();

      $('a[href*="/video/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        const fullLink = href.startsWith('http') ? href : `https://bangbros.com${href}`;

        let title = $(el).attr('title') || $(el).text().trim();
        if (!title && href) {
           title = href.split('/').pop()?.replace(/-/g, ' ') || '';
        }

        let img = '';
        let imgEl = $(el).find('img').first();
        if (imgEl.length === 0) {
          let parent = $(el).parent();
          for (let k = 0; k < 3; k++) {
            const foundImg = parent.find('img').first();
            if (foundImg.length > 0) {
              imgEl = foundImg;
              break;
            }
            parent = parent.parent();
          }
        }
        
        if (imgEl && imgEl.length > 0) {
          img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy') || '';
        }

        let matchedDate = '';
        let parent = $(el);
        for (let k = 0; k < 6; k++) {
          parent = parent.parent();
          const text = parent.text().replace(/\s+/g, ' ');
          const match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}/);
          if (match) {
            matchedDate = match[0];
            break;
          }
        }

        let dateStr = '';
        let releaseDate = Date.now();
        if (matchedDate) {
          const d = new Date(matchedDate);
          dateStr = isNaN(d.getTime()) ? matchedDate : d.toISOString().split('T')[0];
          releaseDate = isNaN(d.getTime()) ? Date.now() : d.getTime();
        }

        let actors: string[] = [];
        let altMatchedActors = false;

        if (imgEl && imgEl.length > 0) {
          const alt = imgEl.attr('alt') || '';
          const matchAlt = alt.match(/Porn (?:Photo|Video|Scene) with (.*?) naked/i);
          if (matchAlt) {
            const parsed = matchAlt[1].split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            if (parsed.length > 0) {
              actors = parsed;
              altMatchedActors = true;
            }
          }
        }

        if (!altMatchedActors) {
          let parentForLinks = $(el);
          const foundActors: string[] = [];
          for (let k = 0; k < 4; k++) {
            parentForLinks = parentForLinks.parent();
            parentForLinks.find('a[href*="/model/"]').each((_, modelEl) => {
              const name = $(modelEl).text().trim();
              if (name && !foundActors.includes(name) && name.toLowerCase() !== 'view all' && name.toLowerCase() !== modelName.toLowerCase()) {
                foundActors.push(name);
              }
            });
            if (foundActors.length > 0) break;
          }
          actors = [modelName, ...foundActors];
        }

        if (scenesMap.has(fullLink)) {
           const existing = scenesMap.get(fullLink);
           if (!existing.coverUrl && img) existing.coverUrl = img;
           if ((!existing.title || existing.title === existing.link.split('/').pop()?.replace(/-/g, ' ')) && title) existing.title = title;
           if (!existing.date && dateStr) {
               existing.date = dateStr;
               existing.releaseDate = releaseDate;
           }
        } else {
           scenesMap.set(fullLink, {
             title: title || 'Unknown Title',
             actors: actors,
             coverUrl: img || '',
             date: dateStr,
             releaseDate: releaseDate,
             tag: 'BangBros',
             link: fullLink
           });
        }
      });

      const scenes = Array.from(scenesMap.values());

      console.log(`Extracted ${scenes.length} BangBros scenes for ${modelName}`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('BangBros Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });

  app.post('/api/scrape/naughtyamerica', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping NaughtyAmerica Model page:', url);
      
      const match = url.match(/\/pornstars?\/(?:[0-9]+\/)?([^/]+)/i) || url.match(/\/pornstars?\/([^/]+)/i);
      let modelName = '';
      if (match) {
        const slug = match[1].split('?')[0].replace(/\/+$/, '');
        const rawModelName = slug.replace(/-/g, ' ').trim();
        modelName = rawModelName
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        modelName = 'Unknown Performer';
      }

      console.log(`Fetching HTML for NaughtyAmerica model: "${url}"`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
         return res.status(response.status).json({ error: `Failed to retrieve NaughtyAmerica page: ${response.statusText}` });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const scenes: any[] = [];
      const processedLinks = new Set<string>();

      $('.scene-item').each((i, el) => {
        const card = $(el);

        let link = card.find('a.contain-img').attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.naughtyamerica.com${link}`;
        }

        if (!link || processedLinks.has(link)) return;
        processedLinks.add(link);

        let title = '';
        const parts = link.split('/');
        const lastPart = parts.pop() || '';
        const titlePart = lastPart.replace(/-\d+$/, '').replace(/-/g, ' ');
        if (titlePart) {
          title = titlePart.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
          title = 'Unknown Title';
        }

        let coverUrl = '';
        const mainImg = card.find('img.main-scene-img');
        if (mainImg.length > 0) {
          coverUrl = mainImg.attr('data-srcset') || mainImg.attr('src') || mainImg.attr('data-src') || '';
          if (coverUrl.includes(' ')) {
            coverUrl = coverUrl.trim().split(' ')[0];
          }
        }
        if (!coverUrl) {
          const source = card.find('picture source').first();
          if (source.length > 0) {
            coverUrl = source.attr('data-srcset') || source.attr('srcset') || '';
            if (coverUrl.includes(' ')) {
              coverUrl = coverUrl.trim().split(' ')[0];
            }
          }
        }
        if (coverUrl.startsWith('//')) {
          coverUrl = 'https:' + coverUrl;
        }

        const actorsList: string[] = [];
        card.find('.contain-actors a').each((_, modelEl) => {
          const actorText = $(modelEl).text().trim();
          if (actorText && !actorsList.includes(actorText)) {
            actorsList.push(actorText);
          }
        });
        
        if (modelName !== 'Unknown Performer' && !actorsList.map(a => a.toLowerCase()).includes(modelName.toLowerCase())) {
          actorsList.unshift(modelName);
        }

        let matchedDate = '';
        const dateText = card.find('.entry-date').text().replace(/\s+/g, ' ').trim();
        const dateMatch = dateText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}/);
        if (dateMatch) {
          matchedDate = dateMatch[0];
        }

        let dateStr = '';
        let releaseDate = Date.now();
        if (matchedDate) {
          const d = new Date(matchedDate);
          dateStr = isNaN(d.getTime()) ? matchedDate : d.toISOString().split('T')[0];
          releaseDate = isNaN(d.getTime()) ? Date.now() : d.getTime();
        }

        const siteTitle = card.find('.site-title').text().trim() || 'Naughty America';

        scenes.push({
          title,
          actors: actorsList,
          coverUrl,
          date: dateStr,
          releaseDate,
          tag: siteTitle,
          site: siteTitle,
          link
        });
      });

      console.log(`Extracted ${scenes.length} NaughtyAmerica scenes for ${modelName}`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('NaughtyAmerica Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });

  app.post('/api/scrape/realitykings', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping RealityKings page:', url);
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const html = await pageResponse.text();
      
      const jwtMatch = html.match(/"jwt"\s*:\s*"([^"]+)"/);
      if (!jwtMatch) {
         return res.status(500).json({ error: 'Failed to find authentication token in RealityKings page context.' });
      }
      
      const jwt = jwtMatch[1];
      const modelIdMatch = url.match(/models=(\d+)/i) || url.match(/\/model\/(\d+)/i);
      
      if (!modelIdMatch) {
         return res.status(400).json({ error: 'Could not extract model ID from URL. Expected format: models=12345 or /model/12345/' });
      }
      const modelId = modelIdMatch[1];
      
      // Project1Service is the backend for RealityKings
      let offset = 0;
      const limit = 100;
      let allResults: any[] = [];
      let total = 0;
      
      while (true) {
        const apiUrl = `https://site-api.project1service.com/v2/releases?models=${modelId}&limit=${limit}&offset=${offset}`;
        
        const apiRes = await fetch(apiUrl, {
          headers: {
            'instance': jwt,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        
        if (!apiRes.ok) {
           if (offset === 0) return res.status(apiRes.status).json({ error: `Failed to fetch from RealityKings API: ${apiRes.statusText}` });
           break;
        }
        
        const apiData = await apiRes.json();
        const results = apiData.result || [];
        allResults = allResults.concat(results);
        
        total = apiData.meta?.total || 0;
        
        if (allResults.length >= total || results.length === 0) {
           break;
        }
        offset += limit;
      }
      
      const scenes = allResults.map((scene: any) => {
         const timestamp = new Date(scene.dateReleased).getTime();
         let coverUrl = '';
         
         if (scene.images && scene.images.poster) {
             const keys = Object.keys(scene.images.poster);
             if (keys.length > 0) {
                 const posterData = scene.images.poster[keys[0]];
                 if (posterData.lg) coverUrl = posterData.lg.urls?.webp || posterData.lg.urls?.default || posterData.lg.url;
                 else if (posterData.md) coverUrl = posterData.md.urls?.webp || posterData.md.urls?.default || posterData.md.url;
                 else if (posterData.sm) coverUrl = posterData.sm.urls?.webp || posterData.sm.urls?.default || posterData.sm.url;
             }
         }
         
         const actors = (scene.actors || []).map((a: any) => a.name);
         
         return {
             title: scene.title,
             date: scene.dateReleased ? scene.dateReleased.split('T')[0] : '',
             releaseDate: isNaN(timestamp) ? Date.now() : timestamp,
             coverUrl,
             actors,
             tag: scene.brandMeta?.displayName || 'RealityKings'
         };
      });
      
      console.log(`Extracted ${scenes.length} RealityKings scenes.`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('RealityKings Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });

  app.post('/api/scrape/teamskeet', express.json(), async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'Missing url parameter' });

      console.log('Scraping TeamSkeet page:', url);
      const response = await axios.get(url, {
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      const html = response.data;
      if (!html || typeof html !== 'string' || html.length < 500) {
        return res.status(response.status || 500).json({ error: 'Failed to retrieve TeamSkeet page' });
      }
      
      const $ = cheerio.load(html);
      
      // Attempt to parse model name
      let modelName = '';
      const h1Text = $('h1').first().text().trim();
      if (h1Text) {
        modelName = h1Text.replace(/Scenes/i, '').replace(/Videos/i, '').replace(/Profile/i, '').trim();
      }
      if (!modelName) {
        // Fallback from URL slug
        const urlMatch = url.match(/\/models\/([^/]+)/i);
        if (urlMatch) {
          modelName = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()).trim();
        } else {
          modelName = 'Unknown Performer';
        }
      }

      const scenes: any[] = [];
      const scenesMap = new Map();

      // Method 1: window.__INITIAL_STATE__ (Mylf-style template matching)
      let initialStateRaw = '';
      const stateIndex = html.indexOf('window.__INITIAL_STATE__');
      if (stateIndex !== -1) {
         const start = html.indexOf('{', stateIndex);
         if (start !== -1) {
             const endText = html.indexOf('window.__INITIAL_STATE__.options', start);
             if (endText !== -1) {
               initialStateRaw = html.substring(start, html.lastIndexOf('}', endText) + 1);
             } else {
               const scriptEnd = html.indexOf('</script>', start);
               if (scriptEnd !== -1) {
                 const candidate = html.substring(start, scriptEnd).trim();
                 if (candidate.endsWith(';')) {
                   initialStateRaw = candidate.slice(0, -1);
                 } else {
                   initialStateRaw = candidate;
                 }
               } else {
                 initialStateRaw = html.substring(start, html.lastIndexOf('}') + 1);
               }
             }
         }
      }

      let stateData: any = null;
      if (initialStateRaw) {
        try {
          stateData = JSON.parse(initialStateRaw);
        } catch (err) {
          console.error('Failed to parse window.__INITIAL_STATE__ directly, trying cleanup:', err);
          let temp = initialStateRaw.trim();
          if (temp.endsWith(';')) temp = temp.slice(0, -1).trim();
          try {
            stateData = JSON.parse(temp);
          } catch (err2) {
            console.error('Failed cleanup parse of __INITIAL_STATE__:', err2);
          }
        }
      }

      if (stateData) {
        let modelsContent = stateData?.content?.modelsContent || stateData?.modelsContent;
        if (!modelsContent) {
          const findKey = (obj: any, keyName: string): any => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj[keyName]) return obj[keyName];
            for (const key of Object.keys(obj)) {
              const res = findKey(obj[key], keyName);
              if (res) return res;
            }
            return null;
          };
          modelsContent = findKey(stateData, 'modelsContent');
        }

        if (modelsContent && typeof modelsContent === 'object') {
          const modelKeys = Object.keys(modelsContent);
          if (modelKeys.length > 0) {
            const alias = modelKeys[0];
            const modelData = modelsContent[alias];
            if (modelData) {
              modelName = modelData.name || modelData.title || modelName || alias;
              const movies = modelData.movies || modelData.videos || modelData.scenes || [];
              if (Array.isArray(movies) && movies.length > 0) {
                for (const m of movies) {
                  let coverUrl = m.img || m.cover || m.coverUrl || m.image || m.imageUrl || m.thumbnail || '';
                  if (coverUrl && coverUrl.startsWith('//')) {
                    coverUrl = 'https:' + coverUrl;
                  } else if (coverUrl && coverUrl.startsWith('/') && !coverUrl.startsWith('//')) {
                    coverUrl = 'https://www.teamskeet.com' + coverUrl;
                  }

                  let releaseDate = Date.now();
                  let dateStr = '';
                  const rawDate = m.publishedDate || m.date || m.published || m.added || '';
                  if (rawDate) {
                    const d = new Date(rawDate);
                    dateStr = isNaN(d.getTime()) ? String(rawDate) : d.toISOString().split('T')[0];
                    releaseDate = isNaN(d.getTime()) ? Date.now() : d.getTime();
                  }

                  let actors: string[] = [modelName];
                  const rawModels = m.models || m.actors || m.performers || [];
                  if (Array.isArray(rawModels)) {
                    for (const act of rawModels) {
                      let actName = '';
                      if (typeof act === 'string') actName = act;
                      else if (act && typeof act === 'object') actName = act.name || act.title || '';
                      if (actName && !actors.map(a => a.toLowerCase()).includes(actName.toLowerCase())) {
                        actors.push(actName);
                      }
                    }
                  }

                  scenes.push({
                    title: (m.title || m.name || 'Unknown Scene').trim(),
                    actors: actors.filter(Boolean),
                    coverUrl: coverUrl || '',
                    date: dateStr,
                    releaseDate,
                    tag: 'TeamSkeet'
                  });
                }
              }
            }
          }
        }
      }

      // Method 2: NEXT DATA (if 0 scenes extracted by INITIAL_STATE)
      if (scenes.length === 0) {
        console.log('Falling back to NEXT_DATA parsing for TeamSkeet');
        const nextScript = $('#__NEXT_DATA__').text().trim();
        if (nextScript) {
          try {
            const nextData = JSON.parse(nextScript);
            const results: any[] = [];
            const findArrays = (obj: any) => {
              if (!obj || typeof obj !== 'object') return;
              if (Array.isArray(obj)) {
                if (obj.length > 0 && obj.some(item => item && (item.title || item.sceneTitle || item.name))) {
                  results.push(obj);
                }
                for (const item of obj) findArrays(item);
                return;
              }
              for (const key of Object.keys(obj)) {
                findArrays(obj[key]);
              }
            };
            findArrays(nextData.props || {});
            
            if (results.length > 0) {
              results.sort((a, b) => b.length - a.length);
              const targetArray = results[0];
              
              for (const item of targetArray) {
                const title = item.title || item.sceneTitle || item.name || '';
                if (!title) continue;
                
                let coverUrl = item.cover || item.coverUrl || item.image || item.imageUrl || item.thumbnail || item.thumb || item.preview || '';
                if (typeof coverUrl === 'object' && coverUrl !== null) {
                  coverUrl = coverUrl.url || coverUrl.src || '';
                }
                if (coverUrl && coverUrl.startsWith('//')) {
                  coverUrl = 'https:' + coverUrl;
                } else if (coverUrl && coverUrl.startsWith('/') && !coverUrl.startsWith('//')) {
                  coverUrl = 'https://www.teamskeet.com' + coverUrl;
                }
                
                let dateStr = '';
                let releaseDate = Date.now();
                const rawDate = item.published || item.publishedDate || item.date || item.releaseDate || item.added || '';
                if (rawDate) {
                  const d = new Date(rawDate);
                  dateStr = isNaN(d.getTime()) ? String(rawDate) : d.toISOString().split('T')[0];
                  releaseDate = isNaN(d.getTime()) ? Date.now() : d.getTime();
                }
                
                let actors: string[] = [modelName];
                const rawActors = item.actors || item.models || item.performers || [];
                if (Array.isArray(rawActors)) {
                  for (const act of rawActors) {
                    let actName = '';
                    if (typeof act === 'string') actName = act;
                    else if (act && typeof act === 'object') actName = act.name || act.title || '';
                    if (actName && !actors.map(a => a.toLowerCase()).includes(actName.toLowerCase())) {
                      actors.push(actName);
                    }
                  }
                }
                
                scenes.push({
                  title: title.trim(),
                  actors: actors.filter(Boolean),
                  coverUrl: coverUrl || '',
                  date: dateStr,
                  releaseDate,
                  tag: 'TeamSkeet'
                });
              }
            }
          } catch (je) {
            console.error('Error parsing TeamSkeet NEXT_DATA JSON:', je);
          }
        }
      }

      // Method 3: DOM fallback
      if (scenes.length === 0) {
        console.log('Falling back to DOM element parsing for TeamSkeet');
        const domain = 'https://www.teamskeet.com';
        $('a').each((_i, aEl) => {
          const href = $(aEl).attr('href') || '';
          const isSceneLink = href.includes('/movies/') || href.includes('/scenes/') || href.includes('/video/') || href.includes('/videos/') || href.includes('/updates/') || href.includes('/scene/');
          if (!isSceneLink || href.includes('/models/') || href.includes('/model/') || href.includes('/pornstar/')) return;
          
          const fullLink = href.startsWith('http') ? href : `${domain}${href}`;
          if (scenesMap.has(fullLink)) return;

          const parent = $(aEl).closest('div, li, article, section, [class*="card"], [class*="item"]');
          
          let title = $(aEl).attr('title') || '';
          if (!title) {
            const text = $(aEl).text().trim();
            if (text && text.length > 5 && !/^\d+$/.test(text)) {
              title = text;
            }
          }
          if (!title && parent.length > 0) {
            parent.find('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"]').each((_j, hEl) => {
              const hText = $(hEl).text().trim();
              if (hText && hText.length > 3 && !title) title = hText;
            });
          }
          
          let img = $(aEl).find('img').attr('src') || $(aEl).find('img').attr('data-src') || $(aEl).find('img').attr('data-srcset') || '';
          if (!img && parent.length > 0) {
            parent.find('img').each((_j, imgEl) => {
              const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-srcset') || $(imgEl).attr('srcset') || '';
              if (src && !img) img = src;
            });
          }
          
          if (img) {
            img = img.trim().split(' ')[0];
            if (img.startsWith('//')) img = 'https:' + img;
            else if (img.startsWith('/') && !img.startsWith('//')) img = domain + img;
          }
          
          let dateStr = '';
          let releaseDate = Date.now();
          if (parent.length > 0) {
            const parentText = parent.text().replace(/\s+/g, ' ');
            const dateMatch = parentText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}/i) ||
                              parentText.match(/\d{2}\/\d{2}\/\d{4}/) ||
                              parentText.match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
              const d = new Date(dateMatch[0]);
              dateStr = isNaN(d.getTime()) ? dateMatch[0] : d.toISOString().split('T')[0];
              releaseDate = isNaN(d.getTime()) ? Date.now() : d.getTime();
            }
          }

          const actors: string[] = [modelName];
          if (parent.length > 0) {
            parent.find('a[href*="/models/"], a[href*="/model/"], a[href*="/pornstar/"]').each((_j, actEl) => {
              const name = $(actEl).text().trim();
              if (name && !actors.map(a => a.toLowerCase()).includes(name.toLowerCase()) && name.toLowerCase() !== 'view all') {
                actors.push(name);
              }
            });
          }
          
          if (title) title = title.replace(/\s+/g, ' ').trim();
          
          if (title || img) {
            scenesMap.set(fullLink, {
              title: title || 'Unknown TeamSkeet Scene',
              actors: actors.filter(Boolean),
              coverUrl: img || '',
              date: dateStr,
              releaseDate,
              tag: 'TeamSkeet'
            });
          }
        });

        scenes.push(...Array.from(scenesMap.values()));
      }

      console.log(`Extracted ${scenes.length} TeamSkeet scenes for ${modelName}`);
      return res.json({ success: true, url, scenes });
    } catch (error: any) {
      console.error('TeamSkeet Scraper Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
  });


  app.get('/api/proxy-image', async (req, res) => {
    try {
      const { url, filename } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).send('Missing url parameter');
      }
      
      console.log(`[ProxyImage] Attempting to proxy: ${url}`);
      
      let referer = 'https://sexmex.xxx/';
      if (url.includes('project1content') || url.includes('mypervyfamily')) {
        referer = 'https://www.mypervyfamily.com/';
      } else if (url.includes('naughtycdn') || url.includes('naughtyamerica')) {
        referer = 'https://www.naughtyamerica.com/';
      } else if (url.includes('teamskeet')) {
        referer = 'https://www.teamskeet.com/';
      } else if (url.includes('realitykings')) {
        referer = 'https://www.realitykings.com/';
      }

      const imgRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer
        }
      });
      if (!imgRes.ok) {
        console.error(`[ProxyImage] Failed to fetch target image: ${url} - Status: ${imgRes.status}`);
        return res.status(imgRes.status).send(`Failed to fetch image from source: ${imgRes.statusText}`);
      }
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      
      const safeFilename = typeof filename === 'string' ? filename : 'cover.jpg';
      
      // Sanitize filename for the standard 'filename' param and use 'filename*' for UTF-8 support
      // Node.js headers cannot contain non-ASCII characters.
      const asciiFilename = safeFilename.replace(/[^\x00-\x7F]/g, '_');
      const encodedFilename = encodeURIComponent(safeFilename)
        .replace(/['()]/g, escape) // RFC 5987 reserved chars
        .replace(/\*/g, '%2A');
      
      res.setHeader('Content-Type', contentType);
      // Modern standard for supporting UTF-8 filenames in headers
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(Buffer.from(buffer));
    } catch (e: any) {
      console.error(`[ProxyImage] Error: ${e.message}`, e);
      res.status(500).send(e.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import { NormalizedStream, FormatterPreset } from '../types/magnetio';

/**
 * Token evaluation engine for Stremio Stream Name and Description.
 * Supports:
 *   - Standard variables: {stream.resolution}, {stream.filename}, {service.shortName}, etc.
 *   - Conditionals: {variable::exists["true"||"false"]}, {variable::istrue["true"||"false"]}, {variable::isfalse["true"||"false"]}
 *   - Comparisons: {variable::>0["true"||"false"]}, {variable::=p2p["true"||"false"]}, {variable::in('A','B')["true"||"false"]}
 *   - Formatters: {variable::replace('a','b')}, {variable::join(' • ')}, {variable::uppercase}, {variable::title}, {variable::sbytes}, {variable::sbitrate}, {variable::time}
 *   - Optional blocks: {? text with {token} ?} - hidden if inner tokens resolve to empty
 */

export function extractStreamValue(stream: NormalizedStream, key: string): unknown {
  const normalizedKey = key.trim().toLowerCase();
  const streamRecord = stream as unknown as Record<string, unknown>;

  // Check direct or alias properties
  switch (normalizedKey) {
    case 'provider.name':
    case 'provider':
    case 'addon.name':
      return stream.providerName || 'Magnetio';
    case 'source':
      return stream.providerName || 'Magnetio';
    case 'service.id':
    case 'service.name':
      return stream.isDebrid ? stream.providerName : '';
    case 'service.shortname':
      if (!stream.isDebrid) return '';
      if (stream.providerName.toLowerCase().includes('real')) return 'RD';
      if (stream.providerName.toLowerCase().includes('torbox')) return 'TB';
      if (stream.providerName.toLowerCase().includes('all')) return 'AD';
      if (stream.providerName.toLowerCase().includes('premium')) return 'PM';
      if (stream.providerName.toLowerCase().includes('link')) return 'DL';
      return 'DB';
    case 'service.cached':
    case 'stream.cached':
    case 'cached':
      return stream.cached;
    case 'stream.type':
      return stream.isDebrid ? 'debrid' : 'p2p';
    case 'stream.resolution':
    case 'resolution':
      return stream.resolution;
    case 'stream.quality':
    case 'quality':
      return stream.quality;
    case 'stream.codec':
    case 'codec':
    case 'stream.encode':
    case 'encode':
      return streamRecord.encode || stream.codec;
    case 'stream.size':
    case 'size':
      return stream.sizeFormatted;
    case 'stream.sbytes':
      return stream.sizeFormatted;
    case 'stream.bytes':
    case 'bytes':
      return stream.size;
    case 'stream.foldersize':
      return '';
    case 'stream.bitrate':
      return '';
    case 'stream.duration':
      return '';
    case 'stream.seeders':
    case 'seeders':
      return stream.seeders;
    case 'stream.releasegroup':
    case 'releasegroup':
      return stream.releaseGroup;
    case 'stream.language':
    case 'stream.languages':
    case 'language':
      return stream.language;
    case 'stream.languageemojis':
      return (stream.language || []).map((l) => {
        const lower = l.toLowerCase();
        if (lower.includes('en')) return '🇬🇧';
        if (lower.includes('ar')) return '🇸🇦';
        if (lower.includes('fr')) return '🇫🇷';
        if (lower.includes('es')) return '🇪🇸';
        if (lower.includes('de')) return '🇩🇪';
        if (lower.includes('it')) return '🇮🇹';
        if (lower.includes('ja')) return '🇯🇵';
        if (lower.includes('ko')) return '🇰🇷';
        if (lower.includes('ru')) return '🇷🇺';
        if (lower.includes('hi')) return '🇮🇳';
        return '🌐';
      });
    case 'stream.hdr':
    case 'hdr':
      return stream.hdr;
    case 'stream.audiotags':
    case 'audiotags':
      return stream.audioTags;
    case 'stream.audiochannels':
    case 'audiochannels':
      return streamRecord.audioChannels ?? stream.audioTags;
    case 'stream.visualtags':
    case 'visualtags':
      return streamRecord.visualTags ?? (stream.hdr ? [stream.hdr] : []);
    case 'stream.seasonepisode':
    case 'seasonepisode':
      return streamRecord.seasonEpisode ?? [];
    case 'stream.formattedseasons':
      return '';
    case 'stream.formattedepisodes':
      return '';
    case 'stream.editions':
      return streamRecord.editions ?? [];
    case 'stream.infohash':
    case 'infohash':
      return stream.infoHash;
    case 'debrid.name':
    case 'debrid':
      return stream.isDebrid ? stream.providerName : '';
    case 'stream.isdebrid':
    case 'isdebrid':
      return stream.isDebrid;
    case 'stream.filename':
    case 'filename':
      return stream.filename;
    case 'stream.foldername':
      return '';
    case 'stream.title':
    case 'title':
      return stream.title;
    case 'stream.indexer':
    case 'indexer':
      return stream.providerName;
    case 'stream.age':
      return '';
    case 'stream.message':
      return '';
    case 'stream.subtitles':
    case 'stream.subtitleemojis':
      return [];
    case 'stream.proxied':
    case 'stream.private':
    case 'stream.library':
    case 'stream.seadex':
    case 'stream.seadexbest':
      return false;
    default:
      return streamRecord[key] ?? '';
  }
}

/**
 * Splits expression by '::' while respecting quotes, brackets, parens, and braces.
 */
function splitModifiers(expr: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let bracketDepth = 0;
  let parenDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    if (inQuotes) {
      current += char;
      if (char === quoteChar && expr[i - 1] !== '\\') {
        inQuotes = false;
      }
    } else if (char === '"' || char === "'") {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (char === '[') {
      bracketDepth++;
      current += char;
    } else if (char === ']') {
      if (bracketDepth > 0) bracketDepth--;
      current += char;
    } else if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      if (parenDepth > 0) parenDepth--;
      current += char;
    } else if (char === '{') {
      braceDepth++;
      current += char;
    } else if (char === '}') {
      if (braceDepth > 0) braceDepth--;
      current += char;
    } else if (char === ':' && expr[i + 1] === ':' && bracketDepth === 0 && parenDepth === 0 && braceDepth === 0) {
      parts.push(current);
      current = '';
      i++; // skip second ':'
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function parseBranchContent(content: string): { trueStr: string; falseStr: string } {
  let splitIdx = -1;
  let inQ = false;
  let qC = '';
  let bDepth = 0;

  for (let cIdx = 0; cIdx < content.length - 1; cIdx++) {
    const ch = content[cIdx];
    if (inQ) {
      if (ch === qC && content[cIdx - 1] !== '\\') inQ = false;
    } else if (ch === '"' || ch === "'") {
      inQ = true;
      qC = ch;
    } else if (ch === '{' || ch === '[') {
      bDepth++;
    } else if (ch === '}' || ch === ']') {
      if (bDepth > 0) bDepth--;
    } else if (ch === '|' && content[cIdx + 1] === '|' && !inQ && bDepth === 0) {
      splitIdx = cIdx;
      break;
    }
  }

  let trueBranch = content;
  let falseBranch = '';
  if (splitIdx !== -1) {
    trueBranch = content.slice(0, splitIdx);
    falseBranch = content.slice(splitIdx + 2);
  }

  const stripQuotes = (str: string) => {
    const s = str.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  };

  return {
    trueStr: stripQuotes(trueBranch),
    falseStr: stripQuotes(falseBranch),
  };
}

/**
 * Evaluates a single token match like `{stream.cached::istrue["⚡ RD+"||"⏳ Torrent"]}`
 */
export function evaluateToken(tokenExpr: string, stream: NormalizedStream): string {
  const inner = tokenExpr.slice(1, -1).trim();

  // If token is bracketed condition shorthand like `[P2P]` without variable
  if (!inner) return '';

  const parts = splitModifiers(inner);
  const baseKey = parts[0].trim();

  // Handle direct bracketed condition on variable: key["true"||"false"]
  const directBranchMatch = baseKey.match(/^([a-zA-Z0-9_.]+)(\[.*\])$/s);
  let resolvedBaseKey = baseKey;
  let directBranch: string | null = null;
  if (directBranchMatch) {
    resolvedBaseKey = directBranchMatch[1];
    directBranch = directBranchMatch[2].slice(1, -1);
  }

  const rawValue = extractStreamValue(stream, resolvedBaseKey);
  let result = rawValue;

  if (directBranch !== null) {
    const { trueStr, falseStr } = parseBranchContent(directBranch);
    const isValTruthy = Boolean(result && result !== 'false' && result !== 0 && (!Array.isArray(result) || result.length > 0));
    result = formatTemplate(isValTruthy ? trueStr : falseStr, stream);
  }

  // Process modifier pipeline
  for (let i = 1; i < parts.length; i++) {
    const mod = parts[i].trim();

    // ::replace('find', 'repl') or ::replace("find", "repl")
    const replaceMatch = mod.match(/^replace\((?:["'])(.*?)(?:["'])\s*,\s*(?:["'])(.*?)(?:["'])\)$/s);
    if (replaceMatch) {
      const findVal = replaceMatch[1];
      const replVal = replaceMatch[2];
      result = String(result ?? '').split(findVal).join(replVal);
      continue;
    }

    // ::exists["A"||"B"]
    if (mod.toLowerCase().startsWith('exists[') && mod.endsWith(']')) {
      const content = mod.slice(7, -1);
      const { trueStr, falseStr } = parseBranchContent(content);
      const isExists = Boolean(
        result !== undefined &&
        result !== null &&
        result !== '' &&
        (!Array.isArray(result) || result.length > 0)
      );
      result = formatTemplate(isExists ? trueStr : falseStr, stream);
      continue;
    }

    // ::istrue["A"||"B"]
    if (mod.toLowerCase().startsWith('istrue[') && mod.endsWith(']')) {
      const content = mod.slice(7, -1);
      const { trueStr, falseStr } = parseBranchContent(content);
      const isTruthy = Boolean(result && result !== 'false' && result !== '0' && result !== false);
      result = formatTemplate(isTruthy ? trueStr : falseStr, stream);
      continue;
    }

    // ::isfalse["A"||"B"]
    if (mod.toLowerCase().startsWith('isfalse[') && mod.endsWith(']')) {
      const content = mod.slice(8, -1);
      const { trueStr, falseStr } = parseBranchContent(content);
      const isFalsey = !result || result === 'false' || result === '0' || result === false;
      result = formatTemplate(isFalsey ? trueStr : falseStr, stream);
      continue;
    }

    // ::>0["A"||"B"]
    if (mod.startsWith('>0[') && mod.endsWith(']')) {
      const content = mod.slice(3, -1);
      const { trueStr, falseStr } = parseBranchContent(content);
      const num = typeof result === 'number' ? result : parseFloat(String(result || '0'));
      const isGtZero = !isNaN(num) && num > 0;
      result = formatTemplate(isGtZero ? trueStr : falseStr, stream);
      continue;
    }

    // ::>=0["A"||"B"]
    if (mod.startsWith('>=0[') && mod.endsWith(']')) {
      const content = mod.slice(4, -1);
      const { trueStr, falseStr } = parseBranchContent(content);
      const num = typeof result === 'number' ? result : parseFloat(String(result || '-1'));
      const isGteZero = !isNaN(num) && num >= 0;
      result = formatTemplate(isGteZero ? trueStr : falseStr, stream);
      continue;
    }

    // ::join("delimiter") or ::join('delimiter')
    const joinMatch = mod.match(/^join\((?:["'])(.*?)(?:["'])\)$/i) || mod.match(/^join\((.*?)\)$/i);
    if (joinMatch) {
      const delimiter = joinMatch[1] ?? ' ';
      if (Array.isArray(result)) {
        result = result.filter(Boolean).join(delimiter);
      }
      continue;
    }

    // ::upper or ::uppercase
    if (mod.toLowerCase() === 'uppercase' || mod.toLowerCase() === 'upper') {
      result = String(result ?? '').toUpperCase();
      continue;
    }

    // ::lower or ::lowercase
    if (mod.toLowerCase() === 'lowercase' || mod.toLowerCase() === 'lower') {
      result = String(result ?? '').toLowerCase();
      continue;
    }

    // ::title
    if (mod.toLowerCase() === 'title') {
      result = String(result ?? '').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
      continue;
    }

    // ::sbytes or ::bytes2
    if (mod.toLowerCase() === 'sbytes' || mod.toLowerCase() === 'bytes2' || mod.toLowerCase() === 'bytes') {
      result = stream.sizeFormatted;
      continue;
    }

    // ::fallback["Text"]
    const fallbackMatch = mod.match(/^fallback\[(?:["'])(.*?)(?:["'])\]$/i) || mod.match(/^fallback\[(.*?)(?:\])$/i);
    if (fallbackMatch) {
      if (!result || (Array.isArray(result) && result.length === 0)) {
        result = fallbackMatch[1];
      }
      continue;
    }

    // ::prefix["Text"]
    const prefixMatch = mod.match(/^prefix\[(?:["'])(.*?)(?:["'])\]$/i) || mod.match(/^prefix\[(.*?)(?:\])$/i);
    if (prefixMatch && result) {
      result = `${prefixMatch[1]}${String(result)}`;
      continue;
    }

    // ::suffix["Text"]
    const suffixMatch = mod.match(/^suffix\[(?:["'])(.*?)(?:["'])\]$/i) || mod.match(/^suffix\[(.*?)(?:\])$/i);
    if (suffixMatch && result) {
      result = `${String(result)}${suffixMatch[1]}`;
      continue;
    }
  }

  // Convert final result to string
  if (Array.isArray(result)) {
    return result.filter(Boolean).join(' ');
  }
  if (typeof result === 'boolean') {
    return result ? 'Yes' : 'No';
  }
  return result !== undefined && result !== null ? String(result) : '';
}

/**
 * Replaces all tokens in a template string with actual stream values.
 * Handles:
 *  - Optional conditional blocks: {? text with {nested_token} ?} -> omitted if inner tokens evaluate to empty
 *  - Balanced curly brace tokens: {token...}
 */
export function formatTemplate(template: string, stream: NormalizedStream): string {
  if (!template) return '';

  // 1. Process {? optional block ?} syntax from AIOStreams
  let processed = template.replace(/\{\?(.*?)\?\}/gs, (_match, innerContent) => {
    const evaluated = formatTemplate(innerContent, stream);
    // If the evaluated text only contains non-alphanumeric/spaces or empty, omit it
    const trimmed = evaluated.replace(/[\s\r\n\t•|/\-:]/g, '');
    return trimmed.length > 0 ? evaluated : '';
  });

  // 2. Parse balanced braces { ... }
  let output = '';
  let i = 0;

  while (i < processed.length) {
    if (processed[i] === '{') {
      let depth = 1;
      let j = i + 1;
      while (j < processed.length && depth > 0) {
        if (processed[j] === '{') depth++;
        else if (processed[j] === '}') depth--;
        j++;
      }

      if (depth === 0) {
        const tokenExpr = processed.slice(i, j);
        output += evaluateToken(tokenExpr, stream);
        i = j;
        continue;
      }
    }
    output += processed[i];
    i++;
  }

  return output;
}

/**
 * Official Built-in Formatter Presets from AIOStreams (aiostreams.elfhosted.com):
 *  1. Torrentio (Default)
 *  2. Google Drive (GDrive)
 *  3. Light Google Drive
 *  4. Minimalistic
 *  5. Torbox
 *  6. Prism
 *  7. Tamtaro
 *  8. Magnetio Pro (Original Custom)
 */
export const DEFAULT_FORMATTER_PRESETS: FormatterPreset[] = [
  {
    id: 'torrentio',
    name: 'Torrentio',
    description: 'Uses the formatting from the Torrentio addon (Default).',
    badge: 'AIOStreams Default',
    nameTemplate: `{stream.proxied["🕵️‍♂️ "||""]}{stream.private["🔑 "||""]}{stream.type::=p2p["[P2P] "||""]}{service.id::exists["[{service.shortName}"||""]}{service.cached["+] "||" download] "]}{addon.name} {stream.resolution::exists["{stream.resolution}"||"Unknown"]}\n{?{stream.visualTags::join(' | ')}?}`,
    descriptionTemplate: `{?ℹ️{stream.message}?}\n{?{stream.folderName}?}\n{?{stream.filename}?}\n{stream.size::>0["💾{stream.size::bytes2} "||""]}{stream.folderSize::>0["/ 💾{stream.folderSize::bytes2}"||""]}{stream.seeders::>=0["👤{stream.seeders} "||""]}{?📅{stream.age} ?}{?⚙️{stream.indexer}?}\n{?{stream.languageEmojis::join(' / ')}?}{stream.subtitles::exists::and::stream.languageEmojis::exists[" "||""]}{stream.subtitles::exists["Subs / {stream.subtitleEmojis::join(' / ')}"||""]}\n`,
  },
  {
    id: 'lightgdrive',
    name: 'Light Google Drive',
    description: 'A lighter version of the GDrive formatter, focused on aesthetics.',
    badge: 'Aesthetic',
    nameTemplate: `{stream.proxied["🕵️ "||""]}{stream.private["🔑 "||""]}{stream.type::=p2p["[P2P] "||""]}{?[{service.shortName}?}{stream.library["☁️"||""]}{service.cached["⚡] "||"⏳] "]}{addon.name}{? {stream.resolution}?}{stream.seadexBest[" (Best)"||""]}`,
    descriptionTemplate: `{?📁 {stream.title::title}?}{? ({stream.year})?}{? {stream.seasonEpisode::join(' • ')}?}\n{?🎥 {stream.quality} ?}{?🎞️ {stream.encode} ?}{?🏷️ {stream.releaseGroup}?}{?📡 {stream.network} ?}{stream.editions::exists[" 🏆 {stream.editions::join(' • ')}"||""]}\n{?📺 {stream.visualTags::join(' • ')} ?}{?🎧 {stream.audioTags::join(' • ')} ?}{?🔊 {stream.audioChannels::join(' • ')}?}\n{stream.size::>0["📦 {stream.size::sbytes} "||""]}{stream.duration::>0["⏱️ {stream.duration::time} "||""]}{?📅 {stream.age} ?}{?🔍 {stream.indexer}?}\n{?🌐 {stream.languageEmojis::join(' / ')}?}`,
  },
  {
    id: 'minimalisticgdrive',
    name: 'Minimalistic',
    description: 'A minimalistic formatter which shows only the bare minimum.',
    badge: 'Minimal',
    nameTemplate: `{stream.resolution::exists["{stream.resolution::replace('2160p','✨ 4K')::replace('1440p','📀 2K')::replace('1080p','🧿1080p')::replace('720p','💿720p')}"||"N/A"]}{service.cached[" 🎫 "||" 🎟️ "]}\n{?{stream.quality::upper}?}\n`,
    descriptionTemplate: `{?🔆 {stream.visualTags::join(' • ')}  ?}{?🔊 {stream.audioTags::join(' • ')}?}\n{stream.size::>0["📦 {stream.size::sbytes} "||""]}\n{?🌎 {stream.languages::join(' • ')}?}`,
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Uses the formatting from the Stremio GDrive addon.',
    badge: 'Classic GDrive',
    nameTemplate: `{stream.proxied["🕵️ "||""]}{stream.private["🔑 "||""]}{stream.type::=p2p["[P2P] "||""]}{?[{service.shortName}?}{service.cached["⚡] "||"⏳] "]}{addon.name}{stream.library[" (Your Media)"||""]} {?{stream.resolution}?}{stream.seadexBest[" (Best)"||""]}`,
    descriptionTemplate: `{?🎥 {stream.quality} ?}{?🎞️ {stream.encode} ?}{?🏷️ {stream.releaseGroup} ?}{?📡 {stream.network} ?}{stream.editions::exists["🏆 {stream.editions::join(' | ')} "||""]}\n{?📺 {stream.visualTags::join(' | ')} ?}{?🎧 {stream.audioTags::join(' | ')} ?}{?🔊 {stream.audioChannels::join(' | ')}?}\n{stream.size::>0["📦 {stream.size::sbytes} "||""]}{stream.duration::>0["⏱️ {stream.duration::time} "||""]}{stream.seeders::>0["👥 {stream.seeders} "||""]}{?📅 {stream.age} ?}{?🔍 {stream.indexer}?}\n{?🌎 {stream.languages::join(' | ')}?}\n📁 {stream.filename}`,
  },
  {
    id: 'prism',
    name: 'Prism',
    description: 'An aesthetic formatter with rich emoji badges within 5 lines.',
    badge: 'Rich Badges',
    nameTemplate: `{stream.resolution::exists["{stream.resolution::replace('2160p', '🔥4K UHD')::replace('1440p','✨ QHD')::replace('1080p','🚀 FHD')::replace('720p','💿 HD')::replace('576p','💩 Low Quality')::replace('480p','💩 Low Quality')}"||"💩 Unknown"]}`,
    descriptionTemplate: `{?🎬 {stream.title::title} ?}{?({stream.year}) ?}{?🍂 {stream.formattedSeasons} ?}{?🎞️ {stream.formattedEpisodes}?}\n{?🎥 {stream.quality} ?}{?📺 {stream.visualTags::join(' | ')} ?}{?🎞️ {stream.encode} ?}{stream.duration::>0["⏱️ {stream.duration::time} "||""]}\n{?🎧 {stream.audioTags::join(' | ')} ?}{?🔊 {stream.audioChannels::join(' | ')} ?}{stream.languages::exists["🗣️ {stream.languageEmojis::join(' / ')}"||""]}\n{stream.size::>0["📦 {stream.size::sbytes} "||""]}{service.cached::isfalse::or::stream.type::=p2p::and::stream.seeders::>0["🌱 {stream.seeders} "||""]}{?🏷️ {stream.releaseGroup} ?}{?📡 {stream.indexer} ?}\n{service.cached["⚡Ready "||"❌ Not Ready "]}{service.id::exists["({service.shortName}) "||""]}{stream.type::=p2p["⚠️ P2P "||""]}🔍{addon.name}`,
  },
  {
    id: 'torbox',
    name: 'TorBox',
    description: 'Uses the formatting from the TorBox Stremio addon.',
    badge: 'TorBox Style',
    nameTemplate: `{stream.proxied["🕵️‍♂️ "||""]}{stream.private["🔑 "||""]}{stream.type::=p2p["[P2P] "||""]}{addon.name}{service.cached[" (Instant "||" ("]}{service.id::exists["{service.shortName})"||""]}{? ({stream.resolution})?}`,
    descriptionTemplate: `Quality: {stream.quality::exists["{stream.quality}"||"Unknown"]}\nName: {stream.filename::exists["{stream.filename}"||"Unknown"]}\nSize: {stream.size::>0["{stream.size::bytes} "||""]}{?| Source: {stream.indexer} ?}\nLanguages: {?{stream.languages::join(', ')}?}`,
  },
  {
    id: 'tamtaro',
    name: 'Tamtaro',
    description: "From Tamtaro's setup. Smartly detects status for cached (⚡/⏳) and HDR/DV (✦/✧).",
    badge: 'Tamtaro Pro',
    nameTemplate: `{stream.resolution::exists["{stream.resolution::replace('2160p','   4K ')::replace('1440p','    2K ')::replace('p','P')}"||"     "]}{service.cached["⚡"||"⏳"]}{?  <{stream.quality::title}>  ?}`,
    descriptionTemplate: `{stream.title::exists["{stream.title::title}"||""]}{?  {stream.seasonEpisode::join('·')}?}{? ▣ {stream.encode} ?}{stream.visualTags::exists["✦ {stream.visualTags::join(' · ')} "||""]}\n{stream.audioTags::length::>0["♬ {stream.audioTags::join(' · ')} "||""]}{stream.audioChannels::length::>0["♯ {stream.audioChannels::join(' · ')} "||""]}\n{stream.size::>0["◈ {stream.size} "||""]}{service.cached::isfalse::or::stream.type::=p2p::and::stream.seeders::>0["⇄ {stream.seeders} "||""]}{?[{service.shortName}] ?}{addon.name}{? · {stream.releaseGroup}?}\n{?✓ {stream.languages::join(' · ')} ?}`,
  },
  {
    id: 'magnetio-pro',
    name: 'Magnetio Pro',
    description: 'Clean badge header with rich media icons, audio tags & debrid status.',
    badge: 'Custom Magnetio',
    nameTemplate: '[Magnetio] {stream.resolution} {stream.hdr::prefix[""]::suffix[" "]}',
    descriptionTemplate: '📁 {stream.filename}\n💾 {stream.size}  •  👤 {stream.seeders}  •  ⚙️ {stream.codec}\n🔊 {stream.audioTags::join(" • ")}  •  🌐 {stream.language::join("/")}\n{stream.cached::istrue["⚡ Cached ({provider.name})"||"⏳ P2P Torrent ({stream.seeders} seeders)"]}',
  },
];

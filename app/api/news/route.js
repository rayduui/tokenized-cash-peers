import { NextResponse } from 'next/server';

export const revalidate = 3600;

const KEYWORDS = /tokeniz|rwa|treasury|buidl|usyc|benji|usdy|ousg|ustb|wtgxx|securitize|ondo|spiko|centrifuge|blackrock|franklin|wisdomtree|superstate|circle|dtcc|isda|money.?market|t-bill|tbill/i;

function simpleSentiment(text) {
  const lower = (text || '').toLowerCase();
  const pos = (lower.match(/expand|growth|crosses|launches|approval|eligible|capacity|guidance|increases|surges|milestone|adoption/g) || []).length;
  const neg = (lower.match(/falls|drops|declines|outflow|risk|default|halt|suspend|loss|crash|liquidation/g) || []).length;
  if (pos > neg) return 'Positive';
  if (neg > pos) return 'Negative';
  return 'Neutral';
}

async function fetchRSS() {
  try {
    const res = await fetch('https://cointelegraph.com/rss', { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) && items.length < 8) {
      const block = m[1];
      const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const desc = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
      const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
      const cleanDesc = desc.replace(/<[^>]+>/g, '').trim().slice(0, 280);
      if (KEYWORDS.test(cleanTitle + ' ' + cleanDesc)) {
        items.push({
          title: cleanTitle,
          source: 'Cointelegraph',
          date: pub ? new Date(pub).toISOString().slice(0, 10) : '',
          url: link.trim(),
          summary: cleanDesc,
          implication: 'Public coverage of tokenized markets.',
          sentiment: simpleSentiment(cleanTitle + ' ' + cleanDesc),
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  const curated = await import('../../../data/news.json').then((m) => m.default || m).catch(() => ({ items: [] }));
  const rss = await fetchRSS();
  const seen = new Set();
  const merged = [...(curated.items || []), ...rss].filter((it) => {
    const key = (it.title || '').toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
  return NextResponse.json({ asOf: new Date().toISOString().slice(0, 10), items: merged });
}

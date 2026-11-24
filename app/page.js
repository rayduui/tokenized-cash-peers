'use client';

import { useEffect, useState, useMemo } from 'react';

function formatAUM(n) {
  if (n == null || isNaN(n)) return 'n.a.';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + Math.round(n).toLocaleString();
}

export default function Page() {
  const [funds, setFunds] = useState([]);
  const [news, setNews] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [status, setStatus] = useState('Loading');
  const [lastUpdate, setLastUpdate] = useState('—');

  async function load() {
    setStatus('Refreshing…');
    try {
      const [yRes, nRes, pRes] = await Promise.all([
        fetch('/api/yields'),
        fetch('/api/news'),
        fetch('https://api.llama.fi/protocols')
      ]);
      const yData = await yRes.json();
      const nData = await nRes.json();
      const pData = await pRes.json();

      setFunds(yData.funds || []);
      setNews(nData.items || []);

      const rwa = (pData || []).filter(p =>
        (p.category || '').toLowerCase().includes('rwa') ||
        (p.name || '').toLowerCase().match(/buidl|usyc|benji|usdy|ousg|wtgxx|ustb|umint|jtrsy|tbill|securitize|ondo|spiko|centrifuge/)
      );
      setProtocols(rwa);
      setStatus('Live');
    } catch (e) {
      setStatus('Error');
    }
    setLastUpdate(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong' }) + ' HKT');
  }

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => {
    return funds.map(f => {
      const match = protocols.find(p =>
        (p.name || '').toLowerCase().includes(f.ticker.toLowerCase()) ||
        (p.symbol || '').toLowerCase().includes(f.ticker.toLowerCase())
      );
      return {
        ...f,
        aum: match?.tvl || null,
        change1d: match?.change_1d ?? null,
        change7d: match?.change_7d ?? null,
        chains: match?.chains?.length || 0,
      };
    }).sort((a, b) => (b.aum || 0) - (a.aum || 0));
  }, [funds, protocols]);

  const totalAUM = enriched.reduce((s, f) => s + (f.aum || 0), 0);
  const avgYield = enriched.length ? enriched.reduce((s, f) => s + f.yield, 0) / enriched.length : 0;
  const positive1d = enriched.filter(f => f.change1d > 0).length;
  const avgChains = enriched.length ? (enriched.reduce((s, f) => s + (f.chains || 0), 0) / enriched.length).toFixed(1) : 0;
  const topFund = enriched[0];
  const highestYield = [...enriched].sort((a, b) => b.yield - a.yield)[0];

  const metricCards = [
    { label: 'Tracked AUM', value: formatAUM(totalAUM), sub: 'matched protocols', accent: 'var(--accent)' },
    { label: 'Avg 7-day yield', value: avgYield.toFixed(2) + '%', sub: 'known funds', accent: 'var(--accent-2)' },
    { label: 'Funds tracked', value: enriched.length, sub: 'issuers', accent: 'var(--accent-3)' },
    { label: 'RWA protocols', value: protocols.length, sub: 'DefiLlama', accent: 'var(--violet)' },
    { label: 'Positive 1d', value: positive1d + '/' + enriched.length, sub: 'funds up', accent: 'var(--green)' },
    { label: 'Avg chains', value: avgChains, sub: 'per fund', accent: 'var(--accent-4)' },
    { label: 'Largest by AUM', value: topFund ? topFund.ticker : '—', sub: topFund ? formatAUM(topFund.aum) : '', accent: 'var(--accent)' },
    { label: 'Highest yield', value: highestYield ? highestYield.yield.toFixed(2) + '%' : '—', sub: highestYield ? highestYield.ticker : '', accent: 'var(--accent-2)' },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 20px' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 0 12px',
        position: 'sticky', top: 0,
        background: 'rgba(11,12,16,0.94)',
        backdropFilter: 'blur(14px)',
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-2)' }}>Tokenized funds · Global markets</div>
            <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 2 }}>RWA Pulse</h1>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Live dashboard of tokenized money-market, treasury and yield products</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={load} style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-4))',
              color: '#fff', border: 'none',
              padding: '8px 14px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 600
            }}>Refresh</button>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{status}</span>
          </div>
        </div>
      </header>

      {/* Metric grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, margin: '22px 0 28px' }}>
        {metricCards.map(m => (
          <div key={m.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 14px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: m.accent }} />
            <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Yield bar visual */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Yield snapshot</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
          {enriched.slice(0, 8).map(f => {
            const maxY = Math.max(...enriched.map(x => x.yield), 1);
            const h = (f.yield / maxY) * 100;
            return (
              <div key={f.ticker} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 4 }}>{f.yield.toFixed(2)}%</div>
                <div style={{ width: '70%', height: h + '%', minHeight: 8, background: 'linear-gradient(180deg, var(--accent), var(--accent-4))', borderRadius: '4px 4px 0 0' }} />
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6 }}>{f.ticker}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Developments</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>Scheduled source · updated independently</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
          {news.map((item, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</h3>
                <span style={{ fontSize: 10.5, color: 'var(--accent-2)', background: 'rgba(255,209,102,0.12)', padding: '2px 7px', borderRadius: 99 }}>{item.date}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8 }}>{item.source}</div>
              <p style={{ fontSize: 13, marginBottom: 8 }}>{item.summary}</p>
              <div style={{ fontSize: 12.5, borderTop: '1px solid var(--border)', paddingTop: 8, color: 'var(--accent-3)' }}><strong>Implication.</strong> {item.implication}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Tokenized funds</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>AUM from DefiLlama where matched · yields from scheduled source · sorted by AUM</p>
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Fund', 'Issuer', 'Type', '7d yield', 'AUM', '1d', '7d', 'Chains'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map(f => (
                <tr key={f.ticker} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 12px', fontWeight: 550 }}>{f.name}</td>
                  <td style={{ padding: '11px 12px', color: 'var(--muted)' }}>{f.issuer}</td>
                  <td style={{ padding: '11px 12px' }}><span style={{ background: 'rgba(255,107,74,0.15)', color: '#ffb4a2', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>{f.type}</span></td>
                  <td style={{ padding: '11px 12px', fontWeight: 550 }}>{f.yield.toFixed(2)}%</td>
                  <td style={{ padding: '11px 12px' }}>{formatAUM(f.aum)}</td>
                  <td style={{ padding: '11px 12px', color: f.change1d >= 0 ? 'var(--green)' : 'var(--red)' }}>{f.change1d != null ? (f.change1d >= 0 ? '+' : '') + f.change1d.toFixed(1) + '%' : 'n.a.'}</td>
                  <td style={{ padding: '11px 12px', color: f.change7d >= 0 ? 'var(--green)' : 'var(--red)' }}>{f.change7d != null ? (f.change7d >= 0 ? '+' : '') + f.change7d.toFixed(1) + '%' : 'n.a.'}</td>
                  <td style={{ padding: '11px 12px' }}>{f.chains || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0 36px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        <p>For information only. Not an offer or recommendation. Data from DefiLlama public API and scheduled source files. Figures are not independently audited. Last refresh: {lastUpdate}.</p>
      </footer>
    </div>
  );
}

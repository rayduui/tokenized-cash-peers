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

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 22px' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '18px 0 14px',
        position: 'sticky', top: 0,
        background: 'rgba(7,9,15,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tokenized funds · Global markets</div>
            <h1 style={{ fontSize: 32, fontWeight: 560, letterSpacing: '-0.03em', marginTop: 2 }}>RWA Pulse</h1>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Live view of tokenized money-market, treasury and yield products across issuers and chains</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={load} style={{
              background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
              padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500
            }}>Refresh</button>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{status}</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, margin: '24px 0 32px' }}>
        {[
          { label: 'Tracked AUM', value: formatAUM(totalAUM), sub: 'matched protocols' },
          { label: 'Avg 7-day yield', value: avgYield.toFixed(2) + '%', sub: 'known funds' },
          { label: 'Funds tracked', value: enriched.length, sub: 'issuers' },
          { label: 'RWA protocols', value: protocols.length, sub: 'DefiLlama' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 560, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 560, marginBottom: 4 }}>Developments</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Updated from scheduled data. Last as-of in source file.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          {news.map((item, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{item.title}</h3>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8 }}>{item.source} · {item.date}</div>
              <p style={{ fontSize: 13, marginBottom: 8 }}>{item.summary}</p>
              <div style={{ fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 8 }}><strong>Implication.</strong> {item.implication}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 560, marginBottom: 4 }}>Tokenized funds</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Major USD liquidity and treasury products. AUM from DefiLlama where matched; yields from scheduled source. Sorted by matched AUM.</p>
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
                  <td style={{ padding: '11px 12px' }}><span style={{ background: 'rgba(124,92,255,0.15)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>{f.type}</span></td>
                  <td style={{ padding: '11px 12px' }}>{f.yield.toFixed(2)}%</td>
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

      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 0 40px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        <p>For information only. Not an offer or recommendation. Data from DefiLlama public API and scheduled source files. Figures are not independently audited. Last refresh: {lastUpdate}.</p>
      </footer>
    </div>
  );
}

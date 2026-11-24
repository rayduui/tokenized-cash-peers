'use client';

import { useEffect, useState, useMemo } from 'react';

const KNOWN_FUNDS = [
  { ticker: 'BUIDL', name: 'BlackRock BUIDL', issuer: 'BlackRock / Securitize', type: 'USD MMF', yield: 3.76 },
  { ticker: 'USYC', name: 'Circle USYC', issuer: 'Circle', type: 'USD MMF', yield: 3.85 },
  { ticker: 'BENJI', name: 'Franklin BENJI', issuer: 'Franklin Templeton', type: 'USD MMF', yield: 3.81 },
  { ticker: 'USDY', name: 'Ondo USDY', issuer: 'Ondo', type: 'Yield note', yield: 4.10 },
  { ticker: 'OUSG', name: 'Ondo OUSG', issuer: 'Ondo', type: 'Treasuries', yield: 3.90 },
  { ticker: 'WTGXX', name: 'WisdomTree WTGXX', issuer: 'WisdomTree', type: 'USD MMF', yield: 3.79 },
  { ticker: 'USTB', name: 'Superstate USTB', issuer: 'Superstate', type: 'USD MMF', yield: 3.88 },
  { ticker: 'uMINT', name: 'UBS uMINT', issuer: 'UBS', type: 'USD MMF', yield: 3.72 },
  { ticker: 'JTRSY', name: 'Janus Henderson JTRSY', issuer: 'Janus Henderson', type: 'Treasuries', yield: 3.65 },
  { ticker: 'TBILL', name: 'OpenEden TBILL', issuer: 'OpenEden', type: 'Treasuries', yield: 3.80 },
];

function formatAUM(n) {
  if (n == null || isNaN(n)) return 'n.a.';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + Math.round(n).toLocaleString();
}

export default function Page() {
  const [protocols, setProtocols] = useState([]);
  const [status, setStatus] = useState('Loading');
  const [lastUpdate, setLastUpdate] = useState('—');

  async function load() {
    setStatus('Refreshing…');
    try {
      const res = await fetch('https://api.llama.fi/protocols');
      const data = await res.json();
      const rwa = (data || []).filter(p =>
        (p.category || '').toLowerCase().includes('rwa') ||
        (p.name || '').toLowerCase().match(/buidl|usyc|benji|usdy|ousg|wtgxx|ustb|umint|jtrsy|tbill|securitize|ondo|spiko|centrifuge/)
      );
      setProtocols(rwa);
      setStatus('Live');
    } catch (e) {
      setStatus('Fallback');
      setProtocols([]);
    }
    setLastUpdate(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong' }) + ' HKT');
  }

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => {
    return KNOWN_FUNDS.map(f => {
      const match = protocols.find(p =>
        (p.name || '').toLowerCase().includes(f.ticker.toLowerCase()) ||
        (p.symbol || '').toLowerCase().includes(f.ticker.toLowerCase())
      );
      return {
        ...f,
        aum: match?.tvl || match?.chainTvls?.['Ethereum'] || null,
        change1d: match?.change_1d ?? null,
        change7d: match?.change_7d ?? null,
        chains: match?.chains?.length || 0,
      };
    }).sort((a, b) => (b.aum || 0) - (a.aum || 0));
  }, [protocols]);

  const totalAUM = enriched.reduce((s, f) => s + (f.aum || 0), 0);
  const avgYield = enriched.reduce((s, f) => s + f.yield, 0) / enriched.length;

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
        <h2 style={{ fontSize: 20, fontWeight: 560, marginBottom: 4 }}>Tokenized funds</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Major USD liquidity and treasury products. AUM from DefiLlama where matched; yields from issuer factsheets. Sorted by matched AUM.</p>
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

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 560, marginBottom: 4 }}>Market notes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Coverage</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Spans US-domiciled MMFs (BUIDL, BENJI, WTGXX), Bermuda/Cayman products (USYC), Singapore VCC (uMINT), and yield notes (USDY). Booking centres and settlement rails differ by issuer.</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>On-chain activity</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>AUM and chain counts pulled from DefiLlama protocols endpoint. DeFi TVL utilization varies widely — many funds remain primarily transfer-agent held rather than deposited into lending markets.</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Yield</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Official 7-day yields shown where published. Products that accumulate (uMINT, USDY) are not directly comparable on NAV to rebasing $1 funds (BUIDL, BENJI).</p>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 0 40px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        <p>For information only. Not an offer or recommendation. Data from DefiLlama public API and issuer factsheets. Figures are not independently audited. Last refresh: {lastUpdate}.</p>
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Title,
  Text,
  Metric,
  Flex,
  Grid,
  Badge,
  BarChart,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@tremor/react';

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
  const [sofr, setSofr] = useState(null);
  const [status, setStatus] = useState('Loading');
  const [lastUpdate, setLastUpdate] = useState('—');

  async function load() {
    setStatus('Refreshing…');
    try {
      const [yRes, nRes, pRes, sRes] = await Promise.all([
        fetch('/api/yields'),
        fetch('/api/news'),
        fetch('https://api.llama.fi/protocols'),
        fetch('/api/sofr'),
      ]);
      const yData = await yRes.json();
      const nData = await nRes.json();
      const pData = await pRes.json();
      const sData = await sRes.json();

      setFunds(yData.funds || []);
      setNews(nData.items || []);
      setSofr(sData.rate);

      const rwa = (pData || []).filter((p) =>
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

  useEffect(() => {
    load();
  }, []);

  const enriched = useMemo(() => {
    return funds
      .map((f) => {
        const match = protocols.find(
          (p) =>
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
      })
      .sort((a, b) => (b.aum || 0) - (a.aum || 0));
  }, [funds, protocols]);

  const totalAUM = enriched.reduce((s, f) => s + (f.aum || 0), 0);
  const avgYield = enriched.length ? enriched.reduce((s, f) => s + f.yield, 0) / enriched.length : 0;
  const positive1d = enriched.filter((f) => f.change1d > 0).length;
  const avgChains = enriched.length
    ? (enriched.reduce((s, f) => s + (f.chains || 0), 0) / enriched.length).toFixed(1)
    : 0;
  const topFund = enriched[0];
  const highestYield = [...enriched].sort((a, b) => b.yield - a.yield)[0];

  const issuerShare = useMemo(() => {
    const byIssuer = {};
    enriched.forEach((f) => {
      const key = f.issuer || 'Other';
      byIssuer[key] = (byIssuer[key] || 0) + (f.aum || 0);
    });
    return Object.entries(byIssuer)
      .map(([issuer, aum]) => ({
        issuer,
        aum,
        share: totalAUM > 0 ? (aum / totalAUM) * 100 : 0,
      }))
      .sort((a, b) => b.aum - a.aum);
  }, [enriched, totalAUM]);

  const signals = useMemo(() => {
    const out = [];
    if (sofr != null) {
      const above = enriched.filter((f) => f.yield > sofr);
      out.push({
        label: 'Yield vs SOFR',
        value: above.length + ' of ' + enriched.length + ' above SOFR',
        tone: above.length >= enriched.length / 2 ? 'emerald' : 'amber',
      });
    }
    if (positive1d > 0) {
      out.push({
        label: 'Flow signal',
        value: positive1d + ' funds with positive 1d AUM change',
        tone: 'emerald',
      });
    }
    if (topFund && topFund.aum) {
      out.push({
        label: 'Concentration',
        value: topFund.ticker + ' is largest by matched AUM',
        tone: 'orange',
      });
    }
    return out;
  }, [enriched, sofr, positive1d, topFund]);

  const chartData = enriched.slice(0, 8).map((f) => ({
    name: f.ticker,
    Yield: f.yield,
    SOFR: sofr || 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Flex justifyContent="between" alignItems="end" className="mb-6">
        <div>
          <Text className="text-amber-400 uppercase tracking-widest text-xs">Tokenized funds · Global markets</Text>
          <Title className="text-3xl font-semibold mt-1">RWA Pulse</Title>
          <Text className="text-gray-400 mt-1">Live dashboard of tokenized money-market, treasury and yield products</Text>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Refresh
          </button>
          <Text className="text-gray-400 text-sm">{status}</Text>
        </div>
      </Flex>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
        <Card decoration="top" decorationColor="orange">
          <Text>Tracked AUM</Text>
          <Metric>{formatAUM(totalAUM)}</Metric>
          <Text className="text-gray-400">matched protocols</Text>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Avg 7-day yield</Text>
          <Metric>{avgYield.toFixed(2)}%</Metric>
          <Text className="text-gray-400">known funds</Text>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>SOFR</Text>
          <Metric>{sofr != null ? sofr.toFixed(2) + '%' : 'n.a.'}</Metric>
          <Text className="text-gray-400">NY Fed latest</Text>
        </Card>
        <Card decoration="top" decorationColor="violet">
          <Text>Avg yield vs SOFR</Text>
          <Metric>{sofr != null ? (avgYield - sofr).toFixed(2) + ' pp' : 'n.a.'}</Metric>
          <Text className="text-gray-400">spread</Text>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Positive 1d</Text>
          <Metric>{positive1d}/{enriched.length}</Metric>
          <Text className="text-gray-400">funds up</Text>
        </Card>
        <Card decoration="top" decorationColor="rose">
          <Text>Avg chains</Text>
          <Metric>{avgChains}</Metric>
          <Text className="text-gray-400">per fund</Text>
        </Card>
        <Card decoration="top" decorationColor="orange">
          <Text>Largest by AUM</Text>
          <Metric>{topFund?.ticker || '—'}</Metric>
          <Text className="text-gray-400">{topFund ? formatAUM(topFund.aum) : ''}</Text>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Highest yield</Text>
          <Metric>{highestYield ? highestYield.yield.toFixed(2) + '%' : '—'}</Metric>
          <Text className="text-gray-400">{highestYield?.ticker || ''}</Text>
        </Card>
      </Grid>

      {signals.length > 0 && (
        <Card className="mb-6">
          <Title>Signals</Title>
          <div className="mt-3 flex flex-wrap gap-2">
            {signals.map((s, i) => (
              <Badge key={i} color={s.tone}>{s.label}: {s.value}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Grid numItemsLg={2} className="gap-4 mb-6">
        <Card>
          <Title>Yield vs SOFR</Title>
          <BarChart
            className="mt-4 h-56"
            data={chartData}
            index="name"
            categories={["Yield", "SOFR"]}
            colors={["orange", "gray"]}
            yAxisWidth={40}
            showAnimation
          />
        </Card>
        <Card>
          <Title>Market share by issuer</Title>
          <div className="mt-4 space-y-2">
            {issuerShare.slice(0, 6).map((i) => (
              <div key={i.issuer} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate max-w-[180px]">{i.issuer}</span>
                <span className="font-medium">{i.share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Title className="mb-3">Daily Digest</Title>
      <Text className="text-gray-400 text-sm mb-3">Refreshed on a daily cadence from scheduled source</Text>
      <Grid numItemsSm={1} numItemsLg={2} className="gap-4 mb-8">
        {news.map((item, i) => (
          <Card key={i}>
            <Flex justifyContent="between" alignItems="start">
              <Title className="text-base">{item.title}</Title>
              <Badge color="amber">{item.date}</Badge>
            </Flex>
            <Text className="text-gray-400 text-xs mt-1">{item.source}</Text>
            <Text className="mt-2">{item.summary}</Text>
            <Text className="mt-3 text-emerald-400 text-sm"><strong>Implication.</strong> {item.implication}</Text>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 underline"
              >
                View source →
              </a>
            )}
          </Card>
        ))}
      </Grid>

      <Title className="mb-3">Tokenized funds</Title>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Fund</TableHeaderCell>
              <TableHeaderCell>Issuer</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>7d yield</TableHeaderCell>
              <TableHeaderCell>vs SOFR</TableHeaderCell>
              <TableHeaderCell>AUM</TableHeaderCell>
              <TableHeaderCell>Share</TableHeaderCell>
              <TableHeaderCell>1d</TableHeaderCell>
              <TableHeaderCell>7d</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enriched.map((f) => {
              const spread = sofr != null ? f.yield - sofr : null;
              const share = totalAUM > 0 && f.aum ? (f.aum / totalAUM) * 100 : null;
              return (
                <TableRow key={f.ticker}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-gray-400">{f.issuer}</TableCell>
                  <TableCell><Badge color="orange">{f.type}</Badge></TableCell>
                  <TableCell className="font-medium">{f.yield.toFixed(2)}%</TableCell>
                  <TableCell className={spread != null && spread >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {spread != null ? (spread >= 0 ? '+' : '') + spread.toFixed(2) + ' pp' : 'n.a.'}
                  </TableCell>
                  <TableCell>{formatAUM(f.aum)}</TableCell>
                  <TableCell>{share != null ? share.toFixed(1) + '%' : '—'}</TableCell>
                  <TableCell className={f.change1d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {f.change1d != null ? (f.change1d >= 0 ? '+' : '') + f.change1d.toFixed(1) + '%' : 'n.a.'}
                  </TableCell>
                  <TableCell className={f.change7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {f.change7d != null ? (f.change7d >= 0 ? '+' : '') + f.change7d.toFixed(1) + '%' : 'n.a.'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Text className="mt-8 text-gray-500 text-xs">
        For information only. Not an offer or recommendation. AUM and changes from DefiLlama free API. SOFR from NY Fed Markets Data API. Yields and Daily Digest from scheduled source files. Figures are not independently audited. Last refresh: {lastUpdate}.
      </Text>
    </div>
  );
}

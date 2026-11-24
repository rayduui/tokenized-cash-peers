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
  const [status, setStatus] = useState('Loading');
  const [lastUpdate, setLastUpdate] = useState('—');

  async function load() {
    setStatus('Refreshing…');
    try {
      const [yRes, nRes, pRes] = await Promise.all([
        fetch('/api/yields'),
        fetch('/api/news'),
        fetch('https://api.llama.fi/protocols'),
      ]);
      const yData = await yRes.json();
      const nData = await nRes.json();
      const pData = await pRes.json();

      setFunds(yData.funds || []);
      setNews(nData.items || []);

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

  const chartData = enriched.slice(0, 8).map((f) => ({
    name: f.ticker,
    Yield: f.yield,
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
          <Text>Funds tracked</Text>
          <Metric>{enriched.length}</Metric>
          <Text className="text-gray-400">issuers</Text>
        </Card>
        <Card decoration="top" decorationColor="violet">
          <Text>RWA protocols</Text>
          <Metric>{protocols.length}</Metric>
          <Text className="text-gray-400">DefiLlama</Text>
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

      <Card className="mb-6">
        <Title>Yield snapshot</Title>
        <BarChart
          className="mt-4 h-56"
          data={chartData}
          index="name"
          categories={["Yield"]}
          colors={["orange"]}
          yAxisWidth={40}
          showAnimation
        />
      </Card>

      <Title className="mb-3">Developments</Title>
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
              <TableHeaderCell>AUM</TableHeaderCell>
              <TableHeaderCell>1d</TableHeaderCell>
              <TableHeaderCell>7d</TableHeaderCell>
              <TableHeaderCell>Chains</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enriched.map((f) => (
              <TableRow key={f.ticker}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell className="text-gray-400">{f.issuer}</TableCell>
                <TableCell><Badge color="orange">{f.type}</Badge></TableCell>
                <TableCell className="font-medium">{f.yield.toFixed(2)}%</TableCell>
                <TableCell>{formatAUM(f.aum)}</TableCell>
                <TableCell className={f.change1d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {f.change1d != null ? (f.change1d >= 0 ? '+' : '') + f.change1d.toFixed(1) + '%' : 'n.a.'}
                </TableCell>
                <TableCell className={f.change7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {f.change7d != null ? (f.change7d >= 0 ? '+' : '') + f.change7d.toFixed(1) + '%' : 'n.a.'}
                </TableCell>
                <TableCell>{f.chains || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Text className="mt-8 text-gray-500 text-xs">
        For information only. Not an offer or recommendation. Data from DefiLlama public API and scheduled source files. Figures are not independently audited. Last refresh: {lastUpdate}.
      </Text>
    </div>
  );
}

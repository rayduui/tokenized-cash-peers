import { NextResponse } from 'next/server';

export const revalidate = 1800;

export async function GET() {
  const key = process.env.RWA_API_KEY;
  if (!key) {
    return NextResponse.json({
      available: false,
      message: 'Set RWA_API_KEY in Vercel env to enable rwa.xyz data.',
      docs: 'https://docs.rwa.xyz/api/overview',
    });
  }

  try {
    const query = encodeURIComponent(JSON.stringify({
      fields: ['name', 'ticker', 'issuer_name', 'circulating_market_value_dollar', 'apy_7_day'],
      filter: {
        operator: 'equals',
        field: 'asset_class_name',
        value: 'Tokenized Treasuries',
      },
      sort: { field: 'circulating_market_value_dollar', direction: 'desc' },
      pagination: { page: 1, perPage: 20 },
    }));

    const res = await fetch(`https://api.rwa.xyz/v4/assets?query=${query}`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return NextResponse.json({ available: false, error: `rwa.xyz ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({ available: true, results: data.results || [] });
  } catch (e) {
    return NextResponse.json({ available: false, error: String(e) }, { status: 200 });
  }
}

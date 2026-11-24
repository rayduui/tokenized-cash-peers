import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch('https://markets.newyorkfed.org/api/rates/all/latest.json', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const sofr = data?.refRates?.find((r) => r.type === 'SOFR');
    return NextResponse.json({
      rate: sofr?.percentRate ?? null,
      date: sofr?.effectiveDate ?? null,
      source: 'NY Fed',
    });
  } catch (e) {
    return NextResponse.json({ rate: null, date: null, source: 'fallback' }, { status: 200 });
  }
}

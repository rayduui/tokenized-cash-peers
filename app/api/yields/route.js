import { NextResponse } from 'next/server';
import yields from '../../../data/yields.json';

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(yields);
}

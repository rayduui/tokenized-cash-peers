import { NextResponse } from 'next/server';
import news from '../../../data/news.json';

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(news);
}
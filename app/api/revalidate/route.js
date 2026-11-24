import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  revalidatePath('/');
  revalidatePath('/api/yields');
  revalidatePath('/api/news');
  return NextResponse.json({ revalidated: true, now: Date.now() });
}

import { NextResponse } from 'next/server';
import { getAllRestaurants } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(getAllRestaurants());
}

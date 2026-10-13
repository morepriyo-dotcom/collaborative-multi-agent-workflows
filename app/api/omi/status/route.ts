import { NextResponse } from 'next/server';
import { checkOmiConnection } from '@/lib/omi/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await checkOmiConnection();
  return NextResponse.json(status);
}

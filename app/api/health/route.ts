import { NextResponse } from 'next/server';
import { checkQdrantHealth } from '@/lib/qdrant/client';
import { checkLyzrHealth } from '@/lib/lyzr/client';
import { checkOmiConnection } from '@/lib/omi/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [qdrant, lyzr, omi] = await Promise.all([
      checkQdrantHealth(),
      checkLyzrHealth(),
      checkOmiConnection(),
    ]);

    return NextResponse.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      integrations: {
        qdrant,
        lyzr,
        omi,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err?.message || 'Failed to check system health' },
      { status: 500 }
    );
  }
}

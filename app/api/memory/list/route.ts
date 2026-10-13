import { NextResponse } from 'next/server';
import { getAllMemories, initVectorStore } from '@/lib/qdrant/vectorStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initVectorStore();
    const memories = await getAllMemories();
    return NextResponse.json({
      success: true,
      totalCount: memories.length,
      memories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list memories' },
      { status: 500 }
    );
  }
}

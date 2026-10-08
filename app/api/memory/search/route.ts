import { NextRequest, NextResponse } from 'next/server';
import { searchMemories, initVectorStore } from '@/lib/qdrant/vectorStore';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5, category } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query parameter is required' }, { status: 400 });
    }

    await initVectorStore();
    const results = await searchMemories(query, limit, category);

    return NextResponse.json({
      success: true,
      query,
      resultsCount: results.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Semantic search failed' },
      { status: 500 }
    );
  }
}

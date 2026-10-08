import { NextRequest, NextResponse } from 'next/server';
import { storeMemory, initVectorStore } from '@/lib/qdrant/vectorStore';

export async function POST(req: NextRequest) {
  try {
    const { content, category = 'system_learning', importance = 3, source = 'user_input', tags = [] } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    await initVectorStore();
    const stored = await storeMemory({
      content,
      category,
      importance,
      source,
      tags,
    });

    return NextResponse.json({
      success: true,
      memory: stored,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to store memory' },
      { status: 500 }
    );
  }
}

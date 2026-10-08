import { NextRequest, NextResponse } from 'next/server';
import { createInitialWorkflow, executeMultiAgentWorkflow } from '@/lib/lyzr/orchestrator';
import { initVectorStore } from '@/lib/qdrant/vectorStore';

export async function POST(req: NextRequest) {
  try {
    const { userInput, voiceSource = 'browser_dev' } = await req.json();

    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Voice transcript or text input is required' },
        { status: 400 }
      );
    }

    // Ensure Qdrant vector store is ready
    await initVectorStore();

    // Create workflow execution instance
    const initialWorkflow = createInitialWorkflow(userInput.trim(), voiceSource);

    // Execute multi-agent orchestration
    const completedWorkflow = await executeMultiAgentWorkflow(initialWorkflow);

    return NextResponse.json({
      success: completedWorkflow.status === 'completed',
      workflow: completedWorkflow,
    });
  } catch (err: any) {
    console.error('Workflow execution failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Workflow execution error' },
      { status: 500 }
    );
  }
}

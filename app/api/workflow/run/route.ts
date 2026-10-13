import { NextRequest, NextResponse } from 'next/server';
import { createInitialWorkflow, executeMultiAgentWorkflow } from '@/lib/lyzr/orchestrator';
import { initVectorStore } from '@/lib/qdrant/vectorStore';

export async function POST(req: NextRequest) {
  try {
    const {
      userInput,
      voiceSource = 'browser_dev',
      retryRole,
      existingWorkflow,
    } = await req.json();

    if (!userInput && !existingWorkflow) {
      return NextResponse.json(
        { success: false, error: 'Voice transcript or existing workflow is required' },
        { status: 400 }
      );
    }

    // Ensure Qdrant vector store is ready
    await initVectorStore();

    let completedWorkflow;
    if (retryRole && existingWorkflow) {
      const { retryWorkflowStage } = await import('@/lib/lyzr/orchestrator');
      completedWorkflow = await retryWorkflowStage(existingWorkflow, retryRole);
    } else {
      const initialWorkflow = createInitialWorkflow(userInput.trim(), voiceSource);
      completedWorkflow = await executeMultiAgentWorkflow(initialWorkflow);
    }

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

import { NextRequest } from 'next/server';
import { createInitialWorkflow, executeMultiAgentWorkflow, retryWorkflowStage } from '@/lib/lyzr/orchestrator';
import { initVectorStore } from '@/lib/qdrant/vectorStore';
import { AgentRole } from '@/types/agent';
import { WorkflowExecution } from '@/types/workflow';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userInput,
      voiceSource = 'browser_dev',
      retryRole,
      existingWorkflow,
    }: {
      userInput?: string;
      voiceSource?: 'omi' | 'browser_dev' | 'text_direct';
      retryRole?: AgentRole;
      existingWorkflow?: WorkflowExecution;
    } = body;

    if (!userInput && !existingWorkflow) {
      return new Response(JSON.stringify({ error: 'userInput or existingWorkflow is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure Qdrant vector store is ready
    await initVectorStore();

    // Prepare initial workflow
    let workflow: WorkflowExecution;
    if (retryRole && existingWorkflow) {
      workflow = existingWorkflow;
    } else {
      workflow = createInitialWorkflow(userInput!.trim(), voiceSource);
    }

    // Create SSE streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Controller might be closed if client disconnected
          }
        };

        // Send initial state immediately
        sendEvent('workflow_init', { workflow });

        try {
          let finalWorkflow: WorkflowExecution;

          if (retryRole && existingWorkflow) {
            finalWorkflow = await retryWorkflowStage(workflow, retryRole, {
              signal: req.signal,
              onProgress: (updated) => {
                sendEvent('workflow_progress', { workflow: updated });
              },
            });
          } else {
            finalWorkflow = await executeMultiAgentWorkflow(workflow, {
              signal: req.signal,
              onProgress: (updated) => {
                sendEvent('workflow_progress', { workflow: updated });
              },
            });
          }

          sendEvent('workflow_complete', { workflow: finalWorkflow });
        } catch (err: any) {
          sendEvent('workflow_error', { error: err?.message || 'Workflow execution failed' });
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
      cancel() {
        // Stream cancelled by client
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

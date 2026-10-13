import { PlannerAgentOutput, IntentAgentOutput, MemoryAgentOutput } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';
import { dynamicPlanSubtasks } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Planner Agent, a multi-agent DAG orchestration architect.
Given an Intent specification and Vector Memory context, generate an optimal dependency execution DAG.
Determine:
1. subtasks for specialized agents (research, memory, analysis, executor, critic, synthesizer).
2. which tasks run sequentially vs in parallel.
3. dependencies for each subtask.
4. overall orchestration rationale.

Output valid JSON matching this schema:
{
  "orchestrationStrategy": string,
  "executionPlan": [
    {
      "id": string,
      "title": string,
      "assignedAgent": "research" | "memory" | "analysis" | "executor" | "critic" | "synthesizer",
      "description": string,
      "dependencies": string[],
      "canRunInParallel": boolean,
      "priority": number
    }
  ],
  "parallelGroups": [["task_id1", "task_id2"]],
  "estimatedSteps": number,
  "rationale": string
}`;

export async function runPlannerAgent(
  intent: IntentAgentOutput,
  memoryContext: MemoryAgentOutput
): Promise<PlannerAgentOutput> {
  const userPrompt = `
Goal: ${intent.goal}
Domain: ${intent.domain}
Constraints: ${intent.constraints.join(', ')}
Required Deliverables: ${intent.required_outputs.join(', ')}
Retrieved Memories: ${memoryContext.relevantMemories.map((m) => m.content).join(' | ') || 'None'}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'planner',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (Array.isArray(parsed.executionPlan) && parsed.executionPlan.length >= 3) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PlannerAgent] LLM failed, using dynamic DAG planner:', err);
  }

  // Dynamic DAG plan tailored to the actual user intent and memory context
  return dynamicPlanSubtasks(intent, memoryContext);
}

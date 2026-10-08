import { PlannerAgentOutput, IntentAgentOutput, MemoryAgentOutput, PlannerSubtask } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';

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
Constraints: ${intent.constraints.join(', ')}
Retrieved Memories: ${memoryContext.relevantMemories.map((m) => m.content).join(' | ')}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (Array.isArray(parsed.executionPlan) && parsed.executionPlan.length >= 4) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PlannerAgent] LLM failed, using deterministic DAG plan:', err);
  }

  // Production-grade deterministic DAG plan
  const subtasks: PlannerSubtask[] = [
    {
      id: 'task_memory_sync',
      title: 'Contextual Vector Memory Retrieval',
      assignedAgent: 'memory',
      description: 'Search Qdrant for user project histories, past hackathon pitfalls, and architectural preferences.',
      dependencies: [],
      canRunInParallel: false,
      priority: 1,
    },
    {
      id: 'task_deep_research',
      title: 'Hackathon Track & Judging Criteria Research',
      assignedAgent: 'research',
      description: 'Analyze official evaluation weightings (60%+ working software), required tech stack constraints, and submission deadlines.',
      dependencies: ['task_memory_sync'],
      canRunInParallel: true,
      priority: 2,
    },
    {
      id: 'task_gap_analysis',
      title: 'Capability & Vulnerability Assessment',
      assignedAgent: 'analysis',
      description: 'Cross-reference user past experiences with required skills to pinpoint weak areas (e.g., demo timing control, visual observability).',
      dependencies: ['task_memory_sync'],
      canRunInParallel: true,
      priority: 2,
    },
    {
      id: 'task_plan_execution',
      title: 'Synthesize Prioritized Execution Plan',
      assignedAgent: 'executor',
      description: 'Transform research findings and memory insights into a structured P0/P1/P2 actionable roadmap with timeframes.',
      dependencies: ['task_deep_research', 'task_gap_analysis'],
      canRunInParallel: false,
      priority: 3,
    },
    {
      id: 'task_critic_verification',
      title: 'Rigorous Verification & Quality Audit',
      assignedAgent: 'critic',
      description: 'Audit plan against hackathon criteria, detect omissions (e.g. video script, solo limits, Lyzr/Qdrant integration check), and trigger revisions if needed.',
      dependencies: ['task_plan_execution'],
      canRunInParallel: false,
      priority: 4,
    },
    {
      id: 'task_final_consolidation',
      title: 'Consolidation & Memory Persistence',
      assignedAgent: 'synthesizer',
      description: 'Produce final executive deliverables and store new actionable insights back into Qdrant vector memory.',
      dependencies: ['task_critic_verification'],
      canRunInParallel: false,
      priority: 5,
    },
  ];

  return {
    orchestrationStrategy: 'Hybrid Parallel DAG with Critic Feedback Loop',
    executionPlan: subtasks,
    parallelGroups: [['task_deep_research', 'task_gap_analysis']],
    estimatedSteps: subtasks.length,
    rationale: 'Memory retrieval establishes foundational context first. Domain Research and Capability Analysis execute concurrently to minimize latency. The Executor combines both streams into a draft plan, which is strictly verified by the Critic before final synthesis and memory persistence.',
  };
}

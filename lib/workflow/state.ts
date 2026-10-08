import { AgentExecutionState, AgentRole } from '@/types/agent';
import { WorkflowExecution, WorkflowLogEntry } from '@/types/workflow';

export function createInitialAgentState(
  role: AgentRole,
  name: string,
  description: string,
  dependencies: string[]
): AgentExecutionState {
  return {
    id: `agent_${role}_${Date.now()}`,
    name,
    role,
    status: 'idle',
    description,
    dependencies,
    provider: 'lyzr',
  };
}

export function createInitialWorkflow(
  userInput: string,
  voiceSource: 'omi' | 'browser_dev' | 'text_direct' = 'browser_dev'
): WorkflowExecution {
  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const agents: Record<AgentRole, AgentExecutionState> = {
    intent: createInitialAgentState('intent', 'Intent Agent', 'Extracts structured goals, constraints, and priorities', []),
    memory: createInitialAgentState('memory', 'Memory Agent', 'Searches Qdrant vector store for historical context and pitfalls', ['intent']),
    planner: createInitialAgentState('planner', 'Planner Agent', 'Builds subtasks and coordinates parallel execution DAG', ['intent', 'memory']),
    research: createInitialAgentState('research', 'Research Agent', 'Analyzes hackathon rules, 60%+ scoring weights, and specs', ['planner']),
    analysis: createInitialAgentState('analysis', 'Analysis Agent', 'Evaluates vulnerabilities, skill gaps, and historical pitfalls', ['planner']),
    executor: createInitialAgentState('executor', 'Executor Agent', 'Synthesizes findings into prioritized P0/P1/P2 actionable phases', ['research', 'analysis']),
    critic: createInitialAgentState('critic', 'Critic Agent', 'Verifies compliance, detects omissions, and triggers revisions', ['executor']),
    synthesizer: createInitialAgentState('synthesizer', 'Final Synthesizer', 'Consolidates deliverables and stores new insights in Qdrant', ['critic']),
  };

  const initialLog: WorkflowLogEntry = {
    id: `log_init_${Date.now()}`,
    timestamp: now.toISOString(),
    timeFormatted: now.toLocaleTimeString(),
    stage: 'Input Ingested',
    message: `Received task via ${voiceSource === 'omi' ? 'Omi Wearable' : voiceSource === 'browser_dev' ? 'Browser Voice' : 'Direct Input'}: "${userInput.slice(0, 65)}..."`,
    type: 'info',
  };

  return {
    workflowId,
    status: 'idle',
    createdAt: now.toISOString(),
    userInput,
    voiceSource,
    agents,
    retrievedMemories: [],
    persistedMemories: [],
    eventLogs: [initialLog],
  };
}

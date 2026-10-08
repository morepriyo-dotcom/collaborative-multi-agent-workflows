import { createLyzrAgent } from './client';
import { AgentRole } from '@/types/agent';

export interface LyzrRegisteredAgent {
  role: AgentRole;
  agentId?: string;
  name: string;
  instructions: string;
}

export const LYZR_AGENT_DEFINITIONS: Record<AgentRole, { name: string; description: string; instructions: string }> = {
  intent: {
    name: 'FlowMesh-Intent-Analyst',
    description: 'Converts unstructured voice/text input into structured objectives, constraints, and priorities.',
    instructions: 'You are the Intent Analyst for FlowMesh. Deconstruct the user request into clear goals, constraints, and dependencies.',
  },
  memory: {
    name: 'FlowMesh-Qdrant-Context-Synthesizer',
    description: 'Retrieves relevant historical memories, preferences, and pitfalls from Qdrant vector storage.',
    instructions: 'You are the Memory Synthesizer. Correlate vector memory embeddings with current task objectives.',
  },
  planner: {
    name: 'FlowMesh-DAG-Orchestrator',
    description: 'Compiles task execution plans with sequential and parallel dependencies.',
    instructions: 'You are the Planner. Determine subtasks, identify parallel groups, and coordinate inter-agent handoffs.',
  },
  research: {
    name: 'FlowMesh-Domain-Researcher',
    description: 'Analyzes official hackathon rules, judging weights, and technical specifications.',
    instructions: 'You are the Research Specialist. Gather authoritative requirements, deliverables, and competitive tactics.',
  },
  analysis: {
    name: 'FlowMesh-Capability-Assessor',
    description: 'Pinpoints user weaknesses, risk vectors, and skill gaps to ensure project success.',
    instructions: 'You are the Capability Assessor. Analyze user historical pitfalls and propose risk mitigations.',
  },
  executor: {
    name: 'FlowMesh-Action-Planner',
    description: 'Transforms agent findings into a structured P0/P1/P2 phased roadmap.',
    instructions: 'You are the Executor. Draft concrete deliverables, checklists, and milestones.',
  },
  critic: {
    name: 'FlowMesh-Quality-Verifier',
    description: 'Rigorously audits execution plans against original constraints and issues revision directives.',
    instructions: 'You are the Critic. Detect gaps, enforce official rules, and trigger revisions when necessary.',
  },
  synthesizer: {
    name: 'FlowMesh-Final-Consolidator',
    description: 'Combines all validated agent outputs and generates new memory vectors for Qdrant.',
    instructions: 'You are the Synthesizer. Produce executive summaries and persist new learnings into Qdrant.',
  },
};

/**
 * Register agents in Lyzr Agent Studio if API key is provided
 */
export async function initializeLyzrAgents(): Promise<Record<string, string>> {
  const registeredIds: Record<string, string> = {};

  if (!process.env.LYZR_API_KEY || process.env.LYZR_API_KEY === 'your_lyzr_api_key_here') {
    return registeredIds;
  }

  for (const [role, def] of Object.entries(LYZR_AGENT_DEFINITIONS)) {
    try {
      const result = await createLyzrAgent({
        name: def.name,
        description: def.description,
        agent_role: role,
        agent_instructions: def.instructions,
      });

      if (result?.agent_id) {
        registeredIds[role] = result.agent_id;
      }
    } catch (err) {
      console.warn(`[LyzrFactory] Could not register agent for role ${role}:`, err);
    }
  }

  return registeredIds;
}

export type AgentRole =
  | 'intent'
  | 'planner'
  | 'research'
  | 'memory'
  | 'analysis'
  | 'executor'
  | 'critic'
  | 'synthesizer';

export type AgentStatus =
  | 'idle'
  | 'pending'
  | 'waiting'
  | 'running'
  | 'completed'
  | 'revising'
  | 'retrying'
  | 'failed'
  | 'cancelled';

export interface AgentExecutionState {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  description: string;
  input?: Record<string, any>;
  outputSummary?: string;
  detailedResult?: Record<string, any> | string;
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  dependencies: string[];
  error?: string;
  revisionCount?: number;
  modelUsed?: string;
  provider: 'lyzr' | 'gemini' | 'local_heuristic';
}

export interface IntentAgentOutput {
  goal: string;
  domain: string;
  constraints: string[];
  required_outputs: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  needs_research: boolean;
  needs_memory: boolean;
  needs_analysis: boolean;
  estimated_complexity: 'simple' | 'moderate' | 'complex' | 'extreme';
  actionable_summary: string;
}

export interface PlannerSubtask {
  id: string;
  title: string;
  assignedAgent: AgentRole;
  description: string;
  dependencies: string[];
  canRunInParallel: boolean;
  priority: number;
}

export interface PlannerAgentOutput {
  orchestrationStrategy: string;
  executionPlan: PlannerSubtask[];
  parallelGroups: string[][];
  estimatedSteps: number;
  rationale: string;
}

export interface ResearchAgentOutput {
  keyFindings: string[];
  requirementsBreakdown: string[];
  competitiveEdgeSuggestions: string[];
  suggestedTechPatterns: string[];
  sourceCitations?: string[];
}

export interface MemoryAgentOutput {
  retrievedCount: number;
  relevantMemories: Array<{
    id: string;
    content: string;
    category: string;
    importance: number;
    relevanceScore: number;
  }>;
  contextSummary: string;
  appliedInsights: string[];
}

export interface AnalysisAgentOutput {
  identifiedStrengths: string[];
  vulnerabilitiesAndWeakAreas: string[];
  riskMitigationStrategies: string[];
  skillGapActionItems: string[];
}

export interface ExecutorPlanPhase {
  phaseNumber: number;
  title: string;
  timeframe: string;
  priority: 'P0' | 'P1' | 'P2';
  checklist: string[];
  deliverables: string[];
}

export interface ExecutorAgentOutput {
  masterPlanTitle: string;
  executiveSummary: string;
  phases: ExecutorPlanPhase[];
  keyMilestones: string[];
  actionableChecklist: Array<{
    id: string;
    task: string;
    priority: 'high' | 'medium' | 'low';
    agentSource: string;
    done: boolean;
  }>;
}

export interface CriticReviewCritique {
  area: string;
  severity: 'minor' | 'moderate' | 'critical';
  issue: string;
  suggestedRevision: string;
}

export interface CriticAgentOutput {
  reviewStatus: 'APPROVED' | 'REVISION_REQUIRED';
  score: number; // 0 to 100
  strengths: string[];
  missingElements: string[];
  contradictionsDetected: string[];
  critiques: CriticReviewCritique[];
  decisionRationale: string;
  revisionDirectives?: string[];
}

export interface SynthesizerAgentOutput {
  finalTitle: string;
  consolidatedPlan: string;
  decisionsMade: string[];
  completedTasks: string[];
  pendingOrActionableItems: string[];
  newMemoriesToPersist: Array<{
    content: string;
    category: string;
    importance: number;
    tags: string[];
  }>;
}

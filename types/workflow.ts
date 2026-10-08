import { AgentExecutionState, AgentRole } from './agent';
import { MemoryItem } from './memory';

export type WorkflowStatus =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'analyzing_intent'
  | 'retrieving_memory'
  | 'planning'
  | 'executing_agents'
  | 'critic_reviewing'
  | 'revising'
  | 'synthesizing'
  | 'storing_memory'
  | 'completed'
  | 'paused'
  | 'failed'
  | 'cancelled';

export interface WorkflowLogEntry {
  id: string;
  timestamp: string;
  timeFormatted: string;
  stage: string;
  agentRole?: AgentRole;
  agentName?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critic';
  payload?: any;
}

export interface WorkflowExecution {
  workflowId: string;
  status: WorkflowStatus;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  userInput: string;
  voiceSource: 'omi' | 'browser_dev' | 'text_direct';
  agents: Record<AgentRole, AgentExecutionState>;
  retrievedMemories: MemoryItem[];
  persistedMemories: MemoryItem[];
  eventLogs: WorkflowLogEntry[];
  finalResult?: {
    title: string;
    executiveSummary: string;
    phases: any[];
    actionableChecklist: any[];
    criticAuditScore: number;
    criticStatus: string;
    revisionPerformed: boolean;
  };
  pausedAtStage?: string;
  error?: string;
}

export interface HumanActionRequest {
  type: 'pause' | 'resume' | 'cancel' | 'retry_agent' | 'approve_revision' | 'approve_memory_store';
  agentRole?: AgentRole;
}

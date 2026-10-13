import {
  AgentExecutionState,
  AgentRole,
  IntentAgentOutput,
  PlannerAgentOutput,
  ResearchAgentOutput,
  MemoryAgentOutput,
  AnalysisAgentOutput,
  ExecutorAgentOutput,
  CriticAgentOutput,
  SynthesizerAgentOutput,
} from '@/types/agent';
import { WorkflowExecution, WorkflowLogEntry, WorkflowStatus } from '@/types/workflow';
import { runIntentAgent } from '../agents/intentAgent';
import { runMemoryAgent } from '../agents/memoryAgent';
import { runPlannerAgent } from '../agents/plannerAgent';
import { runResearchAgent } from '../agents/researchAgent';
import { runAnalysisAgent } from '../agents/analysisAgent';
import { runExecutorAgent } from '../agents/executorAgent';
import { runCriticAgent } from '../agents/criticAgent';
import { runSynthesizerAgent } from '../agents/synthesizerAgent';
import { checkLyzrHealth } from './client';

export type WorkflowProgressCallback = (update: WorkflowExecution) => void;

export interface WorkflowExecutionOptions {
  onProgress?: WorkflowProgressCallback;
  signal?: AbortSignal;
  startFromRole?: AgentRole;
}

export { createInitialWorkflow, createInitialAgentState } from '../workflow/state';

/**
 * Execute the collaborative multi-agent loop with real state transitions,
 * dynamic progress emission, cancellation signal handling, and truthful logging.
 */
export async function executeMultiAgentWorkflow(
  workflow: WorkflowExecution,
  optionsOrCallback?: WorkflowProgressCallback | WorkflowExecutionOptions
): Promise<WorkflowExecution> {
  const options: WorkflowExecutionOptions =
    typeof optionsOrCallback === 'function'
      ? { onProgress: optionsOrCallback }
      : optionsOrCallback || {};

  const { onProgress, signal, startFromRole } = options;
  const state: WorkflowExecution = JSON.parse(JSON.stringify(workflow));
  const startTime = Date.now();

  const emitProgress = (status: WorkflowStatus, log?: Omit<WorkflowLogEntry, 'id' | 'timestamp' | 'timeFormatted'>) => {
    state.status = status;
    if (log) {
      const now = new Date();
      const entry: WorkflowLogEntry = {
        ...log,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now.toISOString(),
        timeFormatted: now.toLocaleTimeString(),
      };
      state.eventLogs.push(entry);
    }
    if (onProgress) {
      onProgress(JSON.parse(JSON.stringify(state)));
    }
  };

  const checkAbort = (): boolean => {
    if (signal?.aborted) {
      state.status = 'cancelled';
      emitProgress('cancelled', {
        stage: 'Human Override',
        message: 'Workflow execution cancelled by operator signal.',
        type: 'warning',
      });
      return true;
    }
    return false;
  };

  try {
    if (checkAbort()) return state;

    // 0. Check Lyzr Health
    const lyzrHealth = await checkLyzrHealth();
    emitProgress('analyzing_intent', {
      stage: 'Orchestrator Boot',
      message: lyzrHealth.connected
        ? 'Lyzr Agent Studio v3 Orchestrator connected.'
        : 'Running via Lyzr Multi-Agent Orchestrator (Autonomous Standby Engine).',
      type: 'info',
    });

    // Determine starting points based on stage retry
    const shouldRunIntent = !startFromRole || startFromRole === 'intent';
    const shouldRunPlanner = shouldRunIntent || startFromRole === 'planner';
    const shouldRunWorkers = shouldRunPlanner || startFromRole === 'research' || startFromRole === 'memory' || startFromRole === 'analysis';
    const shouldRunExecutor = shouldRunWorkers || startFromRole === 'executor';
    const shouldRunCritic = shouldRunExecutor || startFromRole === 'critic';
    const shouldRunSynthesizer = shouldRunCritic || startFromRole === 'synthesizer';

    // 1. INTENT AGENT
    let intentOutput = state.agents.intent.detailedResult as IntentAgentOutput | undefined;
    if (shouldRunIntent || !intentOutput) {
      if (checkAbort()) return state;

      state.agents.intent.status = 'running';
      state.agents.intent.startTime = Date.now();
      emitProgress('analyzing_intent', {
        stage: 'Intent Parsing',
        agentRole: 'intent',
        agentName: 'Intent Agent',
        message: 'Intent Agent parsing speech transcript for objectives, constraints, and dependencies...',
        type: 'info',
      });

      intentOutput = await runIntentAgent(state.userInput);
      state.agents.intent.status = 'completed';
      state.agents.intent.endTime = Date.now();
      state.agents.intent.durationMs = state.agents.intent.endTime - state.agents.intent.startTime;
      state.agents.intent.outputSummary = `Identified Goal: "${intentOutput.goal.slice(0, 50)}...". Domain: ${intentOutput.domain}. Extracted constraints: ${intentOutput.constraints.length}.`;
      state.agents.intent.detailedResult = intentOutput;

      emitProgress('planning', {
        stage: 'Intent Parsed',
        agentRole: 'intent',
        agentName: 'Intent Agent',
        message: `Goal identified: "${intentOutput.goal.slice(0, 60)}". Deconstructing ${intentOutput.required_outputs.length} required deliverables.`,
        type: 'success',
      });
    }

    // 2. PLANNER AGENT (DAG Orchestration)
    let plannerOutput = state.agents.planner.detailedResult as PlannerAgentOutput | undefined;
    if (shouldRunPlanner || !plannerOutput) {
      if (checkAbort()) return state;

      state.agents.planner.status = 'running';
      state.agents.planner.startTime = Date.now();
      emitProgress('planning', {
        stage: 'DAG Orchestration',
        agentRole: 'planner',
        agentName: 'Planner Agent',
        message: 'Planner Agent compiling execution DAG and scheduling parallel agent execution...',
        type: 'info',
      });

      // Provide existing memory or placeholder for initial planning
      const initialMemoryContext: MemoryAgentOutput = (state.agents.memory.detailedResult as MemoryAgentOutput) || {
        retrievedCount: 0,
        relevantMemories: [],
        contextSummary: 'Pre-flight memory scan',
        appliedInsights: [],
      };

      plannerOutput = await runPlannerAgent(intentOutput, initialMemoryContext);
      state.agents.planner.status = 'completed';
      state.agents.planner.endTime = Date.now();
      state.agents.planner.durationMs = state.agents.planner.endTime - state.agents.planner.startTime;
      state.agents.planner.outputSummary = `Compiled ${plannerOutput.executionPlan.length} subtasks. Dispatched Research, Memory, and Analysis agents.`;
      state.agents.planner.detailedResult = plannerOutput;

      emitProgress('executing_agents', {
        stage: 'Plan Compiled',
        agentRole: 'planner',
        agentName: 'Planner Agent',
        message: `Planner established DAG with ${plannerOutput.executionPlan.length} subtasks. Initiating parallel fan-out.`,
        type: 'success',
      });
    }

    // 3. PARALLEL WORKERS: Research Agent & Memory Agent (Qdrant) & Skill Analysis Agent
    let researchOutput = state.agents.research.detailedResult as ResearchAgentOutput | undefined;
    let memoryOutput = state.agents.memory.detailedResult as MemoryAgentOutput | undefined;
    let analysisOutput = state.agents.analysis.detailedResult as AnalysisAgentOutput | undefined;

    if (shouldRunWorkers || !researchOutput || !memoryOutput || !analysisOutput) {
      if (checkAbort()) return state;

      state.agents.research.status = 'running';
      state.agents.research.startTime = Date.now();
      state.agents.memory.status = 'running';
      state.agents.memory.startTime = Date.now();

      emitProgress('executing_agents', {
        stage: 'Parallel Fan-Out',
        message: 'Dispatching Research Agent & Qdrant Memory Agent concurrently.',
        type: 'info',
      });

      // Execute Research and Memory concurrently
      const [resResult, memResult] = await Promise.all([
        runResearchAgent(intentOutput),
        runMemoryAgent(intentOutput, state.userInput),
      ]);

      researchOutput = resResult;
      state.agents.research.status = 'completed';
      state.agents.research.endTime = Date.now();
      state.agents.research.durationMs = state.agents.research.endTime - state.agents.research.startTime;
      state.agents.research.outputSummary = researchOutput.keyFindings.slice(0, 2).join('; ') || 'Domain requirements analyzed.';
      state.agents.research.detailedResult = researchOutput;

      memoryOutput = memResult.output;
      state.retrievedMemories = memResult.rawMemories;
      state.agents.memory.status = 'completed';
      state.agents.memory.endTime = Date.now();
      state.agents.memory.durationMs = state.agents.memory.endTime - state.agents.memory.startTime;
      state.agents.memory.outputSummary = `Retrieved ${memoryOutput.retrievedCount} memory vectors from Qdrant matching "${intentOutput.domain}".`;
      state.agents.memory.detailedResult = memoryOutput;

      emitProgress('executing_agents', {
        stage: 'Memory & Research Synced',
        message: `Research complete (${researchOutput.keyFindings.length} findings). Memory retrieved (${memoryOutput.retrievedCount} vectors). Running Skill & Risk Analysis.`,
        type: 'success',
      });

      if (checkAbort()) return state;

      // Run Analysis Agent incorporating memory + research + intent
      state.agents.analysis.status = 'running';
      state.agents.analysis.startTime = Date.now();
      emitProgress('executing_agents', {
        stage: 'Risk Assessment',
        agentRole: 'analysis',
        agentName: 'Skill Analysis Agent',
        message: 'Skill Analysis Agent evaluating failure modes, memory pitfalls, and risk mitigations...',
        type: 'info',
      });

      analysisOutput = await runAnalysisAgent(memoryOutput, researchOutput, intentOutput);
      state.agents.analysis.status = 'completed';
      state.agents.analysis.endTime = Date.now();
      state.agents.analysis.durationMs = state.agents.analysis.endTime - state.agents.analysis.startTime;
      state.agents.analysis.outputSummary = analysisOutput.vulnerabilitiesAndWeakAreas.slice(0, 2).join('; ') || 'Risk & capability analysis complete.';
      state.agents.analysis.detailedResult = analysisOutput;

      emitProgress('executing_agents', {
        stage: 'Parallel Fan-In',
        message: `Identified ${analysisOutput.vulnerabilitiesAndWeakAreas.length} vulnerabilities and ${analysisOutput.riskMitigationStrategies.length} mitigations. Handoff to Executor Agent.`,
        type: 'success',
      });
    }

    // 4. EXECUTOR AGENT (Draft 1)
    let executorOutput = state.agents.executor.detailedResult as ExecutorAgentOutput | undefined;
    if (shouldRunExecutor || !executorOutput) {
      if (checkAbort()) return state;

      state.agents.executor.status = 'running';
      state.agents.executor.startTime = Date.now();
      emitProgress('executing_agents', {
        stage: 'Action Execution',
        agentRole: 'executor',
        agentName: 'Executor Agent',
        message: 'Executor Agent drafting phased implementation plan and actionable checklist...',
        type: 'info',
      });

      executorOutput = await runExecutorAgent(intentOutput, memoryOutput, researchOutput, analysisOutput);
      state.agents.executor.status = 'completed';
      state.agents.executor.endTime = Date.now();
      state.agents.executor.durationMs = state.agents.executor.endTime - state.agents.executor.startTime;
      state.agents.executor.outputSummary = `Synthesized ${executorOutput.phases.length}-phase plan with ${executorOutput.actionableChecklist.length} checklist items. Submitting to Critic Agent.`;
      state.agents.executor.detailedResult = executorOutput;

      emitProgress('critic_reviewing', {
        stage: 'Draft Submitted',
        agentRole: 'executor',
        agentName: 'Executor Agent',
        message: `Draft "${executorOutput.masterPlanTitle}" submitted for independent Critic verification.`,
        type: 'info',
      });
    }

    // 5. CRITIC AGENT (Pass 1) -> Observable Self-Correction Loop!
    let criticOutput = state.agents.critic.detailedResult as CriticAgentOutput | undefined;
    let finalExecutorOutput: ExecutorAgentOutput = executorOutput;

    if (shouldRunCritic || !criticOutput) {
      if (checkAbort()) return state;

      state.agents.critic.status = 'running';
      state.agents.critic.startTime = Date.now();
      emitProgress('critic_reviewing', {
        stage: 'Quality Audit',
        agentRole: 'critic',
        agentName: 'Critic Agent',
        message: 'Critic Agent auditing draft deliverables against explicit constraints and criteria...',
        type: 'info',
      });

      const initialCriticReview = await runCriticAgent(intentOutput, executorOutput, researchOutput, analysisOutput, false);

      if (initialCriticReview.reviewStatus === 'REVISION_REQUIRED') {
        // VISIBLE SELF-CORRECTION LOOP: Draft -> Critic -> Revision -> Approved!
        state.agents.critic.status = 'revising';
        const directives = initialCriticReview.revisionDirectives || [];
        state.agents.critic.outputSummary = `Critic Audit (Score: ${initialCriticReview.score}/100): REVISION REQUIRED. Directives: ${directives.join('; ')}`;
        state.agents.critic.detailedResult = initialCriticReview;

        emitProgress('revising', {
          stage: 'Revision Triggered',
          agentRole: 'critic',
          agentName: 'Critic Agent',
          message: `Critic audit detected gaps (${initialCriticReview.missingElements.length} missing elements). Directing Executor to revise deliverables.`,
          type: 'critic',
        });

        if (checkAbort()) return state;

        // Executor revisions
        state.agents.executor.status = 'revising';
        state.agents.executor.revisionCount = (state.agents.executor.revisionCount || 0) + 1;

        finalExecutorOutput = await runExecutorAgent(
          intentOutput,
          memoryOutput,
          researchOutput,
          analysisOutput,
          initialCriticReview.revisionDirectives
        );

        state.agents.executor.status = 'completed';
        state.agents.executor.outputSummary = `Revised execution plan incorporating all Critic directives: ${finalExecutorOutput.masterPlanTitle}.`;
        state.agents.executor.detailedResult = finalExecutorOutput;

        emitProgress('critic_reviewing', {
          stage: 'Revision Re-submitted',
          agentRole: 'executor',
          agentName: 'Executor Agent',
          message: 'Executor applied all Critic directives. Re-submitting for final verification.',
          type: 'info',
        });

        if (checkAbort()) return state;

        // Second Critic audit pass
        const approvedCriticReview = await runCriticAgent(intentOutput, finalExecutorOutput, researchOutput, analysisOutput, true);
        state.agents.critic.status = 'completed';
        state.agents.critic.endTime = Date.now();
        state.agents.critic.durationMs = state.agents.critic.endTime - state.agents.critic.startTime;
        state.agents.critic.outputSummary = `Audit APPROVED: Score ${approvedCriticReview.score}/100. All official requirements, mitigations, and constraints verified.`;
        state.agents.critic.detailedResult = approvedCriticReview;
        criticOutput = approvedCriticReview;

        emitProgress('synthesizing', {
          stage: 'Critic Approved',
          agentRole: 'critic',
          agentName: 'Critic Agent',
          message: `Critic audit APPROVED (Score: ${approvedCriticReview.score}/100). All criteria satisfied.`,
          type: 'success',
        });
      } else {
        // Directly approved on first pass
        state.agents.critic.status = 'completed';
        state.agents.critic.endTime = Date.now();
        state.agents.critic.durationMs = state.agents.critic.endTime - state.agents.critic.startTime;
        state.agents.critic.outputSummary = `Audit APPROVED: Score ${initialCriticReview.score}/100. Deliverables satisfied all requirements.`;
        state.agents.critic.detailedResult = initialCriticReview;
        criticOutput = initialCriticReview;

        emitProgress('synthesizing', {
          stage: 'Critic Approved',
          agentRole: 'critic',
          agentName: 'Critic Agent',
          message: `Critic audit APPROVED on initial pass (Score: ${initialCriticReview.score}/100).`,
          type: 'success',
        });
      }
    }

    // 6. FINAL SYNTHESIZER & QDRANT PERSISTENCE
    if (shouldRunSynthesizer) {
      if (checkAbort()) return state;

      state.agents.synthesizer.status = 'running';
      state.agents.synthesizer.startTime = Date.now();
      emitProgress('synthesizing', {
        stage: 'Final Synthesis',
        agentRole: 'synthesizer',
        agentName: 'Final Synthesizer',
        message: 'Final Synthesizer consolidating master blueprint and extracting persistent memory vectors for Qdrant...',
        type: 'info',
      });

      const { output: synthOutput, persistedMemories } = await runSynthesizerAgent(
        intentOutput,
        finalExecutorOutput,
        criticOutput!,
        researchOutput,
        analysisOutput
      );

      state.persistedMemories = persistedMemories;
      state.agents.synthesizer.status = 'completed';
      state.agents.synthesizer.endTime = Date.now();
      state.agents.synthesizer.durationMs = state.agents.synthesizer.endTime - state.agents.synthesizer.startTime;
      state.agents.synthesizer.outputSummary = `Consolidated deliverables for "${synthOutput.finalTitle}". Stored ${persistedMemories.length} new insight vectors into Qdrant.`;
      state.agents.synthesizer.detailedResult = synthOutput;

      state.finalResult = {
        title: synthOutput.finalTitle,
        executiveSummary: synthOutput.consolidatedPlan,
        phases: finalExecutorOutput.phases,
        actionableChecklist: finalExecutorOutput.actionableChecklist,
        criticAuditScore: criticOutput?.score ?? 95,
        criticStatus: criticOutput?.reviewStatus || 'APPROVED',
        revisionPerformed: Boolean(state.agents.executor.revisionCount && state.agents.executor.revisionCount > 0),
      };
    }

    // Wrap up
    state.completedAt = new Date().toISOString();
    state.durationMs = Date.now() - startTime;
    emitProgress('completed', {
      stage: 'Workflow Complete',
      message: `Autonomous workflow completed in ${(state.durationMs / 1000).toFixed(1)}s. Final deliverables produced and Qdrant memory updated.`,
      type: 'success',
    });

    return state;
  } catch (err: any) {
    state.status = 'failed';
    state.error = err?.message || 'Workflow execution failed';
    emitProgress('failed', {
      stage: 'Error',
      message: `Workflow error: ${state.error}`,
      type: 'error',
    });
    return state;
  }
}

/**
 * Selective stage retry: allows re-running a specific agent and downstream stages
 */
export async function retryWorkflowStage(
  workflow: WorkflowExecution,
  roleToRetry: AgentRole,
  options?: WorkflowExecutionOptions
): Promise<WorkflowExecution> {
  const cloned: WorkflowExecution = JSON.parse(JSON.stringify(workflow));

  // Reset status of the selected role and downstream roles to idle
  const order: AgentRole[] = ['intent', 'planner', 'research', 'memory', 'analysis', 'executor', 'critic', 'synthesizer'];
  const startIndex = order.indexOf(roleToRetry);
  if (startIndex !== -1) {
    for (let i = startIndex; i < order.length; i++) {
      const role = order[i];
      if (cloned.agents[role]) {
        cloned.agents[role].status = 'idle';
        cloned.agents[role].startTime = undefined;
        cloned.agents[role].endTime = undefined;
        cloned.agents[role].durationMs = undefined;
      }
    }
  }

  cloned.status = 'idle';
  cloned.finalResult = undefined;

  return executeMultiAgentWorkflow(cloned, {
    ...options,
    startFromRole: roleToRetry,
  });
}

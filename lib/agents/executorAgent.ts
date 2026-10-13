import {
  ExecutorAgentOutput,
  IntentAgentOutput,
  MemoryAgentOutput,
  ResearchAgentOutput,
  AnalysisAgentOutput,
} from '@/types/agent';
import { executeAgentLLM } from './llmRunner';
import { dynamicExecutePlan } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Executor Agent, responsible for transforming agent research, memory insights, and gap analyses into a production-grade actionable execution plan.
Incorporate any revision directives from the Critic Agent if provided.
Produce:
1. masterPlanTitle: String
2. executiveSummary: Comprehensive high-level executive summary tailored to the specific goal.
3. phases: Array of phases (phaseNumber, title, timeframe, priority, checklist, deliverables)
4. keyMilestones: Critical milestone strings
5. actionableChecklist: Array of objects { id, task, priority, agentSource, done }

Output JSON format matching the schema.`;

export async function runExecutorAgent(
  intent: IntentAgentOutput,
  memoryContext: MemoryAgentOutput,
  research: ResearchAgentOutput,
  analysis: AnalysisAgentOutput,
  revisionDirectives?: string[]
): Promise<ExecutorAgentOutput> {
  const isRevision = Boolean(revisionDirectives && revisionDirectives.length > 0);
  const userPrompt = `
Goal: ${intent.goal}
Domain: ${intent.domain}
Constraints: ${intent.constraints.join(', ')}
Research Highlights: ${research.keyFindings.slice(0, 3).join('; ')}
Vulnerabilities to address: ${analysis.vulnerabilitiesAndWeakAreas.join('; ')}
Mitigations: ${analysis.riskMitigationStrategies.join('; ')}
${isRevision ? `CRITIC REVISION DIRECTIVES TO RESOLVE: ${revisionDirectives!.join('; ')}` : ''}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'executor',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (parsed.masterPlanTitle && Array.isArray(parsed.phases)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ExecutorAgent] LLM failed, using dynamic executor roadmap:', err);
  }

  // Dynamic executor plan tailored to user intent, research findings, and memory
  return dynamicExecutePlan(intent, memoryContext, research, analysis, revisionDirectives);
}

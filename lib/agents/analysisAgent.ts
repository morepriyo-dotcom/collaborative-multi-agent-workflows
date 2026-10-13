import { AnalysisAgentOutput, MemoryAgentOutput, ResearchAgentOutput, IntentAgentOutput } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';
import { dynamicAnalyzeSkillsAndRisks } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Skill & Vulnerability Analysis Agent.
Analyze the user's historical context from memory against project requirements.
Pinpoint:
1. identifiedStrengths: Existing proficiencies from past projects or stated experience.
2. vulnerabilitiesAndWeakAreas: Critical failure points or historical weaknesses that could jeopardize success.
3. riskMitigationStrategies: Concrete steps to neutralize each vulnerability.
4. skillGapActionItems: High-priority immediate tasks.

Output JSON:
{
  "identifiedStrengths": string[],
  "vulnerabilitiesAndWeakAreas": string[],
  "riskMitigationStrategies": string[],
  "skillGapActionItems": string[]
}`;

export async function runAnalysisAgent(
  memoryContext: MemoryAgentOutput,
  researchFindings: ResearchAgentOutput,
  intent?: IntentAgentOutput
): Promise<AnalysisAgentOutput> {
  const userPrompt = `
Objective: ${intent ? intent.goal : 'Multi-Agent Project Delivery'}
Domain: ${intent ? intent.domain : 'Software Engineering'}
Memory Insights: ${memoryContext.appliedInsights.join(' | ') || 'None'}
Research Rules: ${researchFindings.keyFindings.join(' | ')}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'analysis',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (Array.isArray(parsed.vulnerabilitiesAndWeakAreas)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AnalysisAgent] LLM parsing failed, using dynamic risk reasoner:', err);
  }

  // Dynamic risk and vulnerability analysis tailored to the intent and memories
  const fallbackIntent: IntentAgentOutput = intent || {
    goal: 'Project execution and milestone delivery',
    domain: 'Software Engineering',
    constraints: [],
    required_outputs: [],
    priority: 'high',
    needs_research: true,
    needs_memory: true,
    needs_analysis: true,
    estimated_complexity: 'moderate',
    actionable_summary: 'Project execution',
  };

  return dynamicAnalyzeSkillsAndRisks(fallbackIntent, memoryContext, researchFindings);
}

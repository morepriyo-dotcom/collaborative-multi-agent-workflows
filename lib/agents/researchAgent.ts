import { ResearchAgentOutput, IntentAgentOutput } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';
import { dynamicExecuteResearch } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Research Agent, specialized in competitive analysis, domain requirement deconstruction, and technical architecture vetting.
Provide:
1. keyFindings: Core factual requirements and constraints specific to the user's objective.
2. requirementsBreakdown: Concrete checklist of deliverables needed.
3. competitiveEdgeSuggestions: What elevates the output above generic AI advice.
4. suggestedTechPatterns: Technical design patterns for the selected track or domain.
5. sourceCitations: Official reference citations or design frameworks.

Output JSON format:
{
  "keyFindings": string[],
  "requirementsBreakdown": string[],
  "competitiveEdgeSuggestions": string[],
  "suggestedTechPatterns": string[],
  "sourceCitations": string[]
}`;

export async function runResearchAgent(intent: IntentAgentOutput): Promise<ResearchAgentOutput> {
  const userPrompt = `
Analyze the requirements and domain for:
Goal: ${intent.goal}
Domain: ${intent.domain}
Constraints: ${intent.constraints.join(', ')}
Required Outputs: ${intent.required_outputs.join(', ')}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'research',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (Array.isArray(parsed.keyFindings) && Array.isArray(parsed.requirementsBreakdown)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ResearchAgent] LLM parsing failed, using dynamic research engine:', err);
  }

  // Dynamic research engine tailored to the actual request domain
  return dynamicExecuteResearch(intent);
}

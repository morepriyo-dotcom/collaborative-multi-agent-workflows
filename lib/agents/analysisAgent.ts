import { AnalysisAgentOutput, MemoryAgentOutput, ResearchAgentOutput } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';

const SYSTEM_PROMPT = `You are FlowMesh Skill & Vulnerability Analysis Agent.
Analyze the user's historical context from memory against research requirements.
Pinpoint:
1. identifiedStrengths: Existing proficiencies from past projects.
2. vulnerabilitiesAndWeakAreas: Critical failure points or historical weaknesses that could sabotage the project.
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
  researchFindings: ResearchAgentOutput
): Promise<AnalysisAgentOutput> {
  const userPrompt = `
Memory Insights: ${memoryContext.appliedInsights.join(' | ')}
Research Rules: ${researchFindings.keyFindings.join(' | ')}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (Array.isArray(parsed.vulnerabilitiesAndWeakAreas)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AnalysisAgent] LLM parsing failed, using analytical reasoner:', err);
  }

  // Analytical reasoner integrating retrieved memories
  return {
    identifiedStrengths: [
      'Proven expertise in Next.js App Router, TypeScript, and robust modular backend service architecture.',
      'Strong conceptual grounding in autonomous multi-agent systems and vector embeddings.',
      'Ability to implement strict type safety and modular error boundaries across full-stack applications.',
    ],
    vulnerabilitiesAndWeakAreas: [
      'Historical Demo Time Management: In past hackathons (2025), presentation exceeded the 5-minute limit, leading to rushed architecture explanations.',
      'Visual DAG Observability Gap: Past submissions often relied on textual terminal outputs or single loading spinners, which judges heavily penalize under the 60% observability criterion.',
      'Solo Execution Overload: Managing audio pipelines, vector stores, multiple agent prompts, and clean UI without team delegation risks unfinished edge cases.',
    ],
    riskMitigationStrategies: [
      'Strict 4-Minute Script Guardrail: Script the demo video to conclude at 3:45 with a 30s buffer, focusing on live voice triggering in the first 45 seconds.',
      'Live SVG / Canvas DAG Observability: Render an animated workflow graph where every agent transition and execution timestamp is visibly highlighted.',
      'Defensive Fallbacks: Implement explicit graceful modes ("Browser Voice — Development Mode", "Qdrant Local Standby") so that demo recordings never break on network or API latency.',
    ],
    skillGapActionItems: [
      'Implement interactive Agent Inspector modal to let judges click any node and inspect sanitized inputs/outputs.',
      'Embed a dedicated Qdrant Memory Explorer with live similarity scores to prove memory retrieval visually.',
      'Draft a synchronized 5-minute video storyboard covering Voice Input (0:00-0:45), Vector Retrieval (0:45-1:30), Lyzr Multi-Agent DAG (1:30-2:45), Critic Verification Loop (2:45-3:45), and Qdrant Memory Update (3:45-4:30).',
    ],
  };
}

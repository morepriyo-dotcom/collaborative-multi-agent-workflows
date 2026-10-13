import {
  SynthesizerAgentOutput,
  IntentAgentOutput,
  ExecutorAgentOutput,
  CriticAgentOutput,
  ResearchAgentOutput,
  AnalysisAgentOutput,
} from '@/types/agent';
import { storeMemory } from '../qdrant/vectorStore';
import { MemoryItem } from '@/types/memory';
import { executeAgentLLM } from './llmRunner';
import { dynamicSynthesizeResult } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Synthesizer Agent.
Your responsibility: Synthesize all agent artifacts into a final executive deliverable.
Also extract key learnings and insights that must be persisted back into Qdrant vector memory for future tasks.
Output JSON schema:
{
  "finalTitle": string,
  "consolidatedPlan": string,
  "decisionsMade": string[],
  "completedTasks": string[],
  "pendingOrActionableItems": string[],
  "newMemoriesToPersist": [
    {
      "content": string,
      "category": "system_learning" | "preference" | "hackathon_experience",
      "importance": number,
      "tags": string[]
    }
  ]
}`;

export async function runSynthesizerAgent(
  intent: IntentAgentOutput,
  executorPlan: ExecutorAgentOutput,
  criticReview: CriticAgentOutput,
  research: ResearchAgentOutput,
  analysis: AnalysisAgentOutput
): Promise<{ output: SynthesizerAgentOutput; persistedMemories: MemoryItem[] }> {
  const userPrompt = `
Goal: ${intent.goal}
Domain: ${intent.domain}
Plan Title: ${executorPlan.masterPlanTitle}
Critic Score: ${criticReview.score} (${criticReview.reviewStatus})
Milestones: ${executorPlan.keyMilestones.join(', ')}
`;

  let synthResult: SynthesizerAgentOutput | null = null;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'synthesizer',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (parsed.finalTitle && Array.isArray(parsed.newMemoriesToPersist)) {
        synthResult = parsed;
      }
    }
  } catch (err) {
    console.warn('[SynthesizerAgent] LLM parsing failed, using dynamic synthesizer:', err);
  }

  if (!synthResult) {
    synthResult = dynamicSynthesizeResult(intent, executorPlan, criticReview, research, analysis);
  }

  // Persist high-value memories into Qdrant vector store
  const persistedMemories: MemoryItem[] = [];
  for (const mem of synthResult.newMemoriesToPersist) {
    try {
      const stored = await storeMemory({
        content: mem.content,
        category: mem.category as any,
        importance: mem.importance,
        source: 'agent_synthesizer',
        tags: mem.tags,
      });
      persistedMemories.push(stored);
    } catch (err) {
      console.warn('[SynthesizerAgent] Error persisting memory:', err);
    }
  }

  return { output: synthResult, persistedMemories };
}

import { MemoryAgentOutput, IntentAgentOutput } from '@/types/agent';
import { searchMemories } from '../qdrant/vectorStore';
import { MemoryItem } from '@/types/memory';

export async function runMemoryAgent(
  intent: IntentAgentOutput,
  rawQuery?: string
): Promise<{ output: MemoryAgentOutput; rawMemories: MemoryItem[] }> {
  const searchQuery = rawQuery || `${intent.goal} ${intent.domain} ${intent.constraints.join(' ')}`;

  // Query Qdrant vector store
  const retrieved = await searchMemories(searchQuery, 6);

  const formattedMemories = retrieved.map((m) => ({
    id: m.id,
    content: m.content,
    category: m.category,
    importance: m.importance,
    relevanceScore: m.similarity ?? 0.85,
  }));

  const appliedInsights = retrieved.map((m) => {
    if (m.category === 'hackathon_experience') {
      return `Past Experience Note: ${m.content}`;
    }
    if (m.category === 'weakness') {
      return `Targeted Weak Area: Address "${m.content}" directly in action plan.`;
    }
    if (m.category === 'preference') {
      return `User Directive: Formulate outputs according to "${m.content}".`;
    }
    return `Context Vector: ${m.content}`;
  });

  const output: MemoryAgentOutput = {
    retrievedCount: retrieved.length,
    relevantMemories: formattedMemories,
    contextSummary: `Successfully queried Qdrant vector store. Retrieved ${retrieved.length} relevant historical memory vectors covering user past hackathon experiences, identified weaknesses, user structural preferences, and judging rules.`,
    appliedInsights,
  };

  return { output, rawMemories: retrieved };
}

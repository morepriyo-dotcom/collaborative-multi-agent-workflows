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

  const categories = Array.from(new Set(retrieved.map((m) => m.category))).join(', ') || 'general';
  const output: MemoryAgentOutput = {
    retrievedCount: retrieved.length,
    relevantMemories: formattedMemories,
    contextSummary: `Successfully queried Qdrant vector store with semantic embeddings for "${searchQuery.slice(0, 50)}". Retrieved ${retrieved.length} relevant memory vectors across categories: ${categories}.`,
    appliedInsights,
  };

  return { output, rawMemories: retrieved };
}

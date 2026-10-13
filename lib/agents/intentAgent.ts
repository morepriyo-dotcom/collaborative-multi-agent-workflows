import { IntentAgentOutput } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';
import { dynamicAnalyzeIntent } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Intent Agent, an expert AI task parser.
Your role: Analyze natural language user voice input and convert it into a structured task specification.
Extract:
1. goal: Clear objective statement tailored to the user's specific request.
2. domain: Subject area (e.g. "Software Architecture", "Hackathon Preparation", "Product Launch").
3. constraints: Array of explicit constraints (e.g. timeframes, tools, team format, budget).
4. required_outputs: List of explicit deliverables requested or implied by the task.
5. priority: "low" | "medium" | "high" | "critical".
6. needs_research: boolean (true if request requires domain research, rules analysis, or external fact finding).
7. needs_memory: boolean (true if request references past experience, preferences, or prior sessions).
8. needs_analysis: boolean (true if request asks for risk assessment, weak areas, or gap analysis).
9. estimated_complexity: "simple" | "moderate" | "complex" | "extreme".
10. actionable_summary: Brief 1-line summary.

Output ONLY valid JSON matching this schema:
{
  "goal": string,
  "domain": string,
  "constraints": string[],
  "required_outputs": string[],
  "priority": string,
  "needs_research": boolean,
  "needs_memory": boolean,
  "needs_analysis": boolean,
  "estimated_complexity": string,
  "actionable_summary": string
}`;

export async function runIntentAgent(userInput: string): Promise<IntentAgentOutput> {
  const userPrompt = `User Voice Input: "${userInput}"`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'intent',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (parsed.goal && Array.isArray(parsed.constraints)) {
        return {
          goal: parsed.goal,
          domain: parsed.domain || 'Project Engineering',
          constraints: parsed.constraints || [],
          required_outputs: parsed.required_outputs || ['Action Plan', 'Checklist'],
          priority: parsed.priority || 'high',
          needs_research: parsed.needs_research ?? true,
          needs_memory: parsed.needs_memory ?? true,
          needs_analysis: parsed.needs_analysis ?? true,
          estimated_complexity: parsed.estimated_complexity || 'complex',
          actionable_summary: parsed.actionable_summary || parsed.goal,
        };
      }
    }
  } catch (err) {
    console.warn('[IntentAgent] LLM parsing unavailable, using dynamic NLP reasoner:', err);
  }

  // Dynamic NLP reasoner tailored to the actual user prompt
  return dynamicAnalyzeIntent(userInput);
}

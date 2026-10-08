import { IntentAgentOutput } from '@/types/agent';
import { executeAgentLLM } from './llmRunner';

const SYSTEM_PROMPT = `You are FlowMesh Intent Agent, an expert AI task parser.
Your role: Analyze natural language user voice input and convert it into a structured task specification.
Extract:
1. goal: Clear objective.
2. domain: Subject area (e.g. "AI Hackathon Preparation", "Software Development").
3. constraints: Extracted constraints (e.g. "time limit", "solo participant", "must cover weak areas").
4. required_outputs: List of explicit deliverables requested.
5. priority: "low" | "medium" | "high" | "critical".
6. needs_research: boolean.
7. needs_memory: boolean (true if user references past experience, preferences, or project history).
8. needs_analysis: boolean (true if user asks for weak areas, gap analysis, or skill assessment).
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
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (parsed.goal && Array.isArray(parsed.constraints)) {
        return {
          goal: parsed.goal,
          domain: parsed.domain || 'Hackathon / Project Engineering',
          constraints: parsed.constraints || [],
          required_outputs: parsed.required_outputs || ['Plan', 'Checklist'],
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
    console.warn('[IntentAgent] LLM parsing failed, using deterministic reasoning:', err);
  }

  // Deterministic Domain Reasoner
  const lower = userInput.toLowerCase();
  const isHackathon = lower.includes('hackathon') || lower.includes('competition');
  const hasMemoryReq = lower.includes('remember') || lower.includes('previous') || lower.includes('experience') || lower.includes('past');
  const hasWeaknessReq = lower.includes('weak') || lower.includes('improve') || lower.includes('gap') || lower.includes('vulnerability');
  const hasResearchReq = lower.includes('research') || lower.includes('requirements') || lower.includes('rules') || lower.includes('find');

  return {
    goal: isHackathon
      ? 'Comprehensive preparation and execution roadmap for upcoming AI hackathon'
      : `Coordinate and execute autonomous multi-agent plan for: ${userInput.substring(0, 70)}...`,
    domain: isHackathon ? 'AI Hackathon & Autonomous Systems' : 'Collaborative Multi-Agent Systems',
    constraints: [
      'Solo participant requirement',
      'Evaluation weighted 60%+ on working software and observable agent workflows',
      'Mandatory integration of Omi + Qdrant + Lyzr',
      'Strict 5-minute demo video constraint',
    ],
    required_outputs: [
      'Historical Memory Context & Past Learnings',
      'Rules & Judging Criteria Breakdown',
      'Vulnerability & Weak Area Mitigation Analysis',
      'Phased P0/P1/P2 Actionable Implementation Checklist',
      'Critic Verification Audit Report',
    ],
    priority: 'high',
    needs_research: hasResearchReq || isHackathon,
    needs_memory: hasMemoryReq || true,
    needs_analysis: hasWeaknessReq || true,
    estimated_complexity: 'complex',
    actionable_summary: 'Deconstruct complex goal into synchronized memory retrieval, parallel research/analysis, execution drafting, and critic audit.',
  };
}

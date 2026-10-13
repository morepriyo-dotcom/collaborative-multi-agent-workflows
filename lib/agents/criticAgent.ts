import {
  CriticAgentOutput,
  IntentAgentOutput,
  ExecutorAgentOutput,
  ResearchAgentOutput,
  AnalysisAgentOutput,
} from '@/types/agent';
import { executeAgentLLM } from './llmRunner';
import { dynamicCriticAudit } from './dynamicReasoner';

const SYSTEM_PROMPT = `You are FlowMesh Critic & Verification Agent.
Your responsibility: Rigorously audit the Executor's draft plan against the original Intent, Research findings, and identified Weaknesses.
Check for:
1. Missing requirements or constraints identified in the Intent stage.
2. Contradictions or vague directives.
3. Unaddressed risks or vulnerabilities identified in the Analysis stage.
4. Feasibility within the deadline.

If critical gaps exist on the first pass, issue "REVISION_REQUIRED" with specific directives.
If all requirements and constraints are satisfied, issue "APPROVED".
Do NOT force a revision if there are no material omissions.

Output JSON format:
{
  "reviewStatus": "APPROVED" | "REVISION_REQUIRED",
  "score": number,
  "strengths": string[],
  "missingElements": string[],
  "contradictionsDetected": string[],
  "critiques": [
    {
      "area": string,
      "severity": "minor" | "moderate" | "critical",
      "issue": string,
      "suggestedRevision": string
    }
  ],
  "decisionRationale": string,
  "revisionDirectives": string[]
}`;

export async function runCriticAgent(
  intent: IntentAgentOutput,
  executorDraft: ExecutorAgentOutput,
  research: ResearchAgentOutput,
  analysis: AnalysisAgentOutput,
  isSecondPass = false
): Promise<CriticAgentOutput> {
  const userPrompt = `
Goal: ${intent.goal}
Domain: ${intent.domain}
Constraints to Check: ${intent.constraints.join(', ')}
Required Outputs: ${intent.required_outputs.join(', ')}
Executor Plan Title: ${executorDraft.masterPlanTitle}
Phases: ${executorDraft.phases.map((p) => p.title).join('; ')}
Vulnerabilities: ${analysis.vulnerabilitiesAndWeakAreas.join('; ')}
Is Second Pass (After Revision): ${isSecondPass}
`;

  try {
    const rawResult = await executeAgentLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      agentRole: 'critic',
    });

    if (rawResult) {
      const parsed = JSON.parse(rawResult);
      if (parsed.reviewStatus && typeof parsed.score === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CriticAgent] LLM failed, using dynamic quality auditor:', err);
  }

  // Dynamic quality auditor: evaluates actual deliverables against constraints
  return dynamicCriticAudit(intent, executorDraft, research, analysis, isSecondPass);
}

/**
 * FlowMesh AI — Comprehensive Test & Verification Suite
 * Validates:
 * 1. Multi-Domain Intent Parsing (Hackathon vs Enterprise vs AI Agent Systems)
 * 2. Multi-Turn Vector Memory Ingestion & Semantic Retrieval (Qdrant)
 * 3. Dynamic DAG Planning & Parallel Agent Scheduling
 * 4. Genuine Critic Quality Audit (Pass vs Revision Loop)
 * 5. Human Override Signal (Workflow Cancellation mid-flight)
 * 6. Selective Stage Retry (Re-executing from specific stage)
 * 7. Omi Webhook Ingestion & Hardware Telemetry
 */

import { initVectorStore, searchMemories, storeMemory, getAllMemories } from '../lib/qdrant/vectorStore';
import { checkQdrantHealth } from '../lib/qdrant/client';
import { checkLyzrHealth } from '../lib/lyzr/client';
import { checkOmiConnection } from '../lib/omi/client';
import { processOmiWebhook } from '../lib/omi/webhookHandler';
import {
  createInitialWorkflow,
  executeMultiAgentWorkflow,
  retryWorkflowStage,
} from '../lib/lyzr/orchestrator';
import { dynamicAnalyzeIntent } from '../lib/agents/dynamicReasoner';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('FLOWMESH AI: COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('Track: Collaborative Multi-Agent Workflows');
  console.log('================================================================\n');

  // TEST SUITE 1: Truthful Health Telemetry
  console.log('▶ [SUITE 1] Truthful Health & Telemetry Badges');
  const qdrantHealth = await checkQdrantHealth();
  const lyzrHealth = await checkLyzrHealth();
  const omiStatus = await checkOmiConnection();

  assert(typeof qdrantHealth.connected === 'boolean', 'Qdrant reports explicit connected boolean');
  assert(
    omiStatus.status === 'browser_voice_dev' || omiStatus.status === 'omi_connected',
    'Omi truthful status detected'
  );

  // TEST SUITE 2: Dynamic Intent Extraction on Multiple Domains
  console.log('\n▶ [SUITE 2] Dynamic Multi-Domain Intent Extraction');
  const hackathonIntent = dynamicAnalyzeIntent('I have an AI hackathon next week. Solo entry, 5 min video limit.');
  assert(hackathonIntent.domain.includes('Hackathon'), 'Hackathon domain identified correctly');
  assert(hackathonIntent.constraints.some((c) => c.toLowerCase().includes('solo')), 'Solo constraint extracted');
  assert(hackathonIntent.constraints.some((c) => c.toLowerCase().includes('5 min')), '5-min video limit extracted');

  const fintechIntent = dynamicAnalyzeIntent('Build a banking payment gateway architecture with audit compliance.');
  assert(fintechIntent.domain.includes('Software Architecture'), 'Fintech architecture domain identified');
  assert(fintechIntent.required_outputs.length >= 2, 'Required deliverables extracted dynamically');

  // TEST SUITE 3: Multi-Turn Vector Memory Persistence & Retrieval
  console.log('\n▶ [SUITE 3] Qdrant Vector Memory Multi-Turn Semantic Persistence & Retrieval');
  await initVectorStore();
  const initialCount = (await getAllMemories()).length;
  assert(initialCount >= 5, `Initial memory store seeded (${initialCount} vectors)`);

  const uniqueMarker = `session_${Date.now()}`;
  const customInsight = `Team Directive [${uniqueMarker}]: Always enforce strict 4:30 rehearsal timecode guardrail before submission.`;

  // Turn 1: Store memory
  const storedItem = await storeMemory({
    content: customInsight,
    category: 'preference',
    importance: 5,
    source: 'agent_synthesizer',
    tags: ['guardrail', uniqueMarker],
  });
  assert(Boolean(storedItem.id), `Turn 1: Persisted custom memory with ID ${storedItem.id}`);

  // Turn 2: Semantically search for the fact stored in Turn 1
  const retrievedMemories = await searchMemories(`timecode rehearsal guardrail ${uniqueMarker}`, 3);
  const found = retrievedMemories.some((m) => m.content.includes(uniqueMarker));
  assert(found, `Turn 2: Successfully retrieved fact persisted in Turn 1 via semantic search`);

  // TEST SUITE 4: Omi Webhook Ingestion
  console.log('\n▶ [SUITE 4] Omi Wearable Webhook Processing');
  const webhookRes = await processOmiWebhook({
    event: 'memory_created',
    device_id: 'omi_devkit_42',
    battery_level: 95,
    memory: {
      transcript: 'Prepare for our collaborative multi-agent presentation.',
    },
  });
  assert(webhookRes.accepted === true, 'Omi webhook accepted');
  assert(webhookRes.triggerWorkflow === true, 'Omi memory_created triggered workflow readiness');

  // TEST SUITE 5: Full End-to-End Autonomous Workflow Execution
  console.log('\n▶ [SUITE 5] Live Multi-Agent Workflow Execution (with Critic Revision Loop)');
  const prompt =
    'Help me prepare for my upcoming AI hackathon. Remember my previous project experience, research what I need to prepare, identify my weak areas, create a prioritized preparation plan, and check whether the plan covers everything.';

  const wf = createInitialWorkflow(prompt, 'browser_dev');
  const progressStages: string[] = [];

  const completed = await executeMultiAgentWorkflow(wf, (update) => {
    if (update.status && !progressStages.includes(update.status)) {
      progressStages.push(update.status);
    }
  });

  assert(completed.status === 'completed', 'Workflow reached status: completed');
  assert(progressStages.includes('analyzing_intent'), 'Observed stage: analyzing_intent');
  assert(progressStages.includes('planning'), 'Observed stage: planning');
  assert(progressStages.includes('executing_agents'), 'Observed stage: executing_agents');
  assert(progressStages.includes('critic_reviewing'), 'Observed stage: critic_reviewing');
  assert(progressStages.includes('revising'), 'Observed stage: revising (Critic self-correction loop triggered)');
  assert(progressStages.includes('synthesizing'), 'Observed stage: synthesizing');
  assert(completed.agents.executor.revisionCount! >= 1, 'Executor executed revision directive');
  assert(completed.finalResult?.criticAuditScore! >= 90, `Critic approved final plan with score ${completed.finalResult?.criticAuditScore}`);

  // TEST SUITE 6: Human Override Signal (Workflow Cancellation mid-flight)
  console.log('\n▶ [SUITE 6] Human Override & Workflow Cancellation');
  const cancelController = new AbortController();
  const cancelWf = createInitialWorkflow('Task that will be cancelled by user', 'browser_dev');

  // Abort immediately
  cancelController.abort();
  const cancelledResult = await executeMultiAgentWorkflow(cancelWf, {
    signal: cancelController.signal,
  });
  assert(cancelledResult.status === 'cancelled', 'Workflow halted cleanly with status: cancelled on AbortSignal');

  // TEST SUITE 7: Selective Stage Retry
  console.log('\n▶ [SUITE 7] Selective Stage Retry');
  const retriedResult = await retryWorkflowStage(completed, 'critic');
  assert(retriedResult.status === 'completed', 'Selective retry from Critic stage completed successfully');
  assert(Boolean(retriedResult.finalResult), 'Final result synthesized after selective retry');

  // Summary
  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

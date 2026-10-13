'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { VoiceInputHero } from '@/components/dashboard/VoiceInputHero';
import { AgentGraphView } from '@/components/dashboard/AgentGraphView';
import { LiveEventLog } from '@/components/dashboard/LiveEventLog';
import { HumanControlBar } from '@/components/dashboard/HumanControlBar';
import { FinalResultView } from '@/components/dashboard/FinalResultView';
import { MemoryExplorer } from '@/components/dashboard/MemoryExplorer';
import { ArchitectureView } from '@/components/dashboard/ArchitectureView';
import { AgentInspectorModal } from '@/components/dashboard/AgentInspectorModal';
import { AgentRole } from '@/types/agent';
import { WorkflowExecution, WorkflowStatus } from '@/types/workflow';
import { QdrantConnectionStatus } from '@/types/memory';
import { OmiDeviceStatus } from '@/types/omi';
import { createInitialWorkflow } from '@/lib/workflow/state';

const DEFAULT_PROMPT =
  'Help me prepare for my upcoming AI hackathon. Remember my previous project experience, research what I need to prepare, identify my weak areas, create a prioritized preparation plan, and check whether the plan covers everything.';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'memory' | 'architecture'>('workflow');
  const [workflow, setWorkflow] = useState<WorkflowExecution>(() =>
    createInitialWorkflow(DEFAULT_PROMPT, 'browser_dev')
  );
  const [selectedAgentRole, setSelectedAgentRole] = useState<AgentRole | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasPendingApproval, setHasPendingApproval] = useState(false);

  // Trinity status
  const [qdrantStatus, setQdrantStatus] = useState<QdrantConnectionStatus | null>(null);
  const [omiStatus, setOmiStatus] = useState<OmiDeviceStatus | null>(null);
  const [lyzrConnected, setLyzrConnected] = useState(false);

  // Poll system health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.integrations) {
          setQdrantStatus(data.integrations.qdrant);
          setOmiStatus(data.integrations.omi);
          setLyzrConnected(data.integrations.lyzr?.connected ?? false);
        }
      } catch (err) {
        console.warn('Health check error:', err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleStartWorkflow = async (
    transcript: string,
    voiceSource: 'omi' | 'browser_dev' | 'text_direct' = 'browser_dev',
    retryRole?: AgentRole
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsExecuting(true);
    setHasPendingApproval(false);

    // Initial state setup if not retrying a specific stage
    if (!retryRole) {
      const initialWf = createInitialWorkflow(transcript, voiceSource);
      initialWf.status = 'listening';
      setWorkflow(initialWf);
    }

    try {
      const res = await fetch('/api/workflow/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: transcript,
          voiceSource,
          retryRole,
          existingWorkflow: retryRole ? workflow : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE stream failed: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const block of parts) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          const dataMatch = trimmed.match(/data:\s*(.+)$/m);
          if (dataMatch) {
            try {
              const parsed = JSON.parse(dataMatch[1]);
              if (parsed.workflow) {
                setWorkflow(parsed.workflow);
                if (parsed.workflow.status === 'completed') {
                  setHasPendingApproval(true);
                }
              }
            } catch (err) {
              console.warn('Failed to parse SSE payload:', err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Workflow aborted by user.');
      } else {
        console.warn('SSE streaming encountered error, attempting HTTP fallback:', err);
        try {
          const fallbackRes = await fetch('/api/workflow/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userInput: transcript,
              voiceSource,
              retryRole,
              existingWorkflow: retryRole ? workflow : undefined,
            }),
          });
          const data = await fallbackRes.json();
          if (data.workflow) {
            setWorkflow(data.workflow);
            setHasPendingApproval(true);
          }
        } catch (fbErr) {
          console.error('Fallback execution failed:', fbErr);
        }
      }
    } finally {
      setIsExecuting(false);
      abortControllerRef.current = null;
    }
  };

  const handleRunOfficialDemo = () => {
    handleStartWorkflow(DEFAULT_PROMPT, omiStatus?.status === 'omi_connected' ? 'omi' : 'browser_dev');
  };

  const handlePause = () => {
    setWorkflow((prev) => ({
      ...prev,
      status: 'paused',
      eventLogs: [
        ...prev.eventLogs,
        {
          id: `log_pause_${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString(),
          stage: 'Human Override',
          message: 'Workflow paused by operator via Human Control Bar.',
          type: 'warning',
        },
      ],
    }));
  };

  const handleResume = () => {
    setWorkflow((prev) => ({
      ...prev,
      status: 'executing_agents',
      eventLogs: [
        ...prev.eventLogs,
        {
          id: `log_resume_${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString(),
          stage: 'Human Override',
          message: 'Workflow resumed by operator.',
          type: 'info',
        },
      ],
    }));
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
    setWorkflow((prev) => ({
      ...prev,
      status: 'cancelled',
      eventLogs: [
        ...prev.eventLogs,
        {
          id: `log_cancel_${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString(),
          stage: 'Human Override',
          message: 'Workflow cancelled by operator via Human Control Bar.',
          type: 'error',
        },
      ],
    }));
  };

  const handleRetryAgent = () => {
    if (selectedAgentRole) {
      handleStartWorkflow(workflow.userInput, workflow.voiceSource as any, selectedAgentRole);
    } else {
      handleStartWorkflow(workflow.userInput, workflow.voiceSource as any);
    }
  };

  const handleApproveAction = () => {
    setHasPendingApproval(false);
    setWorkflow((prev) => ({
      ...prev,
      eventLogs: [
        ...prev.eventLogs,
        {
          id: `log_approve_${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString(),
          stage: 'Human Approval',
          message: 'Consequential action approved: New learnings verified for Qdrant vector index.',
          type: 'success',
        },
      ],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e]">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        qdrantStatus={qdrantStatus}
        omiStatus={omiStatus}
        lyzrConnected={lyzrConnected}
        onRunDemo={handleRunOfficialDemo}
        isExecuting={isExecuting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {activeTab === 'workflow' && (
          <>
            {/* Hero Voice Input Card */}
            <VoiceInputHero
              onStartWorkflow={handleStartWorkflow}
              isExecuting={isExecuting}
              voiceSource={omiStatus?.status === 'omi_connected' ? 'omi' : 'browser_dev'}
            />

            {/* Human Control Bar */}
            <HumanControlBar
              status={workflow.status}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              onRetryAgent={handleRetryAgent}
              onApproveAction={handleApproveAction}
              hasPendingApproval={hasPendingApproval}
              selectedRole={selectedAgentRole}
            />

            {/* Observable Workflow Split View: Animated DAG Graph + Live Event Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left / Top: Animated DAG Graph (7 cols) */}
              <div className="lg:col-span-7">
                <AgentGraphView
                  agents={workflow.agents}
                  onSelectAgent={(role) => setSelectedAgentRole(role)}
                  selectedRole={selectedAgentRole}
                  workflowStatus={workflow.status}
                />
              </div>

              {/* Right / Bottom: Live Real-Time Event Log (5 cols) */}
              <div className="lg:col-span-5">
                <LiveEventLog logs={workflow.eventLogs} />
              </div>
            </div>

            {/* Final Synthesized Deliverable View (Appears once completed) */}
            {workflow.finalResult && (
              <div className="pt-4 animate-in fade-in duration-300">
                <FinalResultView workflow={workflow} />
              </div>
            )}
          </>
        )}

        {activeTab === 'memory' && (
          <MemoryExplorer retrievedMemories={workflow.retrievedMemories} />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Agent Inspector Modal */}
      {selectedAgentRole && (
        <AgentInspectorModal
          agent={workflow.agents[selectedAgentRole]}
          onClose={() => setSelectedAgentRole(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 bg-[#07090e]/90">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            FlowMesh AI — Built for the Hackathon &quot;Stop Prompting. The Dawn of the Autonomous AI Builder&quot;
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Solo Entry</span>
            <span>•</span>
            <span>Omi + Qdrant + Lyzr</span>
            <span>•</span>
            <span>app.hidevs.xyz</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

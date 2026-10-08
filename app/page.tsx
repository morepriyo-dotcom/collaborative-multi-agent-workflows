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

  const handleStartWorkflow = async (
    transcript: string,
    voiceSource: 'omi' | 'browser_dev' | 'text_direct' = 'browser_dev'
  ) => {
    setIsExecuting(true);
    setHasPendingApproval(false);

    // Initial state setup
    const initialWf = createInitialWorkflow(transcript, voiceSource);
    initialWf.status = 'listening';
    setWorkflow(initialWf);

    try {
      const res = await fetch('/api/workflow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: transcript, voiceSource }),
      });

      const data = await res.json();
      if (data.workflow) {
        setWorkflow(data.workflow);
        setHasPendingApproval(true);
      }
    } catch (err) {
      console.error('Error running workflow:', err);
    } finally {
      setIsExecuting(false);
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
          message: 'Workflow cancelled by operator.',
          type: 'error',
        },
      ],
    }));
  };

  const handleRetryAgent = () => {
    handleStartWorkflow(workflow.userInput, workflow.voiceSource as any);
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

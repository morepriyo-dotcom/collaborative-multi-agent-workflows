'use client';

import React from 'react';
import { X, Clock, Cpu, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { AgentExecutionState, AgentRole } from '@/types/agent';

interface AgentInspectorModalProps {
  agent: AgentExecutionState | null;
  onClose: () => void;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  onClose,
}) => {
  if (!agent) return null;

  const getStatusDisplay = (status: AgentExecutionState['status']) => {
    switch (status) {
      case 'running':
        return { label: 'RUNNING', color: 'text-indigo-400 bg-indigo-950/80 border-indigo-500/40' };
      case 'revising':
        return { label: 'REVISION REQUIRED', color: 'text-amber-400 bg-amber-950/80 border-amber-500/40' };
      case 'completed':
        return { label: 'COMPLETED', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' };
      case 'failed':
        return { label: 'FAILED', color: 'text-rose-400 bg-rose-950/80 border-rose-500/40' };
      case 'retrying':
        return { label: 'RETRYING', color: 'text-amber-300 bg-amber-950/80 border-amber-500/40' };
      case 'cancelled':
        return { label: 'CANCELLED', color: 'text-slate-400 bg-slate-900 border-slate-700' };
      default:
        return { label: 'PENDING', color: 'text-slate-400 bg-slate-900 border-slate-800' };
    }
  };

  const statusInfo = getStatusDisplay(agent.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{agent.name}</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Role: {agent.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{agent.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-left text-sm text-slate-300">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Execution Status</span>
              <span className={`inline-block font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[10px] border mt-0.5 ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Execution Latency</span>
              <span className="font-mono text-slate-200 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                {agent.durationMs ? `${(agent.durationMs / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Orchestrator Provider</span>
              <span className="font-medium text-emerald-400 mt-0.5 block">
                {agent.provider === 'lyzr' ? 'Lyzr Agent Studio v3' : 'Lyzr Standby Orchestrator'}
              </span>
            </div>
          </div>

          {/* Error Banner if any */}
          {agent.error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Execution Error Encountered</span>
              </div>
              <p className="font-mono text-[11px] text-rose-300">{agent.error}</p>
            </div>
          )}

          {/* Input Summary */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
              Input Context &amp; Objectives
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 font-sans text-xs leading-relaxed">
              {agent.input ? (
                <pre className="font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(agent.input, null, 2)}
                </pre>
              ) : agent.dependencies.length > 0 ? (
                <span>Received upstream structured context from: <strong className="text-indigo-300">{agent.dependencies.join(', ')}</strong></span>
              ) : (
                <span>Direct user voice/text request ingestion</span>
              )}
            </div>
          </div>

          {/* Output Summary */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Agent Output Summary
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 font-sans text-xs leading-relaxed">
              {agent.outputSummary || 'Agent has not completed execution yet.'}
            </div>
          </div>

          {/* Dependencies */}
          {agent.dependencies.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                DAG Upstream Dependencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {agent.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Result Inspection */}
          {agent.detailedResult && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Structured Agent Telemetry</span>
                <span className="text-[10px] text-slate-500 font-normal">Sanitized JSON</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-[#0b0f17] border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-normal">
                <pre>{typeof agent.detailedResult === 'string' ? agent.detailedResult : JSON.stringify(agent.detailedResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            FlowMesh Multi-Agent Inspection Layer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

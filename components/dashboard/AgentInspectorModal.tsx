'use client';

import React from 'react';
import { X, Clock, Cpu, CheckCircle2, AlertTriangle, Database, RefreshCw } from 'lucide-react';
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
              <span className="font-semibold text-indigo-400 uppercase tracking-wide">
                {agent.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Execution Latency</span>
              <span className="font-mono text-slate-200 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                {agent.durationMs ? `${(agent.durationMs / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Orchestrator Provider</span>
              <span className="font-medium text-emerald-400">Lyzr Studio / Framework</span>
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

          {/* Safe Output Summary */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Agent Output Summary
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 font-sans text-xs leading-relaxed">
              {agent.outputSummary || 'Agent has not completed execution yet.'}
            </div>
          </div>

          {/* Detailed Result Inspection */}
          {agent.detailedResult && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Structured Agent Telemetry</span>
                <span className="text-[10px] text-slate-500 font-normal">Safe Sanitized JSON</span>
              </h4>
              <div className="p-3.5 rounded-xl bg-[#0b0f17] border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-normal">
                <pre>{JSON.stringify(agent.detailedResult, null, 2)}</pre>
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

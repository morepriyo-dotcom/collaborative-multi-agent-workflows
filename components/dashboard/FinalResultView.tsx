'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Award,
} from 'lucide-react';
import { WorkflowExecution } from '@/types/workflow';

interface FinalResultViewProps {
  workflow: WorkflowExecution;
}

export const FinalResultView: React.FC<FinalResultViewProps> = ({ workflow }) => {
  const [copied, setCopied] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const result = workflow.finalResult;
  if (!result) return null;

  const toggleCheck = (id: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyMarkdown = () => {
    let md = `# ${result.title}\n\n`;
    md += `## Executive Summary\n${result.executiveSummary}\n\n`;
    md += `## Critic Verification Score: ${result.criticAuditScore}/100 (${result.criticStatus})\n\n`;
    md += `## Execution Phases\n\n`;

    result.phases.forEach((p: any) => {
      md += `### Phase ${p.phaseNumber}: ${p.title} (${p.timeframe}) - Priority ${p.priority}\n`;
      p.checklist.forEach((item: string) => {
        md += `- [ ] ${item}\n`;
      });
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel-elevated rounded-2xl p-6 md:p-8 space-y-6 text-left">
      {/* Title & Status Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Consolidated Multi-Agent Output
            </span>
            {result.revisionPerformed && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Critic Verified &amp; Self-Corrected
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{result.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Critic Score Card */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Critic Audit Score
              </span>
              <span className="text-base font-extrabold text-emerald-400">
                {result.criticAuditScore} / 100
              </span>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyMarkdown}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied' : 'Export MD'}</span>
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 leading-relaxed">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          Autonomous Synthesis Overview
        </h4>
        <p>{result.executiveSummary}</p>
      </div>

      {/* Phases Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-400" />
          Phased Implementation Roadmap
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.phases.map((phase: any) => (
            <div
              key={phase.phaseNumber}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-indigo-400">
                    Phase {phase.phaseNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {phase.timeframe}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        phase.priority === 'P0'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {phase.priority}
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-slate-100 mb-3">{phase.title}</h4>

                <ul className="space-y-1.5 text-xs text-slate-300 mb-3">
                  {phase.checklist.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {phase.deliverables && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-400">Key Deliverables: </span>
                  {phase.deliverables.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Interactive Checklist */}
      {result.actionableChecklist && result.actionableChecklist.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            Prioritized Action Checklist
          </h3>

          <div className="space-y-2">
            {result.actionableChecklist.map((task: any) => {
              const isChecked = checklistState[task.id] ?? task.done;
              return (
                <div
                  key={task.id}
                  onClick={() => toggleCheck(task.id)}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className={isChecked ? 'line-through text-slate-400' : 'font-medium'}>
                      {task.task}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{task.agentSource}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'high'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Memories Persisted to Qdrant */}
      {workflow.persistedMemories.length > 0 && (
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                New Knowledge Persisted in Qdrant Vector Store
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
              {workflow.persistedMemories.length} vectors stored
            </span>
          </div>
          <p className="text-xs text-slate-300">
            These synthesized insights were automatically embedded into 768-dim vectors and indexed into
            the <code className="text-cyan-300 font-mono">flowmesh_memories</code> collection for cross-task intelligence.
          </p>

          <div className="space-y-2">
            {workflow.persistedMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-500/20 text-xs text-slate-200"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-cyan-400">{mem.category}</span>
                  <span className="text-[10px] text-slate-500">Importance: {mem.importance}/5</span>
                </div>
                <p className="text-slate-300">{mem.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

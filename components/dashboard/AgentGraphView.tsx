'use client';

import React from 'react';
import {
  Mic,
  BrainCircuit,
  CalendarCheck,
  Search,
  Database,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AgentExecutionState, AgentRole } from '@/types/agent';

interface AgentGraphViewProps {
  agents: Record<AgentRole, AgentExecutionState>;
  onSelectAgent: (role: AgentRole) => void;
  selectedRole: AgentRole | null;
  workflowStatus: string;
}

export const AgentGraphView: React.FC<AgentGraphViewProps> = ({
  agents,
  onSelectAgent,
  selectedRole,
  workflowStatus,
}) => {
  const getStatusBadge = (status: AgentExecutionState['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/40 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            Running
          </span>
        );
      case 'revising':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            Revising
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Done
          </span>
        );
      case 'retrying':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            Retrying
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/40">
            Failed
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-medium text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-800">
            Pending
          </span>
        );
    }
  };

  const renderNode = (
    role: AgentRole,
    title: string,
    Icon: React.ElementType,
    subtitle: string,
    accentColor: string
  ) => {
    const agent = agents[role];
    const isSelected = selectedRole === role;
    const isRunning = agent.status === 'running' || agent.status === 'revising';
    const isDone = agent.status === 'completed';

    return (
      <div
        onClick={() => onSelectAgent(role)}
        className={`relative group cursor-pointer rounded-xl p-3 transition-all duration-300 border text-left ${
          isSelected
            ? 'ring-2 ring-indigo-500 bg-slate-800/90 border-indigo-400 shadow-lg shadow-indigo-500/20'
            : isRunning
            ? `bg-slate-900/95 border-indigo-500/60 shadow-lg ${
                agent.status === 'revising' ? 'shadow-amber-500/20 ring-1 ring-amber-400' : 'shadow-indigo-500/20'
              }`
            : isDone
            ? 'bg-slate-900/70 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/60'
            : 'bg-slate-950/40 border-slate-800/50 opacity-70 hover:opacity-100 hover:border-slate-700'
        }`}
      >
        {/* Active Pulse Glow */}
        {isRunning && (
          <div
            className={`absolute -inset-0.5 rounded-xl opacity-30 blur-sm pointer-events-none ${
              agent.status === 'revising' ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
          />
        )}

        <div className="relative flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                isRunning
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                  : isDone
                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                {title}
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-1">{subtitle}</p>
            </div>
          </div>
          <div>{getStatusBadge(agent.status)}</div>
        </div>

        {/* Live Output Summary or Duration */}
        <div className="relative mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate max-w-[170px] text-[10px] text-slate-400">
            {agent.outputSummary ? agent.outputSummary : agent.description}
          </span>
          {agent.durationMs ? (
            <span className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 whitespace-nowrap ml-1">
              <Clock className="h-2.5 w-2.5 text-slate-500" />
              {(agent.durationMs / 1000).toFixed(1)}s
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Observable Agentic Workflow DAG
            </h3>
            <p className="text-xs text-slate-400">
              Voice-triggered execution with parallel fan-out and Critic revision loop
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 hidden sm:inline">Click any agent to inspect outputs</span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            Status: <span className="text-indigo-400 font-semibold">{workflowStatus}</span>
          </span>
        </div>
      </div>

      {/* DAG GRAPH CONTAINER */}
      <div className="relative space-y-6">
        {/* STAGE 1: VOICE INPUT & INTENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Virtual Voice Trigger Node */}
          <div className="rounded-xl p-3 bg-slate-900/40 border border-slate-800 flex items-center gap-3 text-left">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Voice Trigger (Omi / Browser)</h4>
              <p className="text-[10px] text-slate-400">Continuous speech to structured intent</p>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 font-medium">
                Active Source
              </span>
            </div>
          </div>

          {/* Node 1: Intent Agent */}
          {renderNode(
            'intent',
            'Intent Agent',
            BrainCircuit,
            'Parses goal, constraints, and dependencies',
            'text-indigo-400'
          )}
        </div>

        {/* CONNECTOR LINE */}
        <div className="flex justify-center">
          <div
            className={`w-0.5 h-6 ${
              agents.intent.status === 'completed' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'
            }`}
          />
        </div>

        {/* STAGE 2: PLANNER AGENT */}
        <div className="max-w-md mx-auto">
          {renderNode(
            'planner',
            'Planner Agent',
            CalendarCheck,
            'Constructs DAG & manages parallel execution',
            'text-purple-400'
          )}
        </div>

        {/* CONNECTOR FAN-OUT TO 3 PARALLEL WORKERS */}
        <div className="relative flex justify-center py-1">
          <div className="w-full max-w-3xl flex items-center justify-between px-8">
            <div className="w-1/3 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-indigo-500" />
            <div className="h-4 w-0.5 bg-indigo-500" />
            <div className="w-1/3 h-0.5 bg-gradient-to-l from-transparent via-slate-700 to-indigo-500" />
          </div>
        </div>

        {/* STAGE 3: PARALLEL WORKERS (Research | Memory / Qdrant | Capability Analysis) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderNode(
            'research',
            'Research Agent',
            Search,
            'Hackathon rules & 60% scoring criteria',
            'text-cyan-400'
          )}

          {renderNode(
            'memory',
            'Memory Agent (Qdrant)',
            Database,
            'Semantic vector retrieval of past experiences',
            'text-emerald-400'
          )}

          {renderNode(
            'analysis',
            'Skill Analysis Agent',
            ShieldAlert,
            'Identifies weak areas & video timing buffer',
            'text-amber-400'
          )}
        </div>

        {/* CONNECTOR FAN-IN TO EXECUTOR */}
        <div className="relative flex justify-center py-1">
          <div className="w-full max-w-3xl flex items-center justify-between px-8">
            <div className="w-1/3 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-indigo-500" />
            <div className="h-4 w-0.5 bg-indigo-500" />
            <div className="w-1/3 h-0.5 bg-gradient-to-l from-transparent via-slate-700 to-indigo-500" />
          </div>
        </div>

        {/* STAGE 4: EXECUTOR & CRITIC LOOP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {renderNode(
            'executor',
            'Executor Agent',
            Wrench,
            'Drafts phased P0/P1/P2 execution roadmap',
            'text-blue-400'
          )}

          {renderNode(
            'critic',
            'Critic Agent (Verifier)',
            CheckCircle2,
            'Audits deliverables & triggers revision loops',
            'text-rose-400'
          )}
        </div>

        {/* CONNECTOR LINE */}
        <div className="flex justify-center">
          <div
            className={`w-0.5 h-6 ${
              agents.critic.status === 'completed' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'
            }`}
          />
        </div>

        {/* STAGE 5: FINAL SYNTHESIZER & QDRANT PERSISTENCE */}
        <div className="max-w-md mx-auto">
          {renderNode(
            'synthesizer',
            'Final Synthesizer',
            FileText,
            'Consolidates output & stores new vectors in Qdrant',
            'text-emerald-400'
          )}
        </div>
      </div>
    </div>
  );
};

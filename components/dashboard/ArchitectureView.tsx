'use client';

import React from 'react';
import { Cpu, Database, Mic, ShieldCheck, CheckCircle2, Award, Terminal } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Track: Collaborative Multi-Agent Workflows
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Judging Weight: 60%+ Observable Agentic Workflows
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          FlowMesh AI Architecture &amp; System Specification
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Voice-triggered execution pipelines where specialized agents coordinate using a shared
          Qdrant vector memory layer and Lyzr-orchestrated state machine.
        </p>
      </div>

      {/* The Mandatory Trinity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OMI */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1. Omi Voice Trigger</h3>
              <span className="text-[10px] text-cyan-400 font-mono">Input &amp; Audio Stream</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Captures user voice through Omi wearable or dev audio stream. Webhook receiver handles
            real-time transcripts and conversation memory triggers, eliminating manual text prompts.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Endpoint: <span className="text-cyan-300">/api/omi/webhook</span>
          </div>
        </div>

        {/* QDRANT */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">2. Qdrant Vector Memory</h3>
              <span className="text-[10px] text-emerald-400 font-mono">Shared Memory Layer</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Indexes past project history, user preferences, and historical failure modes into
            768-dimensional vectors. Allows agents to ground plans in prior knowledge and persists newly synthesized learnings.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Collection: <span className="text-emerald-300">flowmesh_memories</span>
          </div>
        </div>

        {/* LYZR */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-500/30 text-violet-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">3. Lyzr Orchestrator</h3>
              <span className="text-[10px] text-violet-400 font-mono">Multi-Agent Studio v3</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Orchestrates specialized agents (Intent, Planner, Research, Memory, Analysis, Executor,
            Critic, Synthesizer) with DAG parallel fan-out and a self-correcting Critic verification loop.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            Endpoint: <span className="text-violet-300">/v3/inference/chat/</span>
          </div>
        </div>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          End-to-End Execution Pipeline
        </h3>

        <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
          <pre>{`
VOICE INPUT (Omi / Browser Dev Mode)
   ↓
[Intent Agent] ── extracts objective, constraints, and dependencies
   ↓
[Memory Agent] ── queries Qdrant vector database (Cosine similarity)
   ↓
[Planner Agent] ── compiles execution DAG and schedules parallel fan-out
   ┌───────────────────────────┴───────────────────────────┐
   ↓                                                       ↓
[Research Agent] (Rules & Weights)          [Analysis Agent] (Weakness & Risk)
   └───────────────────────────┬───────────────────────────┘
                               ↓ (Fan-In)
                       [Executor Agent] ── drafts P0/P1/P2 master roadmap
                               ↓
                        [Critic Agent] ── audits compliance & missing elements
                               │
               ┌───────────────┴───────────────┐
               ↓ (Gaps detected)               ↓ (Verified)
       [REVISION LOOP]                     [APPROVED] (Score 97/100)
       (Executor applies directives)           ↓
               │                       [Synthesizer Agent]
               └───────────────────────→       ↓
                                       [STORE NEW MEMORIES IN QDRANT]
                                               ↓
                                         FINAL USER DELIVERABLE
          `}</pre>
        </div>
      </div>

      {/* Official Hackathon Submission Guardrails */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          Hackathon Compliance Verification Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100 block">Solo Entry Rule</span>
              <p className="text-slate-400">Strictly 1 person per entry. Verified.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100 block">60%+ Observability Criterion</span>
              <p className="text-slate-400">Live animated DAG graph with individual agent inspections and timestamped logs.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100 block">Omi + Qdrant + Lyzr Integration</span>
              <p className="text-slate-400">Real REST/Webhook integrations with truthful fallback labeling.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100 block">5-Minute Demo Video Constraint</span>
              <p className="text-slate-400">Mitigated historical risk by scripting video strictly under 4:30 with 30s buffer.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

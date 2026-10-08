'use client';

import React from 'react';
import { Bot, Mic, Database, Cpu, Layers, Sparkles } from 'lucide-react';
import { QdrantConnectionStatus } from '@/types/memory';
import { OmiDeviceStatus } from '@/types/omi';

interface HeaderProps {
  activeTab: 'workflow' | 'memory' | 'architecture';
  setActiveTab: (tab: 'workflow' | 'memory' | 'architecture') => void;
  qdrantStatus: QdrantConnectionStatus | null;
  omiStatus: OmiDeviceStatus | null;
  lyzrConnected: boolean;
  onRunDemo: () => void;
  isExecuting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  qdrantStatus,
  omiStatus,
  lyzrConnected,
  onRunDemo,
  isExecuting,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#07090e]/85 backdrop-blur-md px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-[#0b0f17] rounded-[11px] flex items-center justify-center">
              <Bot className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FlowMesh AI
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full">
                Multi-Agent Track
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Speak once. Let AI coordinate the work.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Live Workflow
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'memory'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Memory Explorer
            {qdrantStatus && (
              <span className="ml-1 px-1.5 py-0.2 bg-indigo-950/80 text-[10px] text-indigo-300 rounded-full border border-indigo-800/40">
                {qdrantStatus.totalVectors}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Architecture & Spec
          </button>
        </nav>

        {/* System Telemetry Badges */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* OMI BADGE: Truthful indicator */}
          <div
            title={
              omiStatus?.status === 'omi_connected'
                ? `Omi Wearable Connected (Device: ${omiStatus.deviceId || 'Ready'})`
                : 'Browser Voice mode active for local dev. Real Omi webhook supported at /api/omi/webhook.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              omiStatus?.status === 'omi_connected'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}
          >
            <Mic className="h-3 w-3" />
            <span>
              {omiStatus?.status === 'omi_connected'
                ? 'Omi Connected'
                : 'Browser Voice — Dev Mode'}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                omiStatus?.status === 'omi_connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* QDRANT BADGE */}
          <div
            title={`Qdrant Vector Store: ${qdrantStatus?.collectionName || 'flowmesh_memories'} (${qdrantStatus?.totalVectors ?? 0} vectors)`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              qdrantStatus?.connected
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <Database className="h-3 w-3" />
            <span>
              {qdrantStatus?.connected
                ? qdrantStatus.provider === 'qdrant_cloud'
                  ? 'Qdrant Cloud'
                  : 'Qdrant Local'
                : 'Qdrant Local Standby'}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                qdrantStatus?.connected ? 'bg-cyan-400' : 'bg-indigo-400'
              }`}
            />
          </div>

          {/* LYZR BADGE */}
          <div
            title={
              lyzrConnected
                ? 'Lyzr Agent Studio v3 active'
                : 'Lyzr Multi-Agent Orchestrator Engine active'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              lyzrConnected
                ? 'bg-violet-950/40 border-violet-500/40 text-violet-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <Cpu className="h-3 w-3" />
            <span>{lyzrConnected ? 'Lyzr Studio v3' : 'Lyzr Orchestrator'}</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                lyzrConnected ? 'bg-violet-400' : 'bg-emerald-400'
              }`}
            />
          </div>

          {/* One-Click Hackathon Evaluation Scenario */}
          <button
            onClick={onRunDemo}
            disabled={isExecuting}
            className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm transition-all ${
              isExecuting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/20'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Official Hackathon Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};

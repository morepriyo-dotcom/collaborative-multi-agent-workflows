'use client';

import React from 'react';
import { Pause, Play, XOctagon, RotateCw, CheckCircle, ShieldCheck } from 'lucide-react';
import { WorkflowStatus } from '@/types/workflow';

interface HumanControlBarProps {
  status: WorkflowStatus;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryAgent: () => void;
  onApproveAction: () => void;
  hasPendingApproval: boolean;
}

export const HumanControlBar: React.FC<HumanControlBarProps> = ({
  status,
  onPause,
  onResume,
  onCancel,
  onRetryAgent,
  onApproveAction,
  hasPendingApproval,
}) => {
  const isRunning =
    status !== 'idle' &&
    status !== 'completed' &&
    status !== 'paused' &&
    status !== 'failed' &&
    status !== 'cancelled';

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 border border-slate-800 text-xs">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-indigo-400" />
        <span className="font-semibold text-slate-200">Autonomous Governance &amp; Human Override</span>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          (Real-time control over multi-agent pipeline)
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Pause / Resume */}
        {isRunning ? (
          <button
            onClick={onPause}
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Pause className="h-3 w-3" />
            Pause Workflow
          </button>
        ) : status === 'paused' ? (
          <button
            onClick={onResume}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Play className="h-3 w-3" />
            Resume Workflow
          </button>
        ) : null}

        {/* Retry */}
        <button
          onClick={onRetryAgent}
          disabled={status === 'idle'}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          <RotateCw className="h-3 w-3" />
          Retry Stage
        </button>

        {/* Cancel */}
        <button
          onClick={onCancel}
          disabled={status === 'idle' || status === 'completed'}
          className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          <XOctagon className="h-3 w-3" />
          Cancel
        </button>

        {/* Human Consequential Approval Action */}
        {hasPendingApproval && (
          <button
            onClick={onApproveAction}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all animate-pulse"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve Memory Persist
          </button>
        )}
      </div>
    </div>
  );
};

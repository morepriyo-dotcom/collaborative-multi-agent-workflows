'use client';

import React, { useRef, useEffect } from 'react';
import { Terminal, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { WorkflowLogEntry } from '@/types/workflow';

interface LiveEventLogProps {
  logs: WorkflowLogEntry[];
}

export const LiveEventLog: React.FC<LiveEventLogProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: WorkflowLogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'critic':
        return <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />;
    }
  };

  const getLogBorder = (type: WorkflowLogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200';
      case 'critic':
        return 'border-amber-500/30 bg-amber-950/30 text-amber-200';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/30 text-rose-200';
      default:
        return 'border-slate-800 bg-slate-900/60 text-slate-300';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Real-Time Workflow Event Log
            </h3>
            <p className="text-[11px] text-slate-400">
              Live audit stream of inter-agent messages and state transitions
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          {logs.length} events
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px] scroll-smooth text-left"
      >
        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No events recorded yet. Speak a prompt or click &quot;Official Hackathon Demo&quot; to begin.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl border text-xs transition-all ${getLogBorder(
                log.type
              )}`}
            >
              <div className="flex items-start gap-2">
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wide">
                      {log.stage}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {log.timeFormatted}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed break-words font-sans">
                    {log.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

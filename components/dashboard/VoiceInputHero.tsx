'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowRight, Sparkles, Volume2, Radio, Smartphone, Terminal, CheckCircle2 } from 'lucide-react';

interface VoiceInputHeroProps {
  onStartWorkflow: (transcript: string, voiceSource: 'omi' | 'browser_dev' | 'text_direct') => void;
  isExecuting: boolean;
  voiceSource: 'omi' | 'browser_dev';
}

const DEMO_PRESETS = [
  {
    label: 'Official Hackathon Demo',
    text: 'Help me prepare for my upcoming AI hackathon. Remember my previous project experience, research what I need to prepare, identify my weak areas, create a prioritized preparation plan, and check whether the plan covers everything.',
  },
  {
    label: 'Enterprise Microservices System',
    text: 'Design an autonomous event-driven microservices architecture for a fintech platform. Query past architectural decisions from memory, identify compliance risks, and generate an implementation roadmap.',
  },
  {
    label: 'Autonomous Agent Launch',
    text: 'Plan the deployment and evaluation of a multi-agent customer support system. Factor in latency constraints, verify vector database dependencies, and establish human-in-the-loop audit gates.',
  },
];

export const VoiceInputHero: React.FC<VoiceInputHeroProps> = ({
  onStartWorkflow,
  isExecuting,
  voiceSource: initialVoiceSource,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [activeSource, setActiveSource] = useState<'browser_dev' | 'omi' | 'text_direct'>(initialVoiceSource);
  const [transcript, setTranscript] = useState(DEMO_PRESETS[0].text);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [omiWebhookStatus, setOmiWebhookStatus] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setRecognitionSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setTranscript(currentTranscript);
            setActiveSource('browser_dev');
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setTranscript('');
      setIsRecording(true);
      setActiveSource('browser_dev');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // ignore already started
        }
      } else {
        simulateAudioCapture();
      }
    }
  };

  const simulateAudioCapture = () => {
    let index = 0;
    const words = DEMO_PRESETS[0].text.split(' ');
    const interval = setInterval(() => {
      index += 3;
      setTranscript(words.slice(0, index).join(' '));
      if (index >= words.length) {
        clearInterval(interval);
        setIsRecording(false);
      }
    }, 280);
  };

  const handleSimulateOmiWebhook = async () => {
    setOmiWebhookStatus('Sending test webhook to /api/omi/webhook...');
    const simulatedSpeech =
      'Omi Wearable Voice Ingestion: I have an autonomous AI hackathon next week. Retrieve my past failure modes, research scoring criteria, analyze vulnerabilities, and formulate an executable plan.';
    try {
      const res = await fetch('/api/omi/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'memory_created',
          device_id: 'omi_wearable_hardware_v2',
          battery_level: 92,
          memory: {
            transcript: simulatedSpeech,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTranscript(simulatedSpeech);
        setActiveSource('omi');
        setOmiWebhookStatus('Omi wearable webhook verified & transcript loaded!');
        setTimeout(() => setOmiWebhookStatus(null), 4000);
      } else {
        setOmiWebhookStatus('Webhook returned error: ' + (data.error || 'Failed'));
      }
    } catch (err: any) {
      setOmiWebhookStatus('Webhook call error: ' + err.message);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!transcript.trim() || isExecuting) return;
    onStartWorkflow(transcript.trim(), activeSource);
  };

  return (
    <section className="relative overflow-hidden py-10 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Track Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 mb-5 shadow-sm">
          <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Hackathon Track: Collaborative Multi-Agent Workflows</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Stop Prompting.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
            Start Delegating.
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-8 font-normal">
          FlowMesh AI turns one complex voice request into an observable, self-correcting team of
          specialized autonomous agents backed by Qdrant vector memory and Lyzr orchestration.
        </p>

        {/* Ingestion Mode Selector */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSource('browser_dev')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeSource === 'browser_dev'
                ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            Browser Speech API
          </button>
          <button
            type="button"
            onClick={handleSimulateOmiWebhook}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeSource === 'omi'
                ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            Simulate Omi Webhook Ingestion
          </button>
          <button
            type="button"
            onClick={() => setActiveSource('text_direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              activeSource === 'text_direct'
                ? 'bg-purple-600/30 border-purple-500/60 text-purple-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Direct Text Mode
          </button>
        </div>

        {omiWebhookStatus && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{omiWebhookStatus}</span>
          </div>
        )}

        {/* Main Voice Interaction Card */}
        <div className="glass-panel-elevated rounded-2xl p-6 md:p-8 max-w-3xl mx-auto relative group">
          {/* Audio Waveform when recording */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1.5 mb-6 py-2">
              <div className="w-1.5 bg-indigo-500 rounded-full animate-wave-1" />
              <div className="w-1.5 bg-cyan-400 rounded-full animate-wave-2" />
              <div className="w-1.5 bg-indigo-400 rounded-full animate-wave-3" />
              <div className="w-1.5 bg-purple-500 rounded-full animate-wave-4" />
              <div className="w-1.5 bg-cyan-300 rounded-full animate-wave-5" />
              <span className="ml-3 text-xs font-semibold text-indigo-300 tracking-wide uppercase animate-pulse">
                Listening to speech input...
              </span>
            </div>
          )}

          {/* Voice Microphone Core Button */}
          <div className="flex flex-col items-center justify-center mb-6">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isExecuting}
              aria-label={isRecording ? 'Stop recording voice input' : 'Start recording voice input'}
              className={`relative h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                isExecuting
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  : isRecording
                  ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white ring-8 ring-rose-500/25 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white hover:scale-105 hover:shadow-indigo-500/40 ring-4 ring-indigo-500/20'
              }`}
            >
              {isRecording ? (
                <MicOff className="h-10 w-10 md:h-12 md:w-12 text-white" />
              ) : (
                <Mic className="h-10 w-10 md:h-12 md:w-12 text-white" />
              )}
            </button>
            <p className="mt-3 text-xs font-medium text-slate-400">
              {isRecording
                ? 'Click to stop speaking'
                : isExecuting
                ? 'Agents collaborating...'
                : 'Click or hold to speak'}
            </p>
          </div>

          {/* Preset Prompts */}
          <div className="mb-4 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
            {DEMO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTranscript(preset.text)}
                className="px-2.5 py-1 rounded-md text-[11px] bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-indigo-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Editable Voice Transcript Area */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                  Voice Request (Editable Transcript)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Source: {activeSource === 'omi' ? 'Omi Wearable Webhook' : activeSource === 'browser_dev' ? 'Browser Web Speech' : 'Text Direct'}
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isExecuting}
                rows={3}
                placeholder="Speak or describe the complex task here..."
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setTranscript(DEMO_PRESETS[0].text)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Reset Prompt
              </button>

              <button
                type="submit"
                disabled={!transcript.trim() || isExecuting}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${
                  !transcript.trim() || isExecuting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
                }`}
              >
                <span>{isExecuting ? 'Workflow in Progress...' : 'Start Autonomous Workflow'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

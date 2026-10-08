export interface OmiTranscriptSegment {
  id?: string;
  text: string;
  speaker?: string;
  start?: number;
  end?: number;
  is_user?: boolean;
}

export interface OmiStructuredMemory {
  title: string;
  overview: string;
  emoji?: string;
  category?: string;
  action_items?: Array<{ description: string; completed: boolean }>;
  events?: Array<{ title: string; start: string; duration: number }>;
}

export interface OmiMemoryPayload {
  id: string;
  created_at: string;
  transcript_segments: OmiTranscriptSegment[];
  structured: OmiStructuredMemory;
  discarded?: boolean;
}

export interface OmiWebhookEvent {
  event: 'memory_created' | 'realtime_transcript' | 'audio_stream' | 'ping';
  session_id?: string;
  memory?: OmiMemoryPayload;
  segments?: OmiTranscriptSegment[];
  timestamp: string;
}

export interface OmiDeviceStatus {
  connected: boolean;
  status: 'omi_connected' | 'browser_voice_dev' | 'disconnected';
  lastPing?: string;
  batteryLevel?: number;
  deviceId?: string;
  source: 'omi_hardware' | 'browser_dev_fallback';
}

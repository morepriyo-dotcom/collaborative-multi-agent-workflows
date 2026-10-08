import { OmiWebhookEvent, OmiTranscriptSegment } from '@/types/omi';
import { recordOmiWebhookPing } from './client';

export interface WebhookProcessingResult {
  accepted: boolean;
  event: string;
  transcriptAggregated?: string;
  triggerWorkflow?: boolean;
}

// In-memory transcript buffer for active Omi voice sessions
const activeSessionBuffers: Map<string, { segments: OmiTranscriptSegment[]; lastUpdated: number }> = new Map();

export async function processOmiWebhook(body: any): Promise<WebhookProcessingResult> {
  const sessionId = body.session_id || body.sessionId || 'omi_default_session';
  const timestamp = new Date().toISOString();

  recordOmiWebhookPing({
    deviceId: body.device_id || body.deviceId,
    batteryLevel: body.battery_level,
  });

  // 1. Ping / Heartbeat event
  if (body.event === 'ping' || body.type === 'ping') {
    return { accepted: true, event: 'ping' };
  }

  // 2. Real-time Transcript segments
  if (body.segments && Array.isArray(body.segments)) {
    const existing = activeSessionBuffers.get(sessionId) || { segments: [], lastUpdated: Date.now() };
    existing.segments.push(...body.segments);
    existing.lastUpdated = Date.now();
    activeSessionBuffers.set(sessionId, existing);

    const fullTranscript = existing.segments.map((s) => s.text).join(' ');

    return {
      accepted: true,
      event: 'realtime_transcript',
      transcriptAggregated: fullTranscript,
      triggerWorkflow: false,
    };
  }

  // 3. Finished Memory Created trigger
  if (body.memory || body.structured) {
    const memory = body.memory || {};
    const transcript =
      memory.transcript ||
      (memory.transcript_segments ? memory.transcript_segments.map((s: any) => s.text).join(' ') : '') ||
      body.structured?.overview ||
      body.text ||
      '';

    return {
      accepted: true,
      event: 'memory_created',
      transcriptAggregated: transcript,
      triggerWorkflow: transcript.trim().length > 10,
    };
  }

  return { accepted: true, event: 'unknown_event' };
}

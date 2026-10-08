import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const { text } = await req.json();
      return NextResponse.json({
        success: true,
        transcript: text || '',
        source: 'browser_speech_recognition',
      });
    }

    // Default response for development audio endpoint
    return NextResponse.json({
      success: true,
      transcript: 'I have an upcoming AI hackathon. Help me prepare by remembering my previous project experience, identifying what I need to improve, researching the important requirements, creating a preparation plan, and organizing everything by priority.',
      source: 'voice_transcribe_fallback',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Transcription error' },
      { status: 500 }
    );
  }
}

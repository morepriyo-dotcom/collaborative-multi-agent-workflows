import { NextRequest, NextResponse } from 'next/server';
import { processOmiWebhook } from '@/lib/omi/webhookHandler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await processOmiWebhook(body);

    return NextResponse.json({
      success: true,
      message: 'Omi webhook processed successfully',
      result,
    });
  } catch (err: any) {
    console.error('Error handling Omi webhook:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Invalid webhook payload' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/omi/webhook',
    instructions: 'Configure this webhook URL in the Omi App under Settings -> Explore -> Create an App.',
    supportedTriggers: ['realtime_transcript', 'memory_created', 'ping'],
  });
}

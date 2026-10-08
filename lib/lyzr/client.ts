/**
 * Lyzr Agent Studio API Client
 * Official integration for Lyzr Agent API v3
 * Base URL: https://agent-prod.studio.lyzr.ai/v3/
 */

const LYZR_BASE_URL = 'https://agent-prod.studio.lyzr.ai/v3';

export interface LyzrCreateAgentPayload {
  name: string;
  description: string;
  agent_role: string;
  agent_instructions: string;
  model?: string;
  tools?: string[];
}

export interface LyzrAgentResponse {
  agent_id: string;
  name: string;
  agent_role: string;
  created_at?: string;
}

export interface LyzrInferencePayload {
  user_id: string;
  agent_id: string;
  session_id: string;
  message: string;
}

export interface LyzrInferenceResponse {
  response: string;
  session_id?: string;
  agent_id?: string;
}

export async function checkLyzrHealth(): Promise<{
  connected: boolean;
  provider: 'lyzr_cloud' | 'lyzr_standby';
  message: string;
  apiKeyPresent: boolean;
}> {
  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey || apiKey === 'your_lyzr_api_key_here') {
    return {
      connected: false,
      provider: 'lyzr_standby',
      message: 'LYZR_API_KEY not configured. Running in Lyzr Autonomous Fallback Engine.',
      apiKeyPresent: false,
    };
  }

  try {
    const res = await fetch(`${LYZR_BASE_URL}/agents/`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return {
        connected: true,
        provider: 'lyzr_cloud',
        message: 'Lyzr Agent Studio v3 API connected successfully',
        apiKeyPresent: true,
      };
    } else {
      return {
        connected: false,
        provider: 'lyzr_standby',
        message: `Lyzr returned status ${res.status}: ${res.statusText}`,
        apiKeyPresent: true,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      provider: 'lyzr_standby',
      message: `Failed to connect to Lyzr: ${err?.message || 'Network error'}`,
      apiKeyPresent: true,
    };
  }
}

/**
 * Create or register an agent with Lyzr Agent Studio
 */
export async function createLyzrAgent(payload: LyzrCreateAgentPayload): Promise<LyzrAgentResponse | null> {
  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey || apiKey === 'your_lyzr_api_key_here') return null;

  try {
    const res = await fetch(`${LYZR_BASE_URL}/agents/`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        agent_role: payload.agent_role,
        agent_instructions: payload.agent_instructions,
        model: payload.model || 'gpt-4o',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        agent_id: data.agent_id || data.id,
        name: payload.name,
        agent_role: payload.agent_role,
        created_at: new Date().toISOString(),
      };
    } else {
      console.warn(`[Lyzr] Agent creation returned ${res.status}:`, await res.text());
      return null;
    }
  } catch (err) {
    console.error('[Lyzr] Failed to create agent:', err);
    return null;
  }
}

/**
 * Execute inference on a Lyzr Agent
 */
export async function runLyzrInference(payload: LyzrInferencePayload): Promise<LyzrInferenceResponse | null> {
  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey || apiKey === 'your_lyzr_api_key_here') return null;

  try {
    const res = await fetch(`${LYZR_BASE_URL}/inference/chat/`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        response: data.response || data.message || JSON.stringify(data),
        session_id: payload.session_id,
        agent_id: payload.agent_id,
      };
    } else {
      console.warn(`[Lyzr] Inference call returned ${res.status}:`, await res.text());
      return null;
    }
  } catch (err) {
    console.error('[Lyzr] Inference error:', err);
    return null;
  }
}

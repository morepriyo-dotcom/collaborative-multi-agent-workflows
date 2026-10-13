import { runLyzrInference } from '../lyzr/client';

export type LLMProvider = 'lyzr' | 'gemini' | 'openai' | 'local_heuristic';

export interface LLMRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
  agentRole?: string;
  agentId?: string;
}

export interface LLMExecutionResult {
  text: string;
  provider: LLMProvider;
  modelUsed: string;
}

/**
 * Execute LLM request via Lyzr Agent Studio, Google Gemini, OpenAI, or return empty for dynamic heuristic reasoner
 */
export async function executeAgentLLMWithMeta(options: LLMRequestOptions): Promise<LLMExecutionResult> {
  const { systemPrompt, userPrompt, responseFormat = 'json', agentId } = options;

  // 1. Lyzr Agent Studio (if configured)
  const lyzrKey = process.env.LYZR_API_KEY;
  if (lyzrKey && lyzrKey !== 'your_lyzr_api_key_here' && agentId) {
    try {
      const lyzrResponse = await runLyzrInference({
        user_id: 'flowmesh_user',
        agent_id: agentId,
        session_id: `flowmesh_session_${Date.now()}`,
        message: `${systemPrompt}\n\nTask:\n${userPrompt}`,
      });

      if (lyzrResponse?.response) {
        return {
          text: lyzrResponse.response,
          provider: 'lyzr',
          modelUsed: 'Lyzr Agent Studio v3 (gpt-4o)',
        };
      }
    } catch (err) {
      console.warn('[LLM] Lyzr Agent Studio request failed, falling through:', err);
    }
  }

  // 2. Google Gemini API (if configured)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: responseFormat === 'json' ? 'application/json' : 'text/plain',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            text,
            provider: 'gemini',
            modelUsed: 'Google Gemini 2.0 Flash',
          };
        }
      }
    } catch (err) {
      console.warn('[LLM] Gemini request failed, falling through:', err);
    }
  }

  // 3. OpenAI API (if configured)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          ...(responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return {
            text: content,
            provider: 'openai',
            modelUsed: 'OpenAI GPT-4o-mini',
          };
        }
      }
    } catch (err) {
      console.warn('[LLM] OpenAI request failed:', err);
    }
  }

  // 4. Local Dynamic Heuristic Engine (no external LLM keys)
  return {
    text: '',
    provider: 'local_heuristic',
    modelUsed: 'FlowMesh Semantic Reasoner (Demo Mode)',
  };
}

export async function executeAgentLLM(options: LLMRequestOptions): Promise<string> {
  const result = await executeAgentLLMWithMeta(options);
  return result.text;
}

/**
 * FlowMesh AI LLM & Agent Runner
 * Dispatches to Lyzr Agent Studio, Google Gemini, OpenAI, or Domain Reasoning Engine.
 */

export interface LLMRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
}

export async function executeAgentLLM(options: LLMRequestOptions): Promise<string> {
  const { systemPrompt, userPrompt, responseFormat = 'json' } = options;

  // 1. Try Gemini if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
        if (text) return text;
      }
    } catch (err) {
      console.warn('[LLM] Gemini request failed, evaluating fallback:', err);
    }
  }

  // 2. Try OpenAI if OPENAI_API_KEY is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
        if (content) return content;
      }
    } catch (err) {
      console.warn('[LLM] OpenAI request failed:', err);
    }
  }

  // 3. Fallback: Return empty to trigger high-fidelity deterministic domain reasoner
  return '';
}

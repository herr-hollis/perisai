import axios from 'axios';

const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN_MODEL = 'qwen-plus';

const SYSTEM_PROMPT = `You are a call analysis assistant helping to detect phone scams.
Given a call transcript, produce a concise summary with three sections:
1. Summary — what the call was about in 2–3 sentences.
2. Suspicious Signals — bullet list of any red flags (urgency, requests for money/OTP/personal data, impersonation, threats). Write "None detected" if clean.
3. Risk Level — one of: LOW | MEDIUM | HIGH, with a one-line reason.

Be objective. Focus on protecting users from scams.`;

/**
 * Sends a call transcript to Alibaba Qwen and returns a structured summary.
 * @param {string} transcript - Full call transcript text
 * @returns {Promise<{ summary: string, error: string|null }>}
 */
export async function summarizeCallLogs(transcript) {
  const apiKey = import.meta.env.VITE_ALIBABA_API_KEY;

  if (!apiKey) {
    return { summary: null, error: 'VITE_ALIBABA_API_KEY is not set in environment variables.' };
  }

  if (!transcript || transcript.trim().length === 0) {
    return { summary: null, error: 'Transcript is empty.' };
  }

  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: QWEN_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Call transcript:\n\n${transcript}` },
        ],
        max_tokens: 512,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const summary = response.data.choices?.[0]?.message?.content ?? '';
    return { summary, error: null };
  } catch (err) {
    const message = err.response?.data?.error?.message ?? err.message;
    return { summary: null, error: `Qwen API error: ${message}` };
  }
}

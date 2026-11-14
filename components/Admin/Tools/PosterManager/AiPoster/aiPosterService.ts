import type { AiPosterGenerateRequest, AiPosterGenerateResponse, AiPosterGeneralInfo } from './types';

const AI_POSTER_API_URL = import.meta.env.VITE_AI_POSTER_API_URL || 'http://localhost:3007';

/** Keep real assets for the server (edits API), but cap count to stay within payload limits. */
function prepareInfoForApi(info: AiPosterGeneralInfo): AiPosterGeneralInfo {
  return {
    ...info,
    themes: (info.themes || []).map((t) => t.trim()).filter(Boolean).slice(0, 12),
    speakers: info.speakers
      .filter((s) => s.enabled)
      .slice(0, 4)
      .map((s) => ({ ...s })),
    organizerLogos: info.organizerLogos.slice(0, 4),
    partnerLogos: info.partnerLogos.slice(0, 6),
  };
}

export async function generateAiPoster(
  payload: AiPosterGenerateRequest,
): Promise<AiPosterGenerateResponse> {
  const response = await fetch(`${AI_POSTER_API_URL}/api/ai-poster/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      info: prepareInfoForApi(payload.info),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : `AI poster generation failed (${response.status})`,
    );
  }

  if (!data?.imageBase64) {
    throw new Error('AI poster response did not include an image.');
  }

  return data as AiPosterGenerateResponse;
}

export function toImageDataUrl(base64: string, mimeType = 'image/png') {
  if (base64.startsWith('data:')) return base64;
  return `data:${mimeType};base64,${base64}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

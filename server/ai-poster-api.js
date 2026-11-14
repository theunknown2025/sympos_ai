/**
 * OpenAI-powered AI poster generation API.
 * Run: npm run ai-poster-server
 *
 * Prompt architecture lives in buildAiPosterPromptShared.js
 * (modular sections + semantic image references).
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  buildAiPosterPrompt,
  collectReferenceImages,
} from '../components/Admin/Tools/PosterManager/AiPoster/buildAiPosterPromptShared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const ENV_FILE_PATH = join(ROOT, '.env');
const ENV_LOCAL_PATH = join(ROOT, '.env.local');

function readEnv(key) {
  const raw = process.env[key];
  if (raw == null || raw === '') return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

function loadEnvFiles() {
  if (existsSync(ENV_FILE_PATH)) {
    dotenv.config({ path: ENV_FILE_PATH, override: true });
  } else {
    console.warn(`[ai-poster] Missing ${ENV_FILE_PATH} — copy .env.example → .env`);
  }
  if (existsSync(ENV_LOCAL_PATH)) {
    dotenv.config({ path: ENV_LOCAL_PATH, override: true });
  }
}

loadEnvFiles();

const PORT = readEnv('AI_POSTER_SERVER_PORT') || 3007;
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY');
const OPENAI_IMAGE_MODEL = readEnv('OPENAI_IMAGE_MODEL') || 'gpt-image-1';

const app = express();
app.use(
  cors({
    origin: readEnv('VITE_APP_URL') || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '25mb' }));

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) return null;
  return {
    mimeType: match[1] || 'image/png',
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function extFromMime(mime) {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'png';
}

function pickImageSize(widthPx, heightPx) {
  const ratio = widthPx / Math.max(heightPx, 1);
  if (Math.abs(ratio - 1) < 0.08) return '1024x1024';
  if (ratio < 1) return '1024x1536';
  return '1536x1024';
}

async function extractImagePayload(data) {
  const imageBase64 = data?.data?.[0]?.b64_json;
  if (imageBase64) {
    return {
      imageBase64,
      mimeType: 'image/png',
      revisedPrompt: data?.data?.[0]?.revised_prompt,
    };
  }

  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) return null;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const buf = Buffer.from(await imgRes.arrayBuffer());
  return {
    imageBase64: buf.toString('base64'),
    mimeType: imgRes.headers.get('content-type') || 'image/png',
    revisedPrompt: data?.data?.[0]?.revised_prompt,
  };
}

async function generateWithReferences({ apiKey, imageModel, prompt, size, references }) {
  const form = new FormData();
  form.append('model', imageModel);
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('n', '1');

  // Preserve IMAGE N order from semantic references
  const ordered = [...references].sort((a, b) => a.index - b.index);
  for (const ref of ordered) {
    const ext = extFromMime(ref.asset.mimeType);
    const blob = new Blob([ref.asset.buffer], { type: ref.asset.mimeType });
    form.append('image[]', blob, `${ref.role}-${ref.index}.${ext}`);
  }

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  return { response, data, mode: 'edits' };
}

async function generateFromPrompt({ apiKey, imageModel, prompt, size }) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      size,
      ...(imageModel.startsWith('dall-e')
        ? { response_format: 'b64_json', n: 1, quality: 'standard' }
        : { n: 1 }),
    }),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data, mode: 'generations' };
}

app.get('/api/ai-poster/health', (_req, res) => {
  loadEnvFiles();
  const apiKey = readEnv('OPENAI_API_KEY');
  res.json({
    ok: true,
    hasApiKey: Boolean(apiKey),
    model: readEnv('OPENAI_IMAGE_MODEL') || OPENAI_IMAGE_MODEL,
    envFile: existsSync(ENV_FILE_PATH),
  });
});

/** Debug: inspect assembled prompt without spending an image generation. */
app.post('/api/ai-poster/prompt-preview', (req, res) => {
  try {
    const { info, widthPx = 1024, heightPx = 1536 } = req.body || {};
    if (!info?.title || !String(info.title).trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    const references = collectReferenceImages(info, parseDataUrl);
    const prompt = buildAiPosterPrompt(info, widthPx, heightPx, references);
    return res.json({
      prompt,
      referenceSummary: references.map(({ index, role, name, priority, description }) => ({
        index,
        role,
        name,
        priority,
        description,
      })),
      charCount: prompt.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Prompt preview failed',
    });
  }
});

app.post('/api/ai-poster/generate', async (req, res) => {
  try {
    loadEnvFiles();
    const apiKey = readEnv('OPENAI_API_KEY');
    const imageModel = readEnv('OPENAI_IMAGE_MODEL') || OPENAI_IMAGE_MODEL;

    if (!apiKey) {
      return res.status(500).json({
        error:
          'OPENAI_API_KEY is not configured. Add it to your .env file and restart the AI poster server.',
      });
    }

    const { info, widthPx = 1024, heightPx = 1536 } = req.body || {};
    if (!info?.title || !String(info.title).trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const references = collectReferenceImages(info, parseDataUrl);
    const prompt = buildAiPosterPrompt(info, widthPx, heightPx, references);
    const size = pickImageSize(Number(widthPx) || 1024, Number(heightPx) || 1536);

    let result;
    if (references.length > 0 && !imageModel.startsWith('dall-e')) {
      result = await generateWithReferences({
        apiKey,
        imageModel,
        prompt,
        size,
        references,
      });

      if (!result.response.ok) {
        console.warn(
          '[ai-poster] edits failed, falling back to generations:',
          result.data?.error?.message || result.response.status,
        );
        result = await generateFromPrompt({ apiKey, imageModel, prompt, size });
      }
    } else {
      result = await generateFromPrompt({ apiKey, imageModel, prompt, size });
    }

    const { response, data, mode } = result;
    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        `OpenAI image generation failed (${response.status})`;
      return res.status(response.status).json({ error: String(message) });
    }

    const payload = await extractImagePayload(data);
    if (!payload) {
      return res.status(502).json({
        error: 'OpenAI did not return image bytes.',
      });
    }

    return res.json({
      ...payload,
      model: `${imageModel}:${mode}`,
      usedReferences: references.length,
    });
  } catch (err) {
    console.error('[ai-poster]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unexpected AI poster server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`[ai-poster] listening on http://localhost:${PORT}`);
  console.log(`[ai-poster] env=${ENV_FILE_PATH}`);
  console.log(
    `[ai-poster] model=${OPENAI_IMAGE_MODEL} key=${OPENAI_API_KEY ? `set (${OPENAI_API_KEY.slice(0, 7)}…)` : 'MISSING'}`,
  );
});

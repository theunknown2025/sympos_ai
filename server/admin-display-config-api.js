/**
 * Persists Sympos-ia admin display preferences into the user's Cursor MCP config file
 * (typically %USERPROFILE%\.cursor\mcp.json) under a dedicated top-level key so MCP
 * server entries stay intact.
 *
 * Run alongside Vite: npm run admin-display-server
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.ADMIN_DISPLAY_SERVER_PORT || 3004;
const MCP_JSON_PATH =
  process.env.ADMIN_DISPLAY_MCP_JSON_PATH ||
  join(os.homedir(), '.cursor', 'mcp.json');

const app = express();
app.use(
  cors({
    origin: process.env.VITE_APP_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '32kb' }));

function isValidUserId(id) {
  return typeof id === 'string' && id.length > 0 && id.length < 200;
}

function isValidLanguage(lang) {
  return lang === 'en' || lang === 'fr';
}

async function readMcpJson() {
  const raw = await fs.readFile(MCP_JSON_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeMcpJson(data) {
  const text = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(MCP_JSON_PATH, text, 'utf8');
}

app.get('/api/admin-display-config', async (req, res) => {
  const userId = req.query.userId;
  if (!isValidUserId(userId)) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }
  try {
    const data = await readMcpJson();
    const lang =
      data?.symposIa?.adminDisplay?.users?.[userId]?.language ?? 'en';
    const language = isValidLanguage(lang) ? lang : 'en';
    return res.json({ language });
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return res.status(404).json({
        error: `MCP config not found at ${MCP_JSON_PATH}. Create it or set ADMIN_DISPLAY_MCP_JSON_PATH.`,
      });
    }
    console.error('admin-display-config GET', e);
    return res.status(500).json({ error: 'Could not read MCP config' });
  }
});

app.put('/api/admin-display-config', async (req, res) => {
  const { userId, language } = req.body || {};
  if (!isValidUserId(userId) || !isValidLanguage(language)) {
    return res.status(400).json({ error: 'Invalid userId or language' });
  }
  try {
    const data = await readMcpJson();
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return res.status(500).json({ error: 'Invalid MCP JSON root' });
    }
    if (!data.symposIa || typeof data.symposIa !== 'object') {
      data.symposIa = {};
    }
    if (!data.symposIa.adminDisplay || typeof data.symposIa.adminDisplay !== 'object') {
      data.symposIa.adminDisplay = { users: {} };
    }
    if (!data.symposIa.adminDisplay.users || typeof data.symposIa.adminDisplay.users !== 'object') {
      data.symposIa.adminDisplay.users = {};
    }
    data.symposIa.adminDisplay.users[userId] = { language };
    await writeMcpJson(data);
    return res.json({ ok: true, language });
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return res.status(404).json({
        error: `MCP config not found at ${MCP_JSON_PATH}. Create it or set ADMIN_DISPLAY_MCP_JSON_PATH.`,
      });
    }
    console.error('admin-display-config PUT', e);
    return res.status(500).json({ error: 'Could not update MCP config' });
  }
});

app.listen(PORT, () => {
  console.log(`Admin display config API on http://localhost:${PORT}`);
  console.log(`MCP JSON path: ${MCP_JSON_PATH}`);
});

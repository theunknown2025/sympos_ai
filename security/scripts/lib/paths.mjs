import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '../../..');
export const resultsDir = path.join(repoRoot, 'public', 'security-results');
export const configPath = path.join(repoRoot, 'security', 'config', 'checks.json');

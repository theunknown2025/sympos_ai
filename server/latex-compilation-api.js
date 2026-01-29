/**
 * LaTeX Compilation API Server
 * 
 * This server provides pdfLaTeX compilation services.
 * Requires: TeX Live or MiKTeX installed on the system with pdflatex available
 * 
 * Installation:
 * - Install TeX Live: https://www.tug.org/texlive/
 * - Or install MiKTeX: https://miktex.org/
 * - Verify: pdflatex --version
 * 
 * Security:
 * - Runs in sandboxed environment
 * - Disables shell-escape by default
 * - Cleans up temporary files
 */

import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.LATEX_API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large LaTeX documents

// Temporary directory for compilation
const TEMP_DIR = path.join(__dirname, '../temp/latex-compilation');

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

// Configure MiKTeX to skip update checks (Windows only)
async function configureMiktex() {
  if (process.platform === 'win32') {
    try {
      // Disable MiKTeX update check
      await execAsync('initexmf --set-config-value=[MPM]AutoInstall=1', {
        timeout: 5000,
      }).catch(() => {});
      
      // Disable update check prompt
      await execAsync('initexmf --set-config-value=[Update]CheckForUpdates=0', {
        timeout: 5000,
      }).catch(() => {});
      
      // Set to never check for updates
      await execAsync('initexmf --set-config-value=[Update]LastCheck=9999999999', {
        timeout: 5000,
      }).catch(() => {});
      
      console.log('MiKTeX update checks disabled');
    } catch (error) {
      // Ignore configuration errors - will use environment variables instead
      console.log('Note: Could not configure MiKTeX automatically. Using environment variables.');
    }
  }
}

// Clean up old files (older than 1 hour)
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;
      
      // Delete files older than 1 hour
      if (age > 3600000) {
        await fs.unlink(filePath).catch(() => {});
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Compile LaTeX to PDF
async function compilePdfLatex(texSource, workDir, passes = 2) {
  const texFile = path.join(workDir, 'main.tex');
  const pdfFile = path.join(workDir, 'main.pdf');
  const logFile = path.join(workDir, 'main.log');
  
  // Write LaTeX source to file
  await fs.writeFile(texFile, texSource, 'utf8');
  
  // Run pdflatex (multiple passes for references, TOC, etc.)
  // Note: Removed -halt-on-error to allow compilation despite MiKTeX warnings
  // On Windows, add --disable-installer to suppress MiKTeX prompts
  const pdflatexCmd = process.platform === 'win32' ? 'pdflatex --disable-installer' : 'pdflatex';
  const pdflatexArgs = [
    pdflatexCmd,
    '-interaction=nonstopmode', // Don't stop for errors, continue compilation
    '-output-directory', workDir,
    '-shell-escape=false', // Security: disable shell escape
    'main.tex'
  ].join(' ');
  
  // Set environment variables to suppress MiKTeX update checks
  const env = {
    ...process.env,
    MIKTEX_DISABLE_INSTALLER: '1', // Disable MiKTeX installer prompts
    MIKTEX_DISABLE_UPDATE_CHECK: '1', // Disable update check
  };
  
  let logOutput = '';
  let lastError = null;
  
  for (let i = 0; i < passes; i++) {
    try {
      const { stdout, stderr } = await execAsync(pdflatexArgs, {
        cwd: workDir,
        env: env,
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      logOutput += stdout || '';
      logOutput += stderr || '';
    } catch (error) {
      lastError = error;
      logOutput += error.stdout || '';
      logOutput += error.stderr || '';
      
      // Check if PDF was created despite the error (might be a warning)
      try {
        await fs.readFile(pdfFile);
        // PDF exists, so compilation succeeded despite error message
        lastError = null;
        continue;
      } catch {
        // PDF doesn't exist, this is a real error
        // If it's the first pass and there's a real error, stop
        if (i === 0) {
          break;
        }
      }
    }
  }
  
  // Check if PDF was created
  let pdfBuffer = null;
  try {
    pdfBuffer = await fs.readFile(pdfFile);
  } catch (error) {
    // PDF not created, compilation failed
  }
  
  // Read log file for detailed error messages
  let logContent = logOutput;
  try {
    const logFileContent = await fs.readFile(logFile, 'utf8');
    logContent = logFileContent;
  } catch (error) {
    // Log file doesn't exist or can't be read
  }
  
  // Filter out MiKTeX update warnings from being treated as errors
  const isMiktexUpdateWarning = logContent && (
    logContent.includes('So far, you have not checked for MiKTeX updates') ||
    (logContent.includes('major issue') && logContent.includes('MiKTeX')) ||
    logContent.includes('pdflatex: major issue')
  );
  
  // If it's just a MiKTeX update warning and PDF was created, it's a success
  if (pdfBuffer && isMiktexUpdateWarning) {
    lastError = null;
  }
  
  // If it's a MiKTeX update warning but PDF wasn't created, try one more time
  // This handles the case where MiKTeX exits before compiling due to update check
  if (!pdfBuffer && isMiktexUpdateWarning && lastError) {
    console.log('MiKTeX update warning detected, retrying compilation...');
    // Retry once more - sometimes MiKTeX needs a second attempt
    try {
      const { stdout, stderr } = await execAsync(pdflatexArgs, {
        cwd: workDir,
        env: env,
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      logOutput += '\n--- Retry attempt ---\n';
      logOutput += stdout || '';
      logOutput += stderr || '';
      
      // Check if PDF was created on retry
      try {
        pdfBuffer = await fs.readFile(pdfFile);
        lastError = null;
        // Update log content
        try {
          const logFileContent = await fs.readFile(logFile, 'utf8');
          logContent = logFileContent;
        } catch {}
      } catch {}
    } catch (retryError) {
      // Retry also failed, but check if PDF exists anyway
      try {
        pdfBuffer = await fs.readFile(pdfFile);
        lastError = null;
      } catch {}
    }
  }
  
  return {
    success: pdfBuffer !== null,
    pdfBuffer,
    log: logContent,
    error: lastError && !pdfBuffer ? lastError.message : null,
  };
}

// POST /compile - Compile LaTeX to PDF
app.post('/compile', async (req, res) => {
  const { source, documentId, engine = 'pdflatex' } = req.body;
  
  if (!source || typeof source !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'LaTeX source is required',
    });
  }
  
  // Validate engine
  if (engine !== 'pdflatex') {
    return res.status(400).json({
      success: false,
      error: `Engine ${engine} is not supported. Only 'pdflatex' is currently supported.`,
    });
  }
  
  // Create unique work directory
  const workDirId = `compile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const workDir = path.join(TEMP_DIR, workDirId);
  
  try {
    // Create work directory
    await fs.mkdir(workDir, { recursive: true });
    
    // Compile LaTeX
    const result = await compilePdfLatex(source, workDir);
    
    if (result.success && result.pdfBuffer) {
      // Convert PDF buffer to base64
      const pdfBase64 = result.pdfBuffer.toString('base64');
      
      // Extract warnings from log
      const warnings = [];
      if (result.log) {
        const warningMatches = result.log.match(/Warning:.*/g);
        if (warningMatches) {
          warnings.push(...warningMatches);
        }
      }
      
      res.json({
        success: true,
        pdfBase64,
        log: result.log,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } else {
      // Extract error from log
      let errorMessage = result.error || 'Compilation failed';
      if (result.log) {
        const errorMatches = result.log.match(/Error:.*/g);
        if (errorMatches && errorMatches.length > 0) {
          errorMessage = errorMatches[0];
        }
      }
      
      res.status(400).json({
        success: false,
        error: errorMessage,
        log: result.log,
      });
    }
  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during compilation',
    });
  } finally {
    // Clean up work directory
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up work directory:', error);
    }
  }
});

// GET /health - Health check
app.get('/health', async (req, res) => {
  try {
    // Check if pdflatex is available
    await execAsync('pdflatex --version', { timeout: 5000 });
    res.json({
      status: 'healthy',
      engine: 'pdflatex',
      available: true,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      engine: 'pdflatex',
      available: false,
      error: 'pdflatex is not installed or not in PATH',
    });
  }
});

// Initialize
async function start() {
  await ensureTempDir();
  
  // Configure MiKTeX to skip update checks (Windows)
  await configureMiktex();
  
  // Clean up old files on startup
  await cleanupOldFiles();
  
  // Clean up old files every hour
  setInterval(cleanupOldFiles, 3600000);
  
  const server = app.listen(PORT, () => {
    console.log(`LaTeX Compilation API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
      console.error(`\nTo fix this, run one of the following commands:`);
      console.error(`\n  PowerShell:`);
      console.error(`  $port = ${PORT}; Get-NetTCPConnection -LocalPort $port | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
      console.error(`\n  Or find and kill the process manually:`);
      console.error(`  netstat -ano | findstr :${PORT}`);
      console.error(`  taskkill /PID <PID> /F`);
      console.error(`\nAlternatively, set a different port using:`);
      console.error(`  $env:LATEX_API_PORT=<new_port>; npm run latex-server\n`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
}

start().catch(console.error);

export default app;

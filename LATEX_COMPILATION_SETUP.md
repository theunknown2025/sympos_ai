# LaTeX Compilation Setup Guide

This guide explains how to set up pdfLaTeX compilation for the LaTeX Editor.

## Overview

The LaTeX Editor now supports full pdfLaTeX compilation, allowing users to:
- ✅ Compile LaTeX documents to PDF
- ✅ View PDF preview in the browser
- ✅ Download compiled PDFs
- ✅ See compilation errors and warnings
- ✅ Switch between MathJax preview (quick) and PDF preview (full)

## Prerequisites

### 1. Install TeX Distribution

You need to install a TeX distribution that includes `pdflatex`:

**Option A: TeX Live (Recommended for Linux/Mac)**
```bash
# Linux (Ubuntu/Debian)
sudo apt-get install texlive-full

# Mac (using Homebrew)
brew install --cask mactex

# Or download from: https://www.tug.org/texlive/
```

**Option B: MiKTeX (Recommended for Windows)**
- Download from: https://miktex.org/download
- Install with default settings
- Ensure "Add MiKTeX to PATH" is checked during installation

### 2. Verify Installation

After installation, verify that `pdflatex` is available:

```bash
pdflatex --version
```

You should see version information. If not, add TeX to your PATH.

## Setup Steps

### Step 1: Start the LaTeX Compilation API Server

The LaTeX compilation server runs on port 3002 by default.

**Option A: Run separately**
```bash
npm run latex-server
```

**Option B: Run with all services**
```bash
npm run dev:all
```

This will start:
- Vite dev server on `http://localhost:3000`
- Email API server on `http://localhost:3001`
- LaTeX compilation API on `http://localhost:3002`

### Step 2: Configure Environment Variables (Optional)

Create or update `.env` file:

```env
# LaTeX Compilation API URL (default: http://localhost:3002)
VITE_LATEX_API_URL=http://localhost:3002

# LaTeX Compilation API Port (default: 3002)
LATEX_API_PORT=3002
```

### Step 3: Verify Setup

1. Check health endpoint:
   ```bash
   curl http://localhost:3002/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "engine": "pdflatex",
     "available": true
   }
   ```

2. Open the LaTeX Editor:
   - Navigate to **Participant → Tools → LaTeX Editor**
   - Create a new document
   - Click **"Compile PDF"** button

## Usage

### Compiling LaTeX Documents

1. **Write LaTeX code** in the editor
2. **Click "Compile PDF"** button (green button with play icon)
3. **Wait for compilation** (usually 1-5 seconds)
4. **View PDF** in the preview pane (switch to "PDF" tab)
5. **Download PDF** using the "Download" button

### Preview Modes

The editor supports two preview modes:

1. **MathJax Preview** (default):
   - Instant rendering
   - Supports math expressions
   - Limited LaTeX features
   - Good for quick feedback

2. **PDF Preview**:
   - Full LaTeX compilation
   - Complete document support
   - Requires compilation
   - Best for final output

### Example LaTeX Document

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}

\title{My First Document}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}
This is a sample LaTeX document.

\section{Mathematics}
Here's some math: $E = mc^2$

And display math:
\begin{equation}
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
\end{equation}

\end{document}
```

## API Endpoints

### Health Check
```
GET /health
```

Returns compilation service status.

### Compile LaTeX
```
POST /compile
Content-Type: application/json

{
  "source": "\\documentclass{article}\\begin{document}Hello\\end{document}",
  "documentId": "optional-doc-id",
  "engine": "pdflatex"
}
```

Response:
```json
{
  "success": true,
  "pdfBase64": "base64-encoded-pdf",
  "log": "compilation log...",
  "warnings": ["Warning: ..."]
}
```

## Troubleshooting

### "pdflatex is not installed"

**Error:** `pdflatex is not installed or not in PATH`

**Solution:**
1. Install TeX Live or MiKTeX (see Prerequisites)
2. Verify installation: `pdflatex --version`
3. Restart the LaTeX compilation server

### Compilation Timeout

**Error:** Compilation takes too long or times out

**Solution:**
- Large documents may take longer
- Check the compilation log for errors
- Simplify the document to test
- Increase timeout in `server/latex-compilation-api.js` if needed

### PDF Not Displaying

**Error:** PDF preview shows blank or error

**Solution:**
1. Check browser console for errors
2. Verify PDF was created successfully
3. Try downloading the PDF instead
4. Check compilation log for errors

### Port Already in Use

**Error:** Port 3002 already in use

**Solution:**
1. Change `LATEX_API_PORT` in `.env`
2. Or stop the process using port 3002:
   ```bash
   # Windows
   netstat -ano | findstr :3002
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3002 | xargs kill
   ```

## Security Considerations

The LaTeX compilation server includes security measures:

- ✅ **Shell escape disabled** - Prevents arbitrary code execution
- ✅ **Temporary file cleanup** - Files are deleted after compilation
- ✅ **Timeout protection** - 30 second timeout per compilation
- ✅ **Resource limits** - 10MB buffer limit
- ✅ **Sandboxed execution** - Runs in isolated temp directory

## Production Deployment

For production:

1. **Install TeX Live** on your server
2. **Set environment variables**:
   ```env
   LATEX_API_PORT=3002
   VITE_LATEX_API_URL=https://your-domain.com/latex-api
   ```
3. **Use reverse proxy** (Nginx/Apache) to route `/api/latex` to the compilation server
4. **Monitor resource usage** - LaTeX compilation can be CPU/memory intensive
5. **Consider rate limiting** - Prevent abuse

## Performance Tips

- **Cache compiled PDFs** - Store compiled PDFs for unchanged documents
- **Use CDN** - Serve compiled PDFs from CDN if possible
- **Limit concurrent compilations** - Queue requests if needed
- **Optimize LaTeX documents** - Use efficient packages and avoid heavy graphics

## Next Steps

- Add support for XeLaTeX and LuaLaTeX engines
- Implement PDF caching
- Add bibliography support (BibTeX)
- Support for included images and files
- Real-time compilation on save

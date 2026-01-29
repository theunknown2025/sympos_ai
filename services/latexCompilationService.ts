import { supabase } from '../supabase';

export interface CompilationResult {
  success: boolean;
  pdfUrl?: string;
  pdfBlob?: Blob;
  error?: string;
  log?: string;
  warnings?: string[];
}

/**
 * Compile LaTeX source to PDF using server-side compilation
 * This requires a backend API endpoint that runs pdfLaTeX
 */
export const compileLatexToPDF = async (
  latexSource: string,
  documentId?: string
): Promise<CompilationResult> => {
  try {
    // Call backend API for pdfLaTeX compilation
    // Use proxy path in development, or direct URL if VITE_LATEX_API_URL is set
    const apiUrl = import.meta.env.VITE_LATEX_API_URL || '/api/latex';
    const response = await fetch(`${apiUrl}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: latexSource,
        documentId,
        engine: 'pdflatex',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Compilation failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // Convert base64 PDF to Blob if needed
      let pdfBlob: Blob | undefined;
      if (result.pdfBase64) {
        const binaryString = atob(result.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      }

      return {
        success: true,
        pdfUrl: result.pdfUrl,
        pdfBlob,
        log: result.log,
        warnings: result.warnings,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Compilation failed',
        log: result.log,
        warnings: result.warnings,
      };
    }
  } catch (error: any) {
    console.error('Error compiling LaTeX:', error);
    return {
      success: false,
      error: error.message || 'Failed to compile LaTeX document',
    };
  }
};

/**
 * Quick preview using latex.js (browser-based, limited but fast)
 * This provides instant feedback but doesn't support all LaTeX features
 */
export const previewLatexWithLatexJS = async (
  latexSource: string
): Promise<{ html: string; error?: string }> => {
  try {
    // Dynamic import of latex.js
    const { LaTeX } = await import('latex.js');
    
    // Create a LaTeX processor
    const latex = new LaTeX({
      hyphenate: false,
    });

    // Parse and convert to HTML
    const html = latex.parseAndRender(latexSource);
    
    return { html };
  } catch (error: any) {
    console.error('Error previewing LaTeX with latex.js:', error);
    return {
      html: '',
      error: error.message || 'Failed to preview LaTeX',
    };
  }
};

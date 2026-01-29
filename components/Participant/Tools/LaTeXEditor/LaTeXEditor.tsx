import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  fetchLatexDocuments,
  saveLatexDocument,
  updateLatexDocument,
  deleteLatexDocument,
  LatexDocument,
} from '../../../../services/latexDocumentService';
import { Plus, FileText, Edit2, Trash2, Save, X, Loader2, Eye, EyeOff, Split, Play, Download, AlertCircle } from 'lucide-react';
import { compileLatexToPDF, CompilationResult } from '../../../../services/latexCompilationService';

// MathJax type declarations
declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        document?: any;
      };
    };
  }
}

const LaTeXEditor: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<LatexDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LatexDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<'split' | 'preview'>('split');
  const [previewType, setPreviewType] = useState<'mathjax' | 'pdf'>('mathjax');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const mathJaxLoaded = useRef(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadDocuments();
    }
  }, [currentUser?.id]);

  // Load MathJax for LaTeX rendering
  useEffect(() => {
    if (!mathJaxLoaded.current && !document.getElementById('MathJax-script')) {
      // Configure MathJax before loading the script
      const mathJaxConfig = document.createElement('script');
      mathJaxConfig.type = 'text/x-mathjax-config';
      mathJaxConfig.text = `
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true,
            processEnvironments: true
          },
          options: {
            ignoreHtmlClass: 'tex2jax_ignore',
            processHtmlClass: 'tex2jax_process'
          }
        };
      `;
      document.head.appendChild(mathJaxConfig);

      const mathJaxScript = document.createElement('script');
      mathJaxScript.id = 'MathJax-script';
      mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      mathJaxScript.async = true;
      mathJaxScript.onload = () => {
        mathJaxLoaded.current = true;
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise();
        }
      };
      document.head.appendChild(mathJaxScript);

      return () => {
        // Cleanup if needed
      };
    }
  }, []);

  // Update preview when content changes
  useEffect(() => {
    if (content && previewRef.current && mathJaxLoaded.current && window.MathJax && window.MathJax.typesetPromise) {
      // Small delay to debounce rapid changes
      const timeoutId = setTimeout(() => {
        if (previewRef.current && window.MathJax && window.MathJax.typesetPromise) {
          // Wrap content in a div with proper classes for MathJax processing
          const processedContent = content
            .replace(/\\documentclass\{[^}]+\}/g, '') // Remove documentclass for preview
            .replace(/\\begin\{document\}/g, '')
            .replace(/\\end\{document\}/g, '')
            .replace(/\\usepackage\{[^}]+\}/g, ''); // Remove usepackage for preview
          
          previewRef.current.innerHTML = `<div class="tex2jax_process">${processedContent}</div>`;
          
          window.MathJax.typesetPromise([previewRef.current]).catch((err: any) => {
            console.error('MathJax rendering error:', err);
            // Fallback: show raw content if MathJax fails
            if (previewRef.current) {
              previewRef.current.innerHTML = `<pre class="text-slate-600 whitespace-pre-wrap">${content}</pre>`;
            }
          });
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else if (previewRef.current) {
      previewRef.current.innerHTML = content || '<p class="text-slate-400 italic">No content</p>';
    }
  }, [content]);

  const loadDocuments = async () => {
    if (!currentUser?.id) return;
    try {
      setIsLoading(true);
      setError(null);
      const docs = await fetchLatexDocuments(currentUser.id);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDocument = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedDocument(null);
    setTitle('');
    setContent('');
    setError(null);
  };

  const handleSelectDocument = (doc: LatexDocument) => {
    setSelectedDocument(doc);
    setIsEditing(false);
    setIsCreating(false);
    setTitle(doc.title);
    setContent(doc.content);
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    if (isCreating) {
      setIsCreating(false);
      setIsEditing(false);
      setSelectedDocument(null);
      setTitle('');
      setContent('');
    } else {
      setIsEditing(false);
      if (selectedDocument) {
        setTitle(selectedDocument.title);
        setContent(selectedDocument.content);
      }
    }
    setError(null);
  };

  const handleSave = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to save documents');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (isCreating) {
        // Create new document
        const newDoc = await saveLatexDocument(currentUser.id, title, content);
        setDocuments([newDoc, ...documents]);
        setSelectedDocument(newDoc);
        setIsCreating(false);
        setIsEditing(false);
      } else if (selectedDocument) {
        // Update existing document
        const updatedDoc = await updateLatexDocument(selectedDocument.id, title, content);
        setDocuments(
          documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
        );
        setSelectedDocument(updatedDoc);
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save document');
      console.error('Error saving document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setIsDeleting(documentId);
      setError(null);
      await deleteLatexDocument(documentId);
      setDocuments(documents.filter((doc) => doc.id !== documentId));
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setTitle('');
        setContent('');
        setIsEditing(false);
        setIsCreating(false);
        setCompilationResult(null);
        setPdfUrl(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
      console.error('Error deleting document:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCompile = async () => {
    if (!content.trim()) {
      setError('Please enter some LaTeX content to compile');
      return;
    }

    try {
      setIsCompiling(true);
      setError(null);
      setCompilationResult(null);
      setPdfUrl(null);

      const result = await compileLatexToPDF(content, selectedDocument?.id);

      setCompilationResult(result);

      if (result.success && result.pdfBlob) {
        // Create object URL for PDF preview
        const url = URL.createObjectURL(result.pdfBlob);
        setPdfUrl(url);
        setPreviewType('pdf');
      } else {
        setError(result.error || 'Compilation failed');
        if (result.log) {
          console.error('Compilation log:', result.log);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to compile LaTeX document');
      console.error('Error compiling LaTeX:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadPDF = () => {
    if (compilationResult?.pdfBlob && selectedDocument) {
      const url = URL.createObjectURL(compilationResult.pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedDocument.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Cleanup PDF URL when component unmounts or document changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    // Reset compilation when document changes
    setCompilationResult(null);
    setPdfUrl(null);
    setPreviewType('mathjax');
  }, [selectedDocument?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">LaTeX Editor</h1>
        <p className="text-slate-600">Create and manage your LaTeX documents</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Documents List */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
            <button
              onClick={handleNewDocument}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="New Document"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No documents yet</p>
                <p className="text-xs mt-1">Click + to create a new document</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDocument?.id === doc.id
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => handleSelectDocument(doc)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Updated {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        disabled={isDeleting === doc.id}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {isDeleting === doc.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor and Preview */}
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm min-w-0">
          {selectedDocument || isCreating ? (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Document title"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-slate-900">{title || 'Untitled'}</h2>
                  )}
                  {isEditing && (
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                      <button
                        onClick={handleCompile}
                        disabled={isCompiling || !content.trim()}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        title="Compile LaTeX to PDF"
                      >
                        {isCompiling ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Compiling...
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            Compile PDF
                          </>
                        )}
                      </button>
                      {compilationResult?.success && (
                        <button
                          onClick={handleDownloadPDF}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                          title="Download PDF"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}
                      <div className="border-l border-slate-200 pl-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500 mr-1">Preview:</span>
                        <button
                          onClick={() => {
                            setPreviewType('mathjax');
                          }}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            previewType === 'mathjax'
                              ? 'bg-indigo-100 text-indigo-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          title="MathJax Preview (Quick)"
                        >
                          MathJax
                        </button>
                        <button
                          onClick={() => {
                            if (pdfUrl) {
                              setPreviewType('pdf');
                            } else {
                              setError('Please compile the document first to view PDF preview');
                            }
                          }}
                          disabled={!pdfUrl}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            previewType === 'pdf'
                              ? 'bg-indigo-100 text-indigo-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-100'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={pdfUrl ? "PDF Preview (Full Compilation)" : "Compile first to enable PDF preview"}
                        >
                          PDF {!pdfUrl && '(Compile first)'}
                        </button>
                      </div>
                      <button
                        onClick={() => setPreviewMode(previewMode === 'split' ? 'preview' : 'split')}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title={previewMode === 'split' ? 'Show preview only' : 'Show split view'}
                      >
                        <Split size={18} />
                      </button>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title={showPreview ? 'Hide preview' : 'Show preview'}
                      >
                        {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className={`flex-1 flex gap-4 p-4 overflow-hidden ${showPreview && previewMode === 'split' ? 'flex-row' : previewMode === 'preview' ? 'flex-col' : 'flex-row'}`}>
                  {/* Editor */}
                  <div className={`flex flex-col ${showPreview && previewMode === 'split' ? 'w-1/2' : previewMode === 'preview' ? 'hidden' : 'w-full'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Editor</label>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter your LaTeX code here...&#10;&#10;Example:&#10;\documentclass{article}&#10;\begin{document}&#10;Hello, \LaTeX!&#10;$$E = mc^2$$&#10;\end{document}"
                      className="flex-1 w-full font-mono text-sm border border-slate-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                  {/* Preview */}
                  {showPreview && (
                    <div className={`flex flex-col ${previewMode === 'split' ? 'w-1/2 border-l border-slate-200 pl-4' : 'w-full'}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                          {previewType === 'pdf' ? 'PDF Preview' : 'MathJax Preview'}
                        </label>
                        {compilationResult && !compilationResult.success && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle size={14} />
                            Compilation Error
                          </div>
                        )}
                      </div>
                      {previewType === 'pdf' ? (
                        pdfUrl ? (
                          <div className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-lg overflow-hidden">
                            <iframe
                              ref={pdfIframeRef}
                              src={pdfUrl}
                              className="w-full h-full min-h-[400px]"
                              title="PDF Preview"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-lg p-6 flex items-center justify-center">
                            <div className="text-center text-slate-500">
                              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                              <p className="text-sm font-medium mb-1">No PDF compiled yet</p>
                              <p className="text-xs">Click "Compile PDF" button above to generate a PDF preview</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div
                          ref={previewRef}
                          className="flex-1 w-full bg-white border border-slate-300 rounded-lg p-6 overflow-auto prose prose-sm max-w-none tex2jax_process"
                          style={{
                            minHeight: '400px',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            lineHeight: '1.6',
                          }}
                        >
                          {!content && (
                            <div className="text-slate-400 italic">
                              <p className="mb-2">Start typing to see preview...</p>
                              <p className="text-xs text-slate-500 mt-4">
                                <strong>Tip:</strong> MathJax supports inline math ($...$) and display math ($$...$$). 
                                Click "Compile PDF" to generate a full PDF document.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {compilationResult && !compilationResult.success && compilationResult.log && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-xs font-semibold text-red-900 mb-1">Compilation Errors:</div>
                          <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32 font-mono">
                            {compilationResult.log.split('\n').slice(-20).join('\n')}
                          </pre>
                        </div>
                      )}
                      {compilationResult?.warnings && compilationResult.warnings.length > 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-xs font-semibold text-yellow-900 mb-1">Warnings:</div>
                          <div className="text-xs text-yellow-700 space-y-1">
                            {compilationResult.warnings.slice(0, 5).map((warning, idx) => (
                              <div key={idx}>{warning}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-4 overflow-auto">
                  <div className="w-full font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
                    {content || (
                      <span className="text-slate-400 italic">No content</span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <FileText size={64} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium mb-2">No document selected</p>
                <p className="text-sm">Select a document from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaTeXEditor;

import React, { useState } from 'react';
import { FileText, Download, Eye, Settings } from 'lucide-react';

const Generator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');

  const templates = [
    { id: 'invoice', name: 'Invoice Template' },
    { id: 'receipt', name: 'Receipt Template' },
    { id: 'payment_confirmation', name: 'Payment Confirmation' },
  ];

  const handleGenerate = () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    // Mock generation - in real app, this would generate actual documents
    const mockContent = `Generated ${templates.find(t => t.id === selectedTemplate)?.name} content...`;
    setGeneratedContent(mockContent);
  };

  const handleDownload = () => {
    if (!generatedContent) {
      alert('Please generate content first');
      return;
    }
    // In real app, this would download the actual document
    alert('Download functionality will be implemented');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Generator</h1>
        <p className="text-slate-500 mt-2">Generate payment-related documents</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Select Template</h2>
          
          <div className="space-y-4">
            {templates.map((template) => (
              <label
                key={template.id}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={selectedTemplate === template.id}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <FileText size={20} className="text-slate-400" />
                <span className="text-slate-700 font-medium">{template.name}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleGenerate}
              disabled={!selectedTemplate}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Generate Document
            </button>
          </div>
        </div>

        {/* Generated Content Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!generatedContent}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          {generatedContent ? (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-[400px]">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                {generatedContent}
              </pre>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 bg-slate-50 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Eye size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Select a template and generate to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={20} className="text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Generator Settings</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Additional settings and customization options will be available here.
        </p>
      </div>
    </div>
  );
};

export default Generator;

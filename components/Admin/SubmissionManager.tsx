import React, { useState } from 'react';
import { MOCK_SUBMISSIONS } from '../../constants';
import { Submission, SubmissionStatus } from '../../types';
import { Search, Filter, Download, UserPlus, FileText, BrainCircuit, X } from 'lucide-react';
import { analyzeAbstract } from '../../services/geminiService';

const StatusBadge: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const colors = {
    [SubmissionStatus.SUBMITTED]: 'bg-slate-100 text-slate-700',
    [SubmissionStatus.UNDER_REVIEW]: 'bg-blue-100 text-blue-700',
    [SubmissionStatus.ACCEPTED]: 'bg-emerald-100 text-emerald-700',
    [SubmissionStatus.REVISION_REQUIRED]: 'bg-amber-100 text-amber-700',
    [SubmissionStatus.REJECTED]: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};

const SubmissionManager: React.FC = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string, rating: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (abstract: string) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const result = await analyzeAbstract(abstract);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const closeModal = () => {
    setSelectedSubmission(null);
    setAiAnalysis(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scientific Submissions</h1>
          <p className="text-slate-500 mt-1">Manage PhD papers, assign juries, and track reviews.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download size={18} /> Export CSV
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by title, author, or ID..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
          <Filter size={18} /> Track
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
          <Filter size={18} /> Status
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Title / Author</th>
                <th className="px-6 py-4">Track</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_SUBMISSIONS.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500">{sub.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{sub.title}</div>
                    <div className="text-slate-500 text-xs">{sub.author} • {sub.institution}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{sub.track}</span>
                  </td>
                  <td className="px-6 py-4">{sub.submittedDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedSubmission(sub)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-slate-400">{selectedSubmission.id}</span>
                  <StatusBadge status={selectedSubmission.status} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedSubmission.title}</h2>
                <p className="text-slate-500 text-sm mt-1">{selectedSubmission.author} • {selectedSubmission.institution}</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Abstract & AI */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800">Abstract</h3>
                  <button 
                    onClick={() => handleAnalyze(selectedSubmission.abstract)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                  >
                    <BrainCircuit size={14} />
                    {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                  </button>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {selectedSubmission.abstract}
                </p>

                {aiAnalysis && (
                  <div className="bg-white p-3 rounded border border-indigo-100 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-indigo-800 uppercase">Sympose AI Insights</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2"><span className="font-semibold">Summary:</span> {aiAnalysis.summary}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Relevance Score:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        aiAnalysis.rating.toLowerCase().includes('high') ? 'bg-green-100 text-green-700' : 
                        aiAnalysis.rating.toLowerCase().includes('low') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{aiAnalysis.rating}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Files */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Submitted Files</h3>
                <div className="flex gap-3">
                  {selectedSubmission.files.map(file => (
                    <div key={file} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <FileText size={16} className="text-slate-400" />
                      {file}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
               <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm">
                <UserPlus size={16} /> Assign Jury
               </button>
               <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm shadow-indigo-200">
                Update Status
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionManager;

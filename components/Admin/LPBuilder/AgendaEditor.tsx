import React, { useState, useEffect } from 'react';
import { AgendaDay, AgendaItem, Speaker } from '../../../types';
import { Plus, Trash2, ChevronUp, ChevronDown, Clock, Calendar, X, Download, Loader2, AlertCircle } from 'lucide-react';
import { getUserPrograms, type SavedProgram } from '../../../services/programService';
import { useAuth } from '../../../hooks/useAuth';

interface AgendaEditorProps {
  agenda: AgendaDay[];
  speakers: Speaker[];
  onChange: (agenda: AgendaDay[]) => void;
  programId?: string;
  showDownloadButton?: boolean;
  onProgramConfigChange?: (config: { programId?: string; showDownloadButton?: boolean }) => void;
}

const AgendaEditor: React.FC<AgendaEditorProps> = ({ 
  agenda, 
  speakers, 
  onChange, 
  programId, 
  showDownloadButton = false,
  onProgramConfigChange 
}) => {
  const { currentUser } = useAuth();
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && onProgramConfigChange) {
      loadPrograms();
    }
  }, [currentUser]);

  const loadPrograms = async () => {
    if (!currentUser?.id) return;

    try {
      setLoadingPrograms(true);
      setError(null);
      const data = await getUserPrograms(currentUser.id);
      setPrograms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load programs');
      console.error('Error loading programs:', err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleProgramChange = (newProgramId: string) => {
    if (onProgramConfigChange) {
      onProgramConfigChange({ programId: newProgramId, showDownloadButton });
    }
  };

  const handleDownloadButtonToggle = (show: boolean) => {
    if (onProgramConfigChange) {
      onProgramConfigChange({ programId, showDownloadButton: show });
    }
  };

  const addDay = () => {
    const newDay: AgendaDay = { id: Date.now().toString(), label: `Day ${agenda.length + 1}`, date: '', items: [] };
    onChange([...agenda, newDay]);
    setExpandedDayId(newDay.id);
  };

  const removeDay = (id: string) => {
    onChange(agenda.filter(d => d.id !== id));
  };

  const updateDay = (id: string, field: keyof AgendaDay, value: any) => {
    onChange(agenda.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addItem = (dayId: string) => {
    const day = agenda.find(d => d.id === dayId);
    if (day) {
      const newItem: AgendaItem = { id: Date.now().toString(), startTime: '09:00', endTime: '10:00', title: 'New Activity', description: '', location: '' };
      updateDay(dayId, 'items', [...day.items, newItem]);
    }
  };

  const updateItem = (dayId: string, itemId: string, field: keyof AgendaItem, value: any) => {
    const day = agenda.find(d => d.id === dayId);
    if (day) {
      const updatedItems = day.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
      updateDay(dayId, 'items', updatedItems);
    }
  };

  const removeItem = (dayId: string, itemId: string) => {
    const day = agenda.find(d => d.id === dayId);
    if (day) {
      updateDay(dayId, 'items', day.items.filter(i => i.id !== itemId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{agenda.length} Days</span>
        <button onClick={addDay} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Day
        </button>
      </div>

      <div className="space-y-4">
        {agenda.map((day) => (
          <div key={day.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
            >
              <div>
                <h5 className="text-sm font-semibold text-slate-800">{day.label}</h5>
                <span className="text-xs text-slate-500">{day.date || 'Set date'} • {day.items.length} Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeDay(day.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedDayId === day.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {expandedDayId === day.id && (
              <div className="p-4 border-t border-slate-100 space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={day.label}
                      onChange={(e) => updateDay(day.id, 'label', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                      placeholder="Label (e.g. Day 1)"
                    />
                    <input 
                      type="date" 
                      value={day.date}
                      onChange={(e) => updateDay(day.id, 'date', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                    />
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-xs font-bold text-slate-500 uppercase">Activities</label>
                       <button onClick={() => addItem(day.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Activity</button>
                    </div>
                    <div className="space-y-3">
                       {day.items.map(item => (
                         <div key={item.id} className="bg-white p-3 rounded border border-slate-200 space-y-2 relative group">
                            <button onClick={() => removeItem(day.id, item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500">
                              <X size={14} />
                            </button>
                            <div className="flex gap-2 items-center">
                               <input type="time" value={item.startTime} onChange={(e) => updateItem(day.id, item.id, 'startTime', e.target.value)} className="w-20 px-1 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900" />
                               <span className="text-slate-400">-</span>
                               <input type="time" value={item.endTime} onChange={(e) => updateItem(day.id, item.id, 'endTime', e.target.value)} className="w-20 px-1 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900" />
                            </div>
                            <input type="text" value={item.title} onChange={(e) => updateItem(day.id, item.id, 'title', e.target.value)} placeholder="Title" className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-medium bg-white text-slate-900" />
                            <select value={item.speakerId || ''} onChange={(e) => updateItem(day.id, item.id, 'speakerId', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-900">
                               <option value="">No Speaker</option>
                               {speakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Program Download Configuration */}
      {onProgramConfigChange && (
        <div className="border border-slate-200 rounded-lg p-4 bg-blue-50/50 space-y-3 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Download size={14} className="text-indigo-600" />
            <label className="text-xs font-bold text-slate-700 uppercase">Program Download</label>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Connect to Saved Program
            </label>
            {loadingPrograms ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="animate-spin" size={12} />
                Loading programs...
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <AlertCircle size={12} />
                {error}
              </div>
            ) : programs.length === 0 ? (
              <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded border border-slate-200">
                No programs found. Create a program in the Program Builder first.
              </div>
            ) : (
              <select
                value={programId || ''}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="">-- No Program Selected --</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {programId && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDownloadButton}
                  onChange={(e) => handleDownloadButtonToggle(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700">Show download button on landing page</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-1 ml-5">
                When enabled, visitors can download the program as a PDF.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgendaEditor;
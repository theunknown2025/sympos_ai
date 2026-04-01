import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Download, Calendar, Clock, MapPin } from 'lucide-react';
import { getUserPrograms, deleteProgram, type SavedProgram } from '../../../../services/programService';
import { useAuth } from '../../../../hooks/useAuth';
import { generateProgramPNG } from './generateProgramPNG';
import { generateProgramPDF } from './generateProgramPDF';

const ProgramList: React.FC<{
  onLoadProgram: (program: SavedProgram) => void;
}> = ({ onLoadProgram }) => {
  const { currentUser: user } = useAuth();
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPrograms();
  }, [user]);

  const loadPrograms = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getUserPrograms(user.id);
      setPrograms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load programs');
      console.error('Error loading programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      setDeletingId(programId);
      await deleteProgram(programId);
      setPrograms(programs.filter(p => p.id !== programId));
    } catch (err: any) {
      alert('Failed to delete program: ' + (err.message || 'Unknown error'));
      console.error('Error deleting program:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGeneratePNG = async (program: SavedProgram) => {
    try {
      await generateProgramPNG(
        program.cards,
        program.venues,
        generateTimeSlots(program.config),
        program.config,
        0 // Default to day 0, could be enhanced to support multiple days
      );
    } catch (err: any) {
      alert('Failed to generate PNG: ' + (err.message || 'Unknown error'));
    }
  };

  const handleGeneratePDF = async (program: SavedProgram) => {
    try {
      await generateProgramPDF(
        program.cards,
        program.venues,
        generateTimeSlots(program.config),
        program.config,
        0 // Default to day 0
      );
    } catch (err: any) {
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    }
  };

  const generateTimeSlots = (config: SavedProgram['config']): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin <= endMin)
    ) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += config.timeSlotWidth;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading programs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calendar size={48} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Programs Yet</h3>
        <p className="text-slate-500">Create and save your first program to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <div
          key={program.id}
          className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {program.title}
              </h3>
              {program.description && (
                <p className="text-sm text-slate-600 mb-3">{program.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {program.config.startTime} - {program.config.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{program.venues.length} venue{program.venues.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{program.cards.length} session{program.cards.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 mt-3">
                Updated: {new Date(program.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onLoadProgram(program)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit Program"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleGeneratePNG(program)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Generate PNG"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => handleGeneratePDF(program)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Generate PDF"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => handleDelete(program.id)}
                disabled={deletingId === program.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete Program"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgramList;


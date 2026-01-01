import React, { useState, useEffect } from 'react';
import { AgendaDay, Speaker } from '../../../types';
import { Clock, MapPin, User, Calendar, FileText, Download } from 'lucide-react';
import { isArabic } from '../../../utils/languageDetection';
import { generateProgramPDF } from '../Tools/ProgramBuilder/generateProgramPDF';
import { getProgramById, type SavedProgram } from '../../../services/programService';
import { useAuth } from '../../../hooks/useAuth';

interface AgendaSectionProps {
  agenda: AgendaDay[];
  speakers: Speaker[];
  activeDayId: string;
  onDayChange: (id: string) => void;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  programId?: string;
  showDownloadButton?: boolean;
}

const AgendaSection: React.FC<AgendaSectionProps> = ({ 
  agenda, 
  speakers, 
  activeDayId, 
  onDayChange, 
  title = "Program Agenda",
  titleAlignment = 'center',
  programId,
  showDownloadButton = false
}) => {
  const { currentUser } = useAuth();
  const [program, setProgram] = useState<SavedProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedDay = agenda.find(d => d.id === activeDayId) || agenda[0];
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  useEffect(() => {
    if (programId && currentUser) {
      loadProgram();
    }
  }, [programId, currentUser]);

  const loadProgram = async () => {
    if (!programId) return;
    
    try {
      setLoading(true);
      const data = await getProgramById(programId);
      setProgram(data);
    } catch (err: any) {
      console.error('Error loading program:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!program) return;

    try {
      const timeSlots = generateTimeSlots(program.config);
      await generateProgramPDF(
        program.cards,
        program.venues,
        timeSlots,
        program.config,
        0 // Default to day 0
      );
    } catch (err: any) {
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
      console.error('Error generating PDF:', err);
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

  return (
    <div className="py-24 px-8 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <FileText size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <FileText size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
          <p className="text-slate-500">Explore our scheduled events and sessions across the conference days.</p>
        </div>

        {/* Day Tabs */}
        {agenda.length > 1 && (
          <div className="flex justify-center mb-12 border-b border-slate-200">
            {agenda.map((day) => (
              <button
                key={day.id}
                onClick={() => onDayChange(day.id)}
                className={`px-8 py-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 ${
                  activeDayId === day.id 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="block text-lg">{day.label}</span>
                {day.date && <span className="text-xs font-normal opacity-80">{day.date}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Schedule List */}
        <div className="space-y-6">
          {selectedDay?.items && selectedDay.items.length > 0 ? (
            selectedDay.items
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((item) => {
                const speaker = speakers.find(s => s.id === item.speakerId);
                return (
                  <div key={item.id} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="md:w-32 flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-2 text-slate-500 font-mono text-sm border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 pr-0 md:pr-6">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Clock size={14} className="text-indigo-500" />
                        {item.startTime}
                      </div>
                      <div className="hidden md:block w-px h-4 bg-slate-300 ml-1.5"></div>
                      <div className="pl-0 md:pl-5 opacity-80">{item.endTime}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                      {item.description && <p className="text-slate-600 leading-relaxed mb-4 text-sm">{item.description}</p>}
                      
                      <div className="flex flex-wrap gap-4 items-center">
                        {speaker && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                              {speaker.imageUrl ? (
                                <img src={speaker.imageUrl} className="w-full h-full object-cover" alt={speaker.name} />
                              ) : (
                                <User size={12} className="text-slate-400" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{speaker.name}</span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin size={14} className="text-slate-400" />
                            {item.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No sessions scheduled for this day.</p>
              <p className="text-sm">Use the Agenda Editor to add activities.</p>
            </div>
          )}
        </div>

        {/* Download Button */}
        {showDownloadButton && programId && program && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              {loading ? 'Loading...' : 'Download Program'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaSection;

import React from 'react';
import { X, FileImage, FileText } from 'lucide-react';
import { generateProgramPNG } from './generateProgramPNG';
import { generateProgramPDF } from './generateProgramPDF';
import type { ProgramCard, Venue, ProgramBuilderConfig } from './ProgramBuilder';

interface GenerateProgramModalProps {
  onClose: () => void;
  cards: ProgramCard[];
  venues: Venue[];
  timeSlots: string[];
  config: ProgramBuilderConfig;
  selectedDay: number;
}

const GenerateProgramModal: React.FC<GenerateProgramModalProps> = ({
  onClose,
  cards,
  venues,
  timeSlots,
  config,
  selectedDay,
}) => {
  const handleGeneratePNG = async () => {
    try {
      await generateProgramPNG(cards, venues, timeSlots, config, selectedDay);
      onClose();
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Failed to generate PNG. Please try again.');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      await generateProgramPDF(cards, venues, timeSlots, config, selectedDay);
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Generate Program</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 mb-6 text-center">
            Select the format you want to generate:
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGeneratePNG}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <div className="p-4 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors">
                <FileImage size={32} className="text-indigo-600" />
              </div>
              <span className="font-semibold text-slate-900">PNG</span>
              <span className="text-xs text-slate-500">Image Format</span>
            </button>

            <button
              onClick={handleGeneratePDF}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all group"
            >
              <div className="p-4 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                <FileText size={32} className="text-red-600" />
              </div>
              <span className="font-semibold text-slate-900">PDF</span>
              <span className="text-xs text-slate-500">Document Format</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramModal;


import React, { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, User, Mail } from 'lucide-react';
import { FormSubmission } from '../../../../types';
import { createPersonnelFromParticipant, CreatePersonnelFromParticipantData } from '../../../../services/personnelService';
import { useAuth } from '../../../../hooks/useAuth';

interface AddParticipantAsPersonnelModalProps {
  participant: FormSubmission;
  onClose: () => void;
  onSuccess: () => void;
}

const AddParticipantAsPersonnelModal: React.FC<AddParticipantAsPersonnelModalProps> = ({
  participant,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    role: '',
    roleDescription: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.role.trim()) {
      setError('Role is required');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to add personnel');
      return;
    }

    if (!participant.generalInfo?.name || !participant.generalInfo?.email) {
      setError('Participant information is incomplete');
      return;
    }

    setIsLoading(true);

    try {
      const personnelData: CreatePersonnelFromParticipantData = {
        fullName: participant.generalInfo.name,
        email: participant.generalInfo.email,
        phoneNumber: participant.generalInfo.phone,
        role: formData.role,
        roleDescription: formData.roleDescription || undefined,
      };
      
      await createPersonnelFromParticipant(currentUser.id, personnelData);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error adding participant as personnel:', err);
      setError(err.message || 'Failed to add participant as personnel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Add Participant as Personnel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Participant Info Display */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-4">Participant Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="text-slate-400" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  <p className="text-base font-semibold text-slate-900">
                    {participant.generalInfo?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-slate-400" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-base font-semibold text-slate-900">
                    {participant.generalInfo?.email || 'N/A'}
                  </p>
                </div>
              </div>
              {participant.generalInfo?.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">📞</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-base font-semibold text-slate-900">
                      {participant.generalInfo.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              placeholder="e.g., Project Manager, Assistant, Coordinator"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              required
            />
          </div>

          {/* Role Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role Description (Optional)
            </label>
            <textarea
              name="roleDescription"
              value={formData.roleDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle2 size={20} />
              <span>Participant added as personnel successfully! Redirecting...</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Adding...
                </>
              ) : (
                'Add Personnel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantAsPersonnelModal;


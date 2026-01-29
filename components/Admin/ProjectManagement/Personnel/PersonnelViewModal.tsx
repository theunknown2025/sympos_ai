import React from 'react';
import { X, Mail, Phone, User as UserIcon, Briefcase } from 'lucide-react';
import { Personnel } from '../../../../services/personnelService';

interface PersonnelViewModalProps {
  personnel: Personnel;
  onClose: () => void;
}

const PersonnelViewModal: React.FC<PersonnelViewModalProps> = ({ personnel, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Personnel Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="flex justify-center">
            {personnel.imageUrl ? (
              <img
                src={personnel.imageUrl}
                alt={personnel.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-slate-200">
                <UserIcon className="text-indigo-600" size={64} />
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Column */}
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                <p className="text-lg font-semibold text-slate-900">{personnel.fullName}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <p className="text-slate-900">{personnel.email}</p>
              </div>

              {/* Phone Number */}
              {personnel.phoneNumber ? (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                    <Phone size={16} />
                    Phone
                  </label>
                  <p className="text-slate-900">{personnel.phoneNumber}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                    <Phone size={16} />
                    Phone
                  </label>
                  <p className="text-slate-400 italic">Not provided</p>
                </div>
              )}
            </div>

            {/* Second Column */}
            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                  <Briefcase size={16} />
                  Role
                </label>
                <p className="text-slate-900">{personnel.role}</p>
              </div>

              {/* Login */}
              {personnel.login ? (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Login</label>
                  <p className="text-slate-900">{personnel.login}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Login</label>
                  <p className="text-slate-400 italic">Not provided</p>
                </div>
              )}
            </div>
          </div>

          {/* Role Description - Full Width */}
          {personnel.roleDescription && (
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-500 mb-1">Role Description</label>
              <p className="text-slate-900 whitespace-pre-wrap">{personnel.roleDescription}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Created At</label>
              <p className="text-slate-900">
                {new Date(personnel.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Last Updated</label>
              <p className="text-slate-900">
                {new Date(personnel.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonnelViewModal;


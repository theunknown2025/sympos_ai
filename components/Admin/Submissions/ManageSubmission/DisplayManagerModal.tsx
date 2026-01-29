import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Loader2, AlertCircle } from 'lucide-react';
import { RegistrationForm } from '../../../../types';

interface DisplayManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedFields: string[]) => void;
  form: RegistrationForm | null;
  currentSelectedFields: string[];
}

const DisplayManagerModal: React.FC<DisplayManagerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  form,
  currentSelectedFields
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(currentSelectedFields));
  const [isSaving, setIsSaving] = useState(false);

  // Update selected fields when modal opens or form changes
  useEffect(() => {
    if (isOpen) {
      setSelectedFields(new Set(currentSelectedFields));
    }
  }, [isOpen, currentSelectedFields]);

  if (!isOpen) return null;

  const getAllAvailableFields = (): Array<{ id: string; label: string; category: string }> => {
    const fields: Array<{ id: string; label: string; category: string }> = [];

    // System fields (always available)
    fields.push({ id: 'submitted_at', label: 'Submitted At', category: 'System Information' });

    if (!form) return fields;

    // General info fields
    if (form.generalInfo.collectName) {
      fields.push({ id: 'general_name', label: 'Full Name', category: 'General Information' });
    }
    if (form.generalInfo.collectEmail) {
      fields.push({ id: 'general_email', label: 'Email', category: 'General Information' });
    }
    if (form.generalInfo.collectPhone) {
      fields.push({ id: 'general_phone', label: 'Phone', category: 'General Information' });
    }
    if (form.generalInfo.collectOrganization) {
      fields.push({ id: 'general_organization', label: 'Organization', category: 'General Information' });
    }
    if (form.generalInfo.collectAddress) {
      fields.push({ id: 'general_address', label: 'Address', category: 'General Information' });
    }

    // Form fields from sections
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        fields.push({ id: field.id, label: field.label, category: section.title || 'Form Fields' });
      });
      section.subsections.forEach(subsection => {
        subsection.fields.forEach(field => {
          fields.push({ id: field.id, label: field.label, category: `${section.title || 'Form'} - ${subsection.title || 'Subsection'}` });
        });
      });
    });

    // Legacy fields
    form.fields.forEach(field => {
      fields.push({ id: field.id, label: field.label, category: 'Form Fields' });
    });

    return fields;
  };

  const availableFields = getAllAvailableFields();
  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, Array<{ id: string; label: string; category: string }>>);

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(Array.from(selectedFields));
      onClose();
    } catch (error) {
      console.error('Error saving display preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedFields(new Set(availableFields.map(f => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFields(new Set());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gérer l'affichage de l'en-tête</h2>
            <p className="text-sm text-slate-500 mt-1">Sélectionnez les champs à afficher dans l'en-tête des soumissions</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!form ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-500">Aucun formulaire disponible</p>
              </div>
            </div>
          ) : availableFields.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-500">Aucun champ disponible</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Select All / Deselect All */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {selectedFields.size} champ{selectedFields.size !== 1 ? 's' : ''} sélectionné{selectedFields.size !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              {/* Fields by Category */}
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fields.map((field) => {
                      const isSelected = selectedFields.has(field.id);
                      return (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => toggleField(field.id)}
                          className={`
                            flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left
                            ${isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }
                          `}
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-indigo-600 flex-shrink-0" />
                          ) : (
                            <Square size={18} className="text-slate-400 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{field.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisplayManagerModal;


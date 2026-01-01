import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Settings,
  X,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  FileText,
  List,
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Layers,
  Calendar,
  Link,
  Grid3x3,
  Users
} from 'lucide-react';
import { FormField, FormFieldType, RegistrationForm, FormSection, FormSubsection } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import { saveRegistrationForm, updateRegistrationForm, getRegistrationForm } from '../../../../services/registrationFormService';
import FormList from './FormList';

interface FormBuilderProps {
  formId?: string;
  onSave?: () => void;
  onEdit?: (formId: string) => void;
  onNew?: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formId, onSave, onEdit, onNew }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'list'>(formId ? 'new' : 'new');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [generalInfo, setGeneralInfo] = useState({
    collectName: true,
    collectEmail: true,
    collectPhone: false,
    collectOrganization: false,
    collectAddress: false,
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const [fieldsTab, setFieldsTab] = useState<'fields' | 'actions'>('fields');
  const [actions, setActions] = useState({
    sendCopyOfAnswers: false,
    sendConfirmationEmail: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!formId);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showFormTypeSelection, setShowFormTypeSelection] = useState(false);
  const [formType, setFormType] = useState<'registration' | 'submission' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});


  React.useEffect(() => {
    if (formId) {
      loadForm(formId);
    }
  }, [formId]);

  const loadForm = async (id: string) => {
    try {
      setIsLoading(true);
      const form = await getRegistrationForm(id);
      if (form) {
        // Detect form type from title prefix
        const titleLower = form.title.toLowerCase();
        if (titleLower.startsWith('reg - ') || titleLower.startsWith('reg-')) {
          setFormType('registration');
          // Remove prefix if present for editing
          const cleanTitle = form.title.replace(/^reg\s*-\s*/i, '');
          setTitle(cleanTitle);
        } else if (titleLower.startsWith('sub - ') || titleLower.startsWith('sub-')) {
          setFormType('submission');
          // Remove prefix if present for editing
          const cleanTitle = form.title.replace(/^sub\s*-\s*/i, '');
          setTitle(cleanTitle);
        } else {
          // If no prefix, try to detect from title
          if (titleLower.includes('registration') || titleLower.includes('register')) {
            setFormType('registration');
          } else if (titleLower.includes('submission') || titleLower.includes('submit')) {
            setFormType('submission');
          }
          setTitle(form.title);
        }
        setDescription(form.description || '');
        setGeneralInfo(form.generalInfo);
        setFields(form.fields || []);
        setSections(form.sections || []);
        setActions(form.actions || {
          sendCopyOfAnswers: false,
          sendConfirmationEmail: false,
        });
        // Expand all sections by default
        if (form.sections) {
          setExpandedSections(new Set(form.sections.map(s => s.id)));
        }
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldTypes: { value: FormFieldType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'textarea', label: 'Text Area', icon: AlignLeft },
    { value: 'select', label: 'Dropdown', icon: ChevronDown },
    { value: 'checkbox', label: 'Checkbox', icon: FileText },
    { value: 'radio', label: 'Radio', icon: FileText },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'file', label: 'File Upload', icon: FileText },
    { value: 'url', label: 'URL', icon: Link },
  ];

  const addSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '', // Initialize as empty string, not undefined
      order: sections.length,
      subsections: [],
      fields: [],
    };
    setSections([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId).map((s, index) => ({ ...s, order: index })));
    setExpandedSections(new Set([...expandedSections].filter(id => id !== sectionId)));
  };

  const addSubsection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newSubsection: FormSubsection = {
      id: `subsection-${Date.now()}`,
      title: 'New Subsection',
      description: '', // Initialize as empty string, not undefined
      order: section.subsections.length,
      sectionId,
      fields: [],
    };

    updateSection(sectionId, {
      subsections: [...section.subsections, newSubsection],
    });
    setExpandedSubsections(new Set([...expandedSubsections, newSubsection.id]));
  };

  const updateSubsection = (sectionId: string, subsectionId: string, updates: Partial<FormSubsection>) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      subsections: section.subsections.map(sub => 
        sub.id === subsectionId ? { ...sub, ...updates } : sub
      ),
    });
  };

  const deleteSubsection = (sectionId: string, subsectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedSubsections = section.subsections
      .filter(sub => sub.id !== subsectionId)
      .map((sub, index) => ({ ...sub, order: index }));

    updateSection(sectionId, { subsections: updatedSubsections });
    setExpandedSubsections(new Set([...expandedSubsections].filter(id => id !== subsectionId)));
  };

  const addField = (type: FormFieldType, sectionId?: string, subsectionId?: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${fieldTypes.find(t => t.value === type)?.label || 'Field'}`,
      required: false,
      multiple: false,
      hasSubFields: false,
      subFields: [],
      order: 0,
      sectionId,
      subsectionId,
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = ['Option 1', 'Option 2'];
    }

    if (sectionId && subsectionId) {
      // Add to subsection
      const section = sections.find(s => s.id === sectionId);
      const subsection = section?.subsections.find(sub => sub.id === subsectionId);
      if (subsection) {
        newField.order = subsection.fields.length;
        updateSubsection(sectionId, subsectionId, {
          fields: [...subsection.fields, newField],
        });
      }
    } else if (sectionId) {
      // Add to section
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        newField.order = section.fields.length;
        updateSection(sectionId, {
          fields: [...section.fields, newField],
        });
      }
    } else {
      // Add to root fields (legacy)
      newField.order = fields.length;
      setFields([...fields, newField]);
    }
  };

  const updateField = (fieldId: string, updates: Partial<FormField>, sectionId?: string, subsectionId?: string) => {
    if (sectionId && subsectionId) {
      const section = sections.find(s => s.id === sectionId);
      const subsection = section?.subsections.find(sub => sub.id === subsectionId);
      if (subsection) {
        updateSubsection(sectionId, subsectionId, {
          fields: subsection.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
        });
      }
    } else if (sectionId) {
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        updateSection(sectionId, {
          fields: section.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
        });
      }
    } else {
      setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    }
  };

  const deleteField = (fieldId: string, sectionId?: string, subsectionId?: string) => {
    if (sectionId && subsectionId) {
      const section = sections.find(s => s.id === sectionId);
      const subsection = section?.subsections.find(sub => sub.id === subsectionId);
      if (subsection) {
        const updatedFields = subsection.fields
          .filter(f => f.id !== fieldId)
          .map((f, index) => ({ ...f, order: index }));
        updateSubsection(sectionId, subsectionId, { fields: updatedFields });
      }
    } else if (sectionId) {
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        const updatedFields = section.fields
          .filter(f => f.id !== fieldId)
          .map((f, index) => ({ ...f, order: index }));
        updateSection(sectionId, { fields: updatedFields });
      }
    } else {
      setFields(fields.filter(f => f.id !== fieldId).map((f, index) => ({ ...f, order: index })));
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    const temp = newFields[index].order;
    newFields[index].order = newFields[targetIndex].order;
    newFields[targetIndex].order = temp;
    
    newFields.sort((a, b) => a.order - b.order);
    setFields(newFields);
  };

  const renderField = (field: FormField, sectionId?: string, subsectionId?: string) => {
    const FieldIcon = fieldTypes.find(t => t.value === field.type)?.icon || Type;
    return (
      <div key={field.id} className="border border-slate-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <FieldIcon size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {fieldTypes.find(t => t.value === field.type)?.label}
              </span>
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value }, sectionId, subsectionId)}
                placeholder="Field label"
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked }, sectionId, subsectionId)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <span className="text-xs text-slate-600">Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={field.multiple || false}
                    onChange={(e) => updateField(field.id, { multiple: e.target.checked }, sectionId, subsectionId)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <span className="text-xs text-slate-600">Multiple</span>
              </label>
            </div>

            {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') && (
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value }, sectionId, subsectionId)}
                placeholder="Placeholder text (optional)"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value }, sectionId, subsectionId)}
                placeholder="Placeholder text (optional)"
                rows={3}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}

            {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">Options</label>
                {field.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[optIndex] = e.target.value;
                        updateField(field.id, { options: newOptions }, sectionId, subsectionId);
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== optIndex) || [];
                        updateField(field.id, { options: newOptions }, sectionId, subsectionId);
                      }}
                      className="px-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                    updateField(field.id, { options: newOptions }, sectionId, subsectionId);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
            )}

            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => updateField(field.id, { helpText: e.target.value }, sectionId, subsectionId)}
              placeholder="Help text (optional)"
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Sub-Fields Section */}
            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={field.hasSubFields || false}
                      onChange={(e) => {
                        const hasSubFields = e.target.checked;
                        updateField(field.id, { 
                          hasSubFields,
                          subFields: hasSubFields && !field.subFields?.length 
                            ? [
                                { id: `subfield-${Date.now()}-1`, type: 'text' as FormFieldType, label: 'Name', required: false, order: 0 },
                                { id: `subfield-${Date.now()}-2`, type: 'phone' as FormFieldType, label: 'Phone', required: false, order: 1 },
                                { id: `subfield-${Date.now()}-3`, type: 'email' as FormFieldType, label: 'Email', required: false, order: 2 },
                              ]
                            : hasSubFields ? field.subFields : []
                        }, sectionId, subsectionId);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Grid3x3 size={14} />
                    Enable Sub-Fields
                  </span>
                </label>
                {field.hasSubFields && (
                  <span className="text-xs text-slate-500">
                    Users can add multiple rows with these fields
                  </span>
                )}
              </div>

              {field.hasSubFields && (
                <div className="space-y-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">Sub-Fields (appear in each row):</p>
                    <button
                      onClick={() => {
                        const newSubField: FormField = {
                          id: `subfield-${Date.now()}`,
                          type: 'text',
                          label: `Field ${(field.subFields?.length || 0) + 1}`,
                          required: false,
                          order: field.subFields?.length || 0,
                        };
                        updateField(field.id, { 
                          subFields: [...(field.subFields || []), newSubField]
                        }, sectionId, subsectionId);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 rounded"
                    >
                      <Plus size={12} /> Add Sub-Field
                    </button>
                  </div>
                  
                  {field.subFields && field.subFields.length > 0 ? (
                    <div className="space-y-2">
                      {field.subFields.map((subField, subIndex) => (
                        <div key={subField.id} className="bg-white rounded border border-slate-200 p-2 flex items-center gap-2">
                          <select
                            value={subField.type}
                            onChange={(e) => {
                              const newSubFields = [...(field.subFields || [])];
                              newSubFields[subIndex] = { ...subField, type: e.target.value as FormFieldType };
                              updateField(field.id, { subFields: newSubFields }, sectionId, subsectionId);
                            }}
                            className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {fieldTypes.map(ft => (
                              <option key={ft.value} value={ft.value}>{ft.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={subField.label}
                            onChange={(e) => {
                              const newSubFields = [...(field.subFields || [])];
                              newSubFields[subIndex] = { ...subField, label: e.target.value };
                              updateField(field.id, { subFields: newSubFields }, sectionId, subsectionId);
                            }}
                            placeholder="Sub-field label"
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={subField.required}
                              onChange={(e) => {
                                const newSubFields = [...(field.subFields || [])];
                                newSubFields[subIndex] = { ...subField, required: e.target.checked };
                                updateField(field.id, { subFields: newSubFields }, sectionId, subsectionId);
                              }}
                              className="w-3 h-3 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-600">Required</span>
                          </label>
                          <button
                            onClick={() => {
                              const newSubFields = field.subFields?.filter((_, i) => i !== subIndex) || [];
                              updateField(field.id, { subFields: newSubFields }, sectionId, subsectionId);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-2">
                      No sub-fields yet. Add sub-fields to create a table-like input.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => deleteField(field.id, sectionId, subsectionId)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate title
    if (!title.trim()) {
      errors.title = 'Form title is required';
    } else if (title.trim().length < 3) {
      errors.title = 'Form title must be at least 3 characters';
    }

    // Validate description
    if (!description.trim()) {
      errors.description = 'Form description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Form description must be at least 10 characters';
    }

    // Validate form type (only for new forms)
    if (!formId && !formType) {
      errors.formType = 'Please select a form type';
    }

    // Validate that form has at least one field or section
    const totalFields = fields.length + sections.reduce((sum, section) => {
      return sum + section.fields.length + section.subsections.reduce((subSum, sub) => subSum + sub.fields.length, 0);
    }, 0);

    if (totalFields === 0) {
      errors.fields = 'Form must have at least one field or section';
    }

    // Validate sections have titles
    sections.forEach((section, index) => {
      if (!section.title.trim()) {
        errors[`section_${section.id}`] = `Section ${index + 1} must have a title`;
      }
      // Validate subsections
      section.subsections.forEach((subsection, subIndex) => {
        if (!subsection.title.trim()) {
          errors[`subsection_${subsection.id}`] = `Subsection ${subIndex + 1} in Section ${index + 1} must have a title`;
        }
      });
    });

    // Validate fields have labels
    fields.forEach((field, index) => {
      if (!field.label.trim()) {
        errors[`field_${field.id}`] = `Field ${index + 1} must have a label`;
      }
    });

    sections.forEach((section, sectionIndex) => {
      section.fields.forEach((field, fieldIndex) => {
        if (!field.label.trim()) {
          errors[`field_${field.id}`] = `Field ${fieldIndex + 1} in Section ${sectionIndex + 1} must have a label`;
        }
      });
      section.subsections.forEach((subsection, subIndex) => {
        subsection.fields.forEach((field, fieldIndex) => {
          if (!field.label.trim()) {
            errors[`field_${field.id}`] = `Field ${fieldIndex + 1} in Subsection ${subIndex + 1} of Section ${sectionIndex + 1} must have a label`;
          }
        });
      });
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!currentUser) {
      setSaveError('You must be logged in to save forms');
      return;
    }

    // Run validation
    if (!validateForm()) {
      setSaveError('Please fix the validation errors before saving');
      return;
    }

    if (!formType && !formId) {
      setSaveError('Please select a form type');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      setSaveSuccess(false);

      // Add prefix based on form type
      const prefix = formType === 'registration' ? 'Reg' : 'Sub';
      const finalTitle = title.trim().startsWith(prefix) ? title.trim() : `${prefix} - ${title.trim()}`;

      const formData: Omit<RegistrationForm, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: finalTitle,
        description: description.trim() || '',
        sections: sections || [],
        fields: fields || [],
        generalInfo,
        actions: actions,
      };

      if (formId) {
        await updateRegistrationForm(formId, formData);
      } else {
        await saveRegistrationForm(currentUser.id, formData);
      }

      setSaveSuccess(true);
      setValidationErrors({}); // Clear validation errors on success
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveSuccess(false);
        // Trigger refresh of form list
        setRefreshTrigger(prev => prev + 1);
        // If we're on the list tab, switch to it to see the updated list
        if (!formId && activeTab === 'new') {
          setActiveTab('list');
        }
        if (onSave) {
          onSave();
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error saving form:', error);
      setSaveError('Failed to save form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Form Builder</h1>
          <p className="text-slate-500 mt-1 text-sm">Create custom registration forms with fields and questions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Eye size={18} /> Preview
          </button>
          <button
            onClick={() => {
              if (formId) {
                // If editing existing form, show save dialog directly
                setShowSaveDialog(true);
                setShowFormTypeSelection(false);
              } else {
                // If new form, show type selection first
                setShowFormTypeSelection(true);
                setShowSaveDialog(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200"
          >
            <Save size={18} /> {formId ? 'Save Changes' : 'Save Form'}
          </button>
        </div>
      </header>

      {/* Tabs - Only show if not editing a specific form */}
      {!formId && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'new'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={18} />
                New Form
              </div>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <List size={18} />
                List of Forms
              </div>
            </button>
          </div>
        </div>
      )}

      {(!formId && activeTab === 'list') ? (
        <FormList 
          refreshTrigger={refreshTrigger}
          onEdit={(id) => {
            if (onEdit) {
              onEdit(id);
            } else {
              // If no onEdit handler, reload the form in this component
              loadForm(id);
              setActiveTab('new');
            }
          }}
          onNew={() => {
            if (onNew) {
              onNew();
            } else {
              setTitle('');
              setDescription('');
              setFields([]);
              setSections([]);
              setGeneralInfo({
                collectName: true,
                collectEmail: true,
                collectPhone: false,
                collectOrganization: false,
                collectAddress: false,
              });
              setActiveTab('new');
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Builder Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Validation Summary Banner */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">
                      Form Validation Errors
                    </h3>
                    <p className="text-sm text-amber-800 mb-2">
                      Please fix the following issues before saving:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                      {Object.entries(validationErrors)
                        .filter(([key]) => key === 'title' || key === 'description' || key === 'formType' || key === 'fields')
                        .map(([key, message]) => (
                          <li key={key}>{message}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Form Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings size={20} />
                Form Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Form Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (validationErrors.title) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.title;
                        setValidationErrors(newErrors);
                      }
                    }}
                    placeholder="e.g., Conference Registration Form"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.title
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  {validationErrors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {validationErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (validationErrors.description) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.description;
                        setValidationErrors(newErrors);
                      }
                    }}
                    placeholder="Enter a description for your form (minimum 10 characters)"
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.description
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {validationErrors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* General Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">General Information</h2>
              <p className="text-sm text-slate-500 mb-4">Select which general information fields to collect</p>
              <div className="space-y-3">
                {[
                  { key: 'collectName', label: 'Full Name' },
                  { key: 'collectEmail', label: 'Email Address' },
                  { key: 'collectPhone', label: 'Phone Number' },
                  { key: 'collectOrganization', label: 'Organization/Institution' },
                  { key: 'collectAddress', label: 'Address' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalInfo[key as keyof typeof generalInfo]}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, [key]: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sections and Fields */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Layers size={20} />
                  Sections & Fields
                </h2>
                {fieldsTab === 'fields' && (
                  <button
                    onClick={addSection}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={16} /> Add Section
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button
                  onClick={() => setFieldsTab('fields')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    fieldsTab === 'fields'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Fields
                </button>
                <button
                  onClick={() => setFieldsTab('actions')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    fieldsTab === 'actions'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Actions
                </button>
              </div>

              {/* Tab Content */}
              {fieldsTab === 'fields' ? (
                <>
                  {sections.length === 0 && fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-500 mb-4">No sections or fields yet</p>
                  <p className="text-sm text-slate-400">Add a section or fields from the panel on the right</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Render Sections */}
                  {sections.map((section) => {
                    const isExpanded = expandedSections.has(section.id);
                    const Icon = isExpanded ? FolderOpen : Folder;
                    return (
                      <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 p-4 flex items-center justify-between">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedSections);
                              if (isExpanded) {
                                newExpanded.delete(section.id);
                              } else {
                                newExpanded.add(section.id);
                              }
                              setExpandedSections(newExpanded);
                            }}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <Icon size={18} className="text-indigo-600" />
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0"
                              placeholder="Section Title"
                            />
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => addSubsection(section.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Add Subsection"
                            >
                              <Layers size={16} />
                            </button>
                            <button
                              onClick={() => deleteSection(section.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {section.description !== undefined && (
                              <textarea
                                value={section.description || ''}
                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                placeholder="Section description (optional)"
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            )}
                            
                            {/* Subsections */}
                            {section.subsections.map((subsection) => {
                              const isSubExpanded = expandedSubsections.has(subsection.id);
                              const SubIcon = isSubExpanded ? FolderOpen : Folder;
                              return (
                                <div key={subsection.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                                  <div className="p-3 flex items-center justify-between bg-white">
                                    <button
                                      onClick={() => {
                                        const newExpanded = new Set(expandedSubsections);
                                        if (isSubExpanded) {
                                          newExpanded.delete(subsection.id);
                                        } else {
                                          newExpanded.add(subsection.id);
                                        }
                                        setExpandedSubsections(newExpanded);
                                      }}
                                      className="flex items-center gap-2 flex-1 text-left"
                                    >
                                      <SubIcon size={16} className="text-slate-600" />
                                      <input
                                        type="text"
                                        value={subsection.title}
                                        onChange={(e) => updateSubsection(section.id, subsection.id, { title: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 px-0"
                                        placeholder="Subsection Title"
                                      />
                                    </button>
                                    <button
                                      onClick={() => deleteSubsection(section.id, subsection.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  {isSubExpanded && (
                                    <div className="p-3 space-y-3">
                                      {subsection.fields.map((field) => renderField(field, section.id, subsection.id))}
                                      <div className="text-xs text-slate-500 text-center py-2">
                                        Add fields using the panel on the right
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Section Fields (not in subsections) */}
                            {section.fields.map((field) => renderField(field, section.id))}
                            
                            {/* Add buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => addSubsection(section.id)}
                                className="flex-1 py-2 text-xs text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2"
                              >
                                <Plus size={14} /> Add Subsection
                              </button>
                              <div className="text-xs text-slate-500 text-center py-2">
                                Add fields using the panel on the right
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Legacy fields (not in sections) */}
                  {fields.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700">Other Fields</h3>
                      {fields.map((field) => renderField(field))}
                    </div>
                  )}
                </div>
              )}
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Email Actions</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Configure automatic email actions that will be triggered when users submit this form.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={actions.sendCopyOfAnswers}
                        onChange={(e) => setActions({ ...actions, sendCopyOfAnswers: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={18} className="text-indigo-600" />
                          <span className="text-sm font-medium text-slate-900">Send Copy of Answers</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Automatically send a copy of the submitted answers to the user's email address.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={actions.sendConfirmationEmail}
                        onChange={(e) => setActions({ ...actions, sendConfirmationEmail: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={18} className="text-indigo-600" />
                          <span className="text-sm font-medium text-slate-900">Send Confirmation Email</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Send a confirmation email to the user after successful form submission.
                        </p>
                      </div>
                    </label>
                  </div>

                  {(actions.sendCopyOfAnswers || actions.sendConfirmationEmail) && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-xs text-indigo-700">
                        <strong>Note:</strong> These actions require the user to provide an email address in the form. 
                        Make sure to enable "Email Address" in the General Information section above.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Field Types Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Field</h3>
            <p className="text-sm text-slate-500 mb-4">Click a field type to add it</p>
            {sections.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  Select a section/subsection first, then click a field type to add it there.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {fieldTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      // If there are sections, add to the first expanded section, otherwise add to root
                      if (sections.length > 0) {
                        const expandedSection = sections.find(s => expandedSections.has(s.id));
                        if (expandedSection) {
                          const expandedSubsection = expandedSection.subsections.find(sub => expandedSubsections.has(sub.id));
                          if (expandedSubsection) {
                            addField(type.value, expandedSection.id, expandedSubsection.id);
                          } else {
                            addField(type.value, expandedSection.id);
                          }
                        } else {
                          // No expanded section, add to first section
                          if (sections.length > 0) {
                            addField(type.value, sections[0].id);
                          }
                        }
                      } else {
                        addField(type.value);
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <IconComponent size={20} className="text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Form Type Selection Modal */}
      {showFormTypeSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Select Form Type
              </h2>
              <button
                onClick={() => {
                  setShowFormTypeSelection(false);
                  setFormType(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Choose the type of form you want to create:
              </p>

              <button
                onClick={() => {
                  setFormType('registration');
                  setShowFormTypeSelection(false);
                  setShowSaveDialog(true);
                }}
                className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <FileText size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Registration Form</h3>
                    <p className="text-sm text-slate-500">For event registrations and attendee information</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setFormType('submission');
                  setShowFormTypeSelection(false);
                  setShowSaveDialog(true);
                }}
                className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <FileText size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Submission Form</h3>
                    <p className="text-sm text-slate-500">For paper submissions and research proposals</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {formId ? 'Save Changes' : 'Save Form'}
              </h2>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveError('');
                  setSaveSuccess(false);
                  if (!formId) {
                    setFormType(null);
                  }
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {formType && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm font-medium text-indigo-900">
                    Form Type: <span className="font-bold">{formType === 'registration' ? 'Registration Form' : 'Submission Form'}</span>
                  </p>
                  {!formId && (
                    <p className="text-xs text-indigo-700 mt-1">
                      Form name will be prefixed with "{formType === 'registration' ? 'Reg' : 'Sub'}"
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSaveError('');
                    if (validationErrors.title) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.title;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder="Enter form title"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.title
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                  autoFocus={!formId}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.title}
                  </p>
                )}
                {formType && !formId && !validationErrors.title && (
                  <p className="text-xs text-slate-500 mt-1">
                    Will be saved as: <span className="font-medium">{formType === 'registration' ? 'Reg' : 'Sub'} - {title || 'Your Title'}</span>
                  </p>
                )}
                {formType && formId && !validationErrors.title && (
                  <p className="text-xs text-slate-500 mt-1">
                    Will be saved as: <span className="font-medium">{formType === 'registration' ? 'Reg' : 'Sub'} - {title || 'Your Title'}</span>
                  </p>
                )}
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Validation Errors Summary */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Please fix the following errors:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                    {Object.entries(validationErrors).map(([key, message]) => {
                      // Only show main errors, not field-specific ones
                      if (key === 'title' || key === 'description' || key === 'formType' || key === 'fields') {
                        return <li key={key}>{message}</li>;
                      }
                      return null;
                    })}
                  </ul>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <span>✓</span>
                  <span>Form saved successfully!</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveError('');
                    setSaveSuccess(false);
                    if (!formId) {
                      setFormType(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || (!formId && !formType)}
                  className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {formId ? 'Save Changes' : 'Save Form'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Form Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form className="space-y-6">
                {/* Form Title and Description */}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{title || 'Untitled Form'}</h1>
                  {description && <p className="text-slate-600">{description}</p>}
                </div>

                {/* General Information */}
                {(generalInfo.collectName || generalInfo.collectEmail || generalInfo.collectPhone || 
                  generalInfo.collectOrganization || generalInfo.collectAddress) && (
                  <div className="border-t border-slate-200 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">General Information</h2>
                    <div className="space-y-4">
                      {generalInfo.collectName && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name {<span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                      )}
                      {generalInfo.collectEmail && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address {<span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="email"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your email"
                          />
                        </div>
                      )}
                      {generalInfo.collectPhone && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      )}
                      {generalInfo.collectOrganization && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Organization/Institution</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your organization"
                          />
                        </div>
                      )}
                      {generalInfo.collectAddress && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                          <textarea
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your address"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {sections.map((section) => (
                  <div key={section.id} className="border-t border-slate-200 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">{section.title}</h2>
                    {section.description && <p className="text-slate-600 mb-4">{section.description}</p>}
                    
                    {/* Subsections */}
                    {section.subsections.map((subsection) => (
                      <div key={subsection.id} className="mb-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-2">{subsection.title}</h3>
                        {subsection.description && <p className="text-sm text-slate-600 mb-3">{subsection.description}</p>}
                        <div className="space-y-4">
                          {subsection.fields.map((field) => renderPreviewField(field))}
                        </div>
                      </div>
                    ))}

                    {/* Section Fields */}
                    {section.fields.length > 0 && (
                      <div className="space-y-4">
                        {section.fields.map((field) => renderPreviewField(field))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Legacy Fields */}
                {fields.length > 0 && (
                  <div className="border-t border-slate-200 pt-6 space-y-4">
                    {fields.map((field) => renderPreviewField(field))}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-6 border-t border-slate-200">
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderPreviewField(field: FormField) {
    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.helpText && (
          <p className="text-xs text-slate-500">{field.helpText}</p>
        )}
        
        {field.type === 'text' && (
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'email' && (
          <input
            type="email"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'phone' && (
          <input
            type="tel"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'number' && (
          <input
            type="number"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            rows={4}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'select' && (
          <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        )}
        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="radio" name={field.id} value={option} className="text-indigo-600" />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="checkbox" value={option} className="text-indigo-600 rounded" />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        {field.type === 'date' && (
          <input
            type="date"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'file' && (
          <input
            type="file"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'url' && (
          <input
            type="url"
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>
    );
  }
};

export default FormBuilder;


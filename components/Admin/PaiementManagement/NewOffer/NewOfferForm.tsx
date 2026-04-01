import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getPaymentMethods,
  savePayment,
  type PaymentMethod,
  type PaymentComponent,
  type Payment,
} from '../../../../services/paymentService';

interface NewOfferFormProps {
  editingOffer?: Payment | null;
  onSave: () => void;
  onCancel: () => void;
}

const NewOfferForm: React.FC<NewOfferFormProps> = ({
  editingOffer,
  onSave,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [offerName, setOfferName] = useState(editingOffer?.name || '');
  const [description, setDescription] = useState(editingOffer?.description || '');
  const [selectedMethods, setSelectedMethods] = useState<string[]>(editingOffer?.selectedMethods || []);
  const [components, setComponents] = useState<PaymentComponent[]>(
    editingOffer?.components.length 
      ? editingOffer.components.map(c => ({
          id: c.id,
          paymentId: c.paymentId,
          type: c.type,
          label: c.label,
          value: c.value || '',
          displayOrder: c.displayOrder,
          createdAt: c.createdAt,
        }))
      : []
  );
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch payment methods on component mount
  useEffect(() => {
    if (currentUser) {
      loadPaymentMethods();
    }
  }, [currentUser]);

  // Update form when editingOffer changes
  useEffect(() => {
    if (editingOffer) {
      setOfferName(editingOffer.name);
      setDescription(editingOffer.description || '');
      setSelectedMethods(editingOffer.selectedMethods);
      setComponents(
        editingOffer.components.length
          ? editingOffer.components.map(c => ({
              id: c.id,
              paymentId: c.paymentId,
              type: c.type,
              label: c.label,
              value: c.value || '',
              displayOrder: c.displayOrder,
              createdAt: c.createdAt,
            }))
          : []
      );
    } else {
      // Reset form when not editing
      setOfferName('');
      setDescription('');
      setSelectedMethods([]);
      setComponents([]);
    }
  }, [editingOffer]);

  const loadPaymentMethods = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const methods = await getPaymentMethods(currentUser.id);
      setAvailableMethods(methods);
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      alert('Failed to load payment methods: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = (methodId: string) => {
    setSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const addComponent = () => {
    const newComponent: PaymentComponent = {
      id: Date.now().toString(),
      paymentId: '',
      type: 'custom',
      label: '',
      value: '',
      displayOrder: components.length,
      createdAt: new Date(),
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (id: string, updates: Partial<PaymentComponent>) => {
    setComponents(components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('You must be logged in to save offers');
      return;
    }

    if (!offerName.trim()) {
      alert('Please enter an offer name');
      return;
    }

    if (selectedMethods.length === 0) {
      alert('Please select at least one payment method');
      return;
    }

    setSaving(true);
    try {
      const paymentData: Omit<Payment, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string } = {
        name: offerName,
        description: description || undefined,
        selectedMethods: selectedMethods,
        components: components.map(c => ({
          id: c.id,
          paymentId: c.paymentId,
          type: c.type,
          label: c.label,
          value: c.value,
          displayOrder: c.displayOrder,
          createdAt: c.createdAt,
        })),
      };

      if (editingOffer) {
        paymentData.id = editingOffer.id;
      }

      await savePayment(currentUser.id, paymentData);
      alert('Offer saved successfully!');
      
      // Reset form
      setOfferName('');
      setDescription('');
      setSelectedMethods([]);
      setComponents([]);
      onSave();
    } catch (error: any) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        {editingOffer ? 'Edit Offer' : 'New Offer'}
      </h2>

      <div className="space-y-6">
        {/* Offer Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Offer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={offerName}
            onChange={(e) => setOfferName(e.target.value)}
            placeholder="Enter offer name"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter offer description"
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Payment Method Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paiement methode <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">Select one or more payment methods (multiple choices)</p>
          <div className="space-y-2 border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-indigo-600" size={20} />
              </div>
            ) : availableMethods.length === 0 ? (
              <p className="text-slate-500 text-sm">No payment methods available. Please create payment methods in "Paiement Information" first.</p>
            ) : (
              availableMethods.map((method) => (
                <label
                  key={method.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes(method.id)}
                    onChange={() => toggleMethod(method.id)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <CreditCard size={18} className="text-slate-400" />
                  <span className="text-slate-700">{method.name}</span>
                </label>
              ))
            )}
          </div>
          {selectedMethods.length > 0 && (
            <p className="text-sm text-indigo-600 mt-2">
              {selectedMethods.length} method(s) selected
            </p>
          )}
          </div>

        {/* Components Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-slate-700">
              Components (Offre, Amount, and more)
            </label>
            <button
              onClick={addComponent}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Plus size={16} />
              Add Component
            </button>
          </div>

          <div className="space-y-4">
            {components.map((component) => (
              <div key={component.id} className="border border-slate-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Component Label
                    </label>
                    <input
                      type="text"
                      value={component.label}
                      onChange={(e) => updateComponent(component.id, { label: e.target.value })}
                      placeholder="Component label"
                      disabled={component.type === 'offer' || component.type === 'amount'}
                      className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        (component.type === 'offer' || component.type === 'amount') ? 'bg-slate-50' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Value
                    </label>
                    <input
                      type="text"
                      value={component.value}
                      onChange={(e) => updateComponent(component.id, { value: e.target.value })}
                      placeholder="Component value"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                {(component.type === 'custom') && (
                  <button
                    onClick={() => removeComponent(component.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    <X size={16} />
                    Remove Component
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Offer'
            )}
          </button>
          {editingOffer && (
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewOfferForm;

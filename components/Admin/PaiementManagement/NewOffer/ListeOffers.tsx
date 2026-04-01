import React, { useState, useEffect } from 'react';
import { Tag, Edit, Trash2, Loader2, Calendar, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getPayments,
  getPaymentMethods,
  deletePayment,
  type Payment,
  type PaymentMethod,
} from '../../../../services/paymentService';

interface ListeOffersProps {
  onEdit?: (offer: Payment) => void;
}

const ListeOffers: React.FC<ListeOffersProps> = ({ onEdit }) => {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch offers and payment methods on component mount
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const [offersData, methodsData] = await Promise.all([
        getPayments(currentUser.id),
        getPaymentMethods(currentUser.id),
      ]);
      setOffers(offersData);
      setPaymentMethods(methodsData);
    } catch (error: any) {
      console.error('Error loading offers:', error);
      alert('Failed to load offers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!currentUser) {
      alert('You must be logged in to delete offers');
      return;
    }

    if (!confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      return;
    }

    setDeletingId(offerId);
    try {
      await deletePayment(currentUser.id, offerId);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getPaymentMethodNames = (methodIds: string[]): string[] => {
    return methodIds
      .map(id => paymentMethods.find(m => m.id === id)?.name)
      .filter((name): name is string => name !== undefined);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        Liste of Offers
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12">
          <Tag size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No offers created yet.</p>
          <p className="text-slate-400 text-sm mt-2">Create your first offer in the "New Offer" tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const methodNames = getPaymentMethodNames(offer.selectedMethods);
            const offerComponent = offer.components.find(c => c.type === 'offer');
            const amountComponent = offer.components.find(c => c.type === 'amount');

            return (
              <div
                key={offer.id}
                className="border border-slate-200 rounded-lg p-6 hover:border-indigo-300 transition-colors bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Tag className="text-indigo-600" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-slate-800 mb-1">{offer.name}</h3>
                        {offer.description && (
                          <p className="text-sm text-slate-600 mb-2">{offer.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            Created: {formatDate(offer.createdAt)}
                          </div>
                          {offer.updatedAt.getTime() !== offer.createdAt.getTime() && (
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              Updated: {formatDate(offer.updatedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    {methodNames.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard size={16} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">Payment Methods:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {methodNames.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Components */}
                    {offer.components.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">Components:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {offerComponent && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="text-xs font-medium text-slate-500 mb-1">Offer</div>
                              <div className="text-sm font-semibold text-slate-800">
                                {offerComponent.value || 'Not set'}
                              </div>
                            </div>
                          )}
                          {amountComponent && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="text-xs font-medium text-slate-500 mb-1">Amount</div>
                              <div className="text-sm font-semibold text-slate-800">
                                {amountComponent.value || 'Not set'}
                              </div>
                            </div>
                          )}
                          {offer.components
                            .filter(c => c.type === 'custom')
                            .map((component) => (
                              <div
                                key={component.id}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <div className="text-xs font-medium text-slate-500 mb-1">
                                  {component.label || 'Custom Component'}
                                </div>
                                <div className="text-sm font-semibold text-slate-800">
                                  {component.value || 'Not set'}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-500">
                        <span className="font-medium">{offer.components.length}</span> component(s)
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-medium">{offer.selectedMethods.length}</span> payment method(s)
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-6 shrink-0">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(offer)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Offer"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(offer.id)}
                      disabled={deletingId === offer.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Offer"
                    >
                      {deletingId === offer.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListeOffers;

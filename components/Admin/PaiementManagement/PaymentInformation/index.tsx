import React, { useState } from 'react';
import NewPaymentInformation from './NewPaymentInformation';
import ListeOfPaiementMethods from './ListeOfPaiementMethods';
import { PaymentMethod } from '../../../../services/paymentService';

const PaymentInformation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setActiveTab('new');
  };

  const handleSave = () => {
    setEditingMethod(null);
    setActiveTab('list');
    setRefreshKey(prev => prev + 1); // Trigger refresh of list
  };

  const handleCancel = () => {
    setEditingMethod(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Paiement Information</h1>
        <p className="text-slate-500 mt-2">Manage payment methods and their information</p>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('new');
              setEditingMethod(null);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'new'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            New Paiement Methode Information
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Liste of paiement
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' && (
        <NewPaymentInformation
          editingMethod={editingMethod}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {activeTab === 'list' && (
        <ListeOfPaiementMethods
          key={refreshKey}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default PaymentInformation;

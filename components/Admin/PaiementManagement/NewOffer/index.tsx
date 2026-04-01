import React, { useState } from 'react';
import NewOfferForm from './NewOfferForm';
import ListeOffers from './ListeOffers';
import { Payment } from '../../../../services/paymentService';

const NewOffer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [editingOffer, setEditingOffer] = useState<Payment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (offer: Payment) => {
    setEditingOffer(offer);
    setActiveTab('new');
  };

  const handleSave = () => {
    setEditingOffer(null);
    setActiveTab('list');
    setRefreshKey(prev => prev + 1); // Trigger refresh of list
  };

  const handleCancel = () => {
    setEditingOffer(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">New Offer</h1>
        <p className="text-slate-500 mt-2">Create and manage participation offers with payment configuration</p>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('new');
              setEditingOffer(null);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'new'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            New Offer
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Liste of Offers
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' && (
        <NewOfferForm
          editingOffer={editingOffer}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {activeTab === 'list' && (
        <ListeOffers
          key={refreshKey}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default NewOffer;

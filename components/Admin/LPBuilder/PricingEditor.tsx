import React, { useState } from 'react';
import { PricingOffer } from '../../../types';
import { Plus, Trash2, Tag, ChevronUp, ChevronDown, X } from 'lucide-react';

interface PricingEditorProps {
  pricing: PricingOffer[];
  onChange: (offers: PricingOffer[]) => void;
}

const PricingEditor: React.FC<PricingEditorProps> = ({ pricing, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addOffer = () => {
    const newOffer: PricingOffer = { id: Date.now().toString(), name: 'New Ticket Type', price: '0', currency: '$', features: [], buttonText: 'Register Now', buttonUrl: '#', isSoldOut: false, isHighlighted: false };
    onChange([...pricing, newOffer]);
    setExpandedId(newOffer.id);
  };

  const removeOffer = (id: string) => {
    onChange(pricing.filter(o => o.id !== id));
  };

  const updateOffer = (id: string, field: keyof PricingOffer, value: any) => {
    onChange(pricing.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const addFeature = (offerId: string) => {
    const offer = pricing.find(o => o.id === offerId);
    if (offer) {
      updateOffer(offerId, 'features', [...offer.features, 'New Feature']);
    }
  };

  const updateFeature = (offerId: string, idx: number, val: string) => {
    const offer = pricing.find(o => o.id === offerId);
    if (offer) {
      const updated = [...offer.features];
      updated[idx] = val;
      updateOffer(offerId, 'features', updated);
    }
  };

  const removeFeature = (offerId: string, idx: number) => {
    const offer = pricing.find(o => o.id === offerId);
    if (offer) {
      updateOffer(offerId, 'features', offer.features.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-slate-500">{pricing.length} Offers</span>
        <button onClick={addOffer} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Offer
        </button>
      </div>

      <div className="space-y-4">
        {pricing.map((offer) => (
          <div key={offer.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === offer.id ? null : offer.id)}
            >
              <div className="flex items-center gap-3">
                 <div className={`p-1.5 rounded text-white ${offer.isHighlighted ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                   <Tag size={14} />
                 </div>
                 <div>
                   <h5 className="text-sm font-semibold text-slate-800">{offer.name || 'Unnamed Offer'}</h5>
                   <span className="text-xs text-slate-500">{offer.currency}{offer.price}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeOffer(offer.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedId === offer.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {expandedId === offer.id && (
              <div className="p-4 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={offer.name} onChange={(e) => updateOffer(offer.id, 'name', e.target.value)} placeholder="Offer Name" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white" />
                  <input type="text" value={offer.price} onChange={(e) => updateOffer(offer.id, 'price', e.target.value)} placeholder="Price" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white" />
                </div>
                <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="text-xs font-medium text-slate-700">Highlighted</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={offer.isHighlighted} onChange={(e) => updateOffer(offer.id, 'isHighlighted', e.target.checked)} />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                  </label>
                </div>
                <div className="space-y-2">
                  {offer.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={f} onChange={(e) => updateFeature(offer.id, i, e.target.value)} className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs" />
                      <button onClick={() => removeFeature(offer.id, i)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                    </div>
                  ))}
                  <button onClick={() => addFeature(offer.id)} className="text-[10px] text-indigo-600 font-medium">+ Add Feature</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingEditor;
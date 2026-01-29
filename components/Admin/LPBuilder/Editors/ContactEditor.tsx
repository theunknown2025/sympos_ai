import React from 'react';
import { ContactConfig } from '../../../../types';
import { MessageSquare, MapPin, Mail, User, Phone } from 'lucide-react';

interface ContactEditorProps {
  config: ContactConfig;
  onChange: (config: ContactConfig) => void;
}

const ContactEditor: React.FC<ContactEditorProps> = ({ config, onChange }) => {
  const update = (field: keyof ContactConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
       <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
             <span className="text-xs font-medium text-slate-700">Form</span>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={config.showForm} onChange={(e) => update('showForm', e.target.checked)} />
               <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
             </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
             <span className="text-xs font-medium text-slate-700">Map</span>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={config.showMap} onChange={(e) => update('showMap', e.target.checked)} />
               <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
             </label>
          </div>
       </div>

       <div className="space-y-3 pt-2">
         <input type="text" value={config.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} placeholder="Contact Person" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
         <input type="email" value={config.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
         <input type="text" value={config.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
         <textarea rows={2} value={config.address} onChange={(e) => update('address', e.target.value)} placeholder="Address" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" />
       </div>
    </div>
  );
};

export default ContactEditor;

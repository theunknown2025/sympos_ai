import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const PaymentManager: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Payment Manager</h2>
          <p className="text-sm text-slate-600">
            You need to be signed in to manage course payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <CreditCard className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Manager</h1>
            <p className="text-sm text-slate-500">
              Configure paid courses and manage payment settings for Academy.
            </p>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <CreditCard size={16} />
          Paid Courses
        </h2>
        <div className="p-6 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-2">
          <p>
            The Payment Manager allows you to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Mark courses as paid or free</li>
            <li>Set course prices and currency</li>
            <li>Link paid courses to payment offers</li>
            <li>Track payment status per enrollment</li>
          </ul>
          <p className="pt-4 text-slate-500">
            Payment integration will be enabled once the Academy schema is extended with payment fields
            and connected to your existing payment infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentManager;


import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, UserPlus, AlertCircle, User, Building2, Briefcase } from 'lucide-react';
import { supabase } from "../../../supabase";
import { SubscriptionType, SubscriptionRole } from "../../../types";
import EmailConfirmationModal from './EmailConfirmationModal';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('self');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Automatically set role based on subscription type
      const role: SubscriptionRole = subscriptionType === 'self' ? 'Participant' : 'Organizer';
      
      // Create account in Supabase with subscription metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            subscriptionType,
            role,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Show confirmation modal
        setRegisteredEmail(email);
        setShowConfirmationModal(true);
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSubscriptionType('self');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError('An account with this email already exists.');
      } else if (err.message?.includes('Password')) {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Get Started</h2>
        <p className="text-slate-500 mt-1">Join the community of scientific organizers.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-shake">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subscription Details */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="text-indigo-600" size={18} />
            <h3 className="text-sm font-semibold text-slate-900">Subscription Details</h3>
          </div>
          
          {/* Subscription Type */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Subscribe on behalf of <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSubscriptionType('self')}
                className={`p-3 border-2 rounded-lg transition-all flex items-center gap-2 ${
                  subscriptionType === 'self'
                    ? 'border-indigo-600 bg-indigo-100 text-indigo-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300'
                }`}
              >
                <User size={16} />
                <span className="text-sm font-medium">Myself</span>
              </button>
              <button
                type="button"
                onClick={() => setSubscriptionType('entity')}
                className={`p-3 border-2 rounded-lg transition-all flex items-center gap-2 ${
                  subscriptionType === 'entity'
                    ? 'border-indigo-600 bg-indigo-100 text-indigo-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300'
                }`}
              >
                <Building2 size={16} />
                <span className="text-sm font-medium">Entity</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="alex@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="Minimum 6 characters"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${
                error === 'Passwords do not match' ? 'border-red-300 ring-1 ring-red-50' : 'border-slate-200'
              }`}
              placeholder="Verify password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Create Account
              <UserPlus className="group-hover:scale-110 transition-transform" size={18} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="font-bold text-indigo-600 hover:text-indigo-700"
        >
          Sign in
        </button>
      </p>

      {/* Email Confirmation Modal */}
      <EmailConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          onSwitchToLogin();
        }}
        email={registeredEmail}
        type="register"
      />
    </div>
  );
};

export default RegisterForm;

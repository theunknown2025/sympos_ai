
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Globe } from 'lucide-react';

interface AuthContainerProps {
  onAuthSuccess: () => void;
  initialView?: 'login' | 'register';
}

const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'register'>(initialView);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <Globe className="text-white" size={28} />
          </div>
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
            Sympose AI
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200 border border-white p-8 md:p-10 relative">
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border-4 border-white">
            S
          </div>

          {view === 'login' ? (
            <LoginForm 
              onSuccess={onAuthSuccess} 
              onSwitchToRegister={() => setView('register')} 
            />
          ) : (
            <RegisterForm 
              onSuccess={onAuthSuccess} 
              onSwitchToLogin={() => setView('login')} 
            />
          )}
        </div>

        {/* Footer info */}
        <p className="mt-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
          The Future of Scientific Organization
        </p>
      </div>
    </div>
  );
};

export default AuthContainer;

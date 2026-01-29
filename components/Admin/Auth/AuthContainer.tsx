
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
  const [imageError, setImageError] = useState(false);
  // Image URL from Supabase storage
  const imageUrl = 'https://gcgxgtixscwpiiuenlub.supabase.co/storage/v1/object/public/Materials/ChatGPT%20Image%2021%20janv.%202026,%2018_34_44.png';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="w-full max-w-6xl z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <Globe className="text-white" size={28} />
          </div>
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
            Sympose AI
          </span>
        </div>

        {/* Auth Container with Image */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200 border border-white relative p-4">
          {/* Floating "S" Badge - Positioned between form and image */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-50 rounded-full items-center justify-center text-indigo-600 font-bold border-4 border-white z-30 floating-badge shadow-lg">
            S
          </div>

          <div className="grid md:grid-cols-2 gap-4" style={{ minHeight: '600px' }}>
            {/* Image Section - Hidden on mobile, shown on desktop */}
            <div 
              className={`hidden md:block relative transition-all duration-700 ease-in-out overflow-hidden ${
                view === 'login' ? 'order-1' : 'order-2'
              }`}
              style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 z-0 rounded-[1.5rem]"></div>
              {!imageError ? (
                <>
                  <img 
                    src={imageUrl}
                    alt="Authentication"
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-10 rounded-[1.5rem]"
                    style={{ display: 'block', width: '100%', height: '100%', borderRadius: '1.5rem' }}
                    onError={(e) => {
                      console.error('Failed to load image:', imageUrl);
                      console.error('Error event:', e);
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully');
                      setImageError(false);
                    }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 rounded-[1.5rem]">
                  <div className="text-center p-8">
                    <p className="text-slate-400 text-sm mb-2">Image failed to load</p>
                    <a 
                      href={imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 text-xs underline"
                    >
                      Open image URL
                    </a>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-20 pointer-events-none rounded-[1.5rem]"></div>
            </div>

            {/* Form Section */}
            <div 
              className={`flex items-center justify-center p-8 md:p-10 transition-all duration-700 ease-in-out ${
                view === 'login' ? 'md:order-2 order-1' : 'md:order-1 order-1'
              }`}
              style={{ minHeight: '600px' }}
            >
              <div className="w-full max-w-md h-full flex flex-col">
                <div 
                  key={view}
                  className="animate-fade-in w-full h-full flex flex-col justify-center"
                  style={{
                    animation: 'fadeInSlide 0.5s ease-out',
                    minHeight: '100%'
                  }}
                >
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
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
          The Future of Scientific Organization
        </p>
      </div>

      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
        }
        
        .floating-badge {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthContainer;

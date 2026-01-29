import React, { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../routes';
import { ViewState } from '../../types';
import { NetworkingIllustration } from './Illustrations';

const CTA: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show elements immediately on mount
    if (sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('.fade-in');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate-fade-in');
        }, index * 150);
      });
    }

    // Also set up IntersectionObserver as fallback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('.fade-in');
      elements.forEach((el) => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    '14-day free trial',
    'No credit card required',
    'Cancel anytime',
    'Full feature access',
    '24/7 support included',
  ];

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="relative min-h-screen py-32 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-40 animate-float-cta"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Enhanced Badge */}
          <div className="fade-in inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full text-white text-base font-semibold mb-10 shadow-xl">
            <Sparkles size={20} />
            <span>Start Your Journey Today</span>
          </div>

          {/* Enhanced Heading */}
          <h2 className="fade-in text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400">
              Event Management?
            </span>
          </h2>

          {/* Enhanced Description */}
          <p className="fade-in text-2xl md:text-3xl text-indigo-100 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
            Join thousands of scientific organizations worldwide who trust Sympose AI
            to power their events. Get started in minutes, no credit card required.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="fade-in flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
              className="group px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-3 shadow-2xl"
            >
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={24} />
            </button>
            <button
              onClick={() => navigate(getRoutePath(ViewState.LOGIN))}
              className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border-2 border-white/40 rounded-2xl font-bold text-xl hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl"
            >
              Sign In
            </button>
          </div>

          {/* Enhanced Features List */}
          <div className="fade-in grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white justify-center md:justify-start bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20"
              >
                <CheckCircle2 size={24} className="text-yellow-300 flex-shrink-0" />
                <span className="font-semibold text-lg">{feature}</span>
              </div>
            ))}
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="fade-in pt-12 border-t-2 border-white/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { number: '99.9%', label: 'Uptime Guarantee' },
                { number: '24/7', label: 'Support Available' },
                { number: 'GDPR', label: 'Compliant & Secure' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-5xl font-extrabold text-white mb-3">{stat.number}</div>
                  <div className="text-lg text-indigo-100 font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-cta {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-25px) translateX(10px);
            opacity: 0.6;
          }
        }
        .animate-float-cta {
          animation: float-cta linear infinite;
        }
        .fade-in {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-in:not(.animate-fade-in) {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-in.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};

export default CTA;

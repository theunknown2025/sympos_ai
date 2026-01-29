import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, PlayCircle } from 'lucide-react';
import { getRoutePath } from '../../routes';
import { ViewState } from '../../types';
import HeroFeatureColumns from './HeroFeatureColumns';

/**
 * PROFESSIONAL HERO SECTION
 * International Conference Management System
 * Focus: Time, Effort, Cost Reduction
 */

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    heroRef.current
      .querySelectorAll<HTMLElement>('.reveal')
      .forEach((el, i) => setTimeout(() => el.classList.add('reveal-in'), i * 120));
  }, []);

  return (
    <section
      id="hero"
      className="relative isolate min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900"
    >
      {/* Elegant animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Floating dots */}
        {[...Array(28)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-indigo-400/40 animate-float-dot"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}

        {/* Subtle connecting lines */}
        <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gridLines" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#818cf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridLines)" />
        </svg>
      </div>

      <div
        ref={heroRef}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-24 pb-32"
      >
        {/* Badge */}
        <div className="reveal mb-8 inline-flex items-center gap-2 self-center rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-indigo-200 backdrop-blur lg:self-start">
          <Sparkles size={16} className="text-indigo-300" />
          Trusted by International Scientific Committees
        </div>

        {/* Heading */}
        <h1 className="reveal mb-8 max-w-4xl text-center text-5xl font-extrabold leading-tight text-white md:text-6xl lg:text-left xl:text-7xl">
          Run World‑Class Conferences
          <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            With Less Time, Less Effort, Less Cost
          </span>
        </h1>

        {/* Value proposition */}
        <p className="reveal mb-12 max-w-2xl text-center text-xl leading-relaxed text-slate-300 lg:text-left">
          SYMPOS‑AI is an all‑in‑one conference management system designed for international scientific events.
          Automate submissions, peer review, scheduling, communication, certificates, and analytics — powered by AI.
        </p>

        {/* CTA buttons */}
        <div className="reveal flex flex-col items-center gap-5 sm:flex-row lg:items-start">
          <button
            onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
            className="group flex items-center gap-3 rounded-2xl bg-indigo-600 px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-indigo-600/40 transition hover:scale-105 hover:bg-indigo-500"
          >
            Get Started Free
            <ArrowRight className="transition group-hover:translate-x-1" />
          </button>

          <button
            className="flex items-center gap-3 rounded-2xl border border-white/20 px-10 py-5 text-lg font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            <PlayCircle />
            Watch Platform Overview
          </button>
        </div>
      </div>

      {/* Right-side animated feature columns */}
      <div className="pointer-events-none absolute inset-y-0 right-[15%] hidden items-center lg:flex">
        <HeroFeatureColumns />
      </div>

      <style>{`
        @keyframes floatDot {
          0%, 100% { transform: translateY(0); opacity: .4; }
          50% { transform: translateY(-24px); opacity: .8; }
        }
        .animate-float-dot {
          animation: floatDot linear infinite;
        }
        .reveal {
          opacity: 0;
          transform: translateY(30px);
        }
        .reveal.reveal-in {
          opacity: 1;
          transform: translateY(0);
          transition: all .8s ease;
        }
      `}</style>
    </section>
  );
};

export default Hero;

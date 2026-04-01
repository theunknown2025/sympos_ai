import React from 'react';
import { Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { PresenterSpeaker, PresenterEvent } from '../../../../../types';

interface Template1PreviewProps {
  speaker: PresenterSpeaker;
  event: PresenterEvent;
}

// Preview version without fixed positioning for use in template selector
const Template1Preview: React.FC<Template1PreviewProps> = ({ speaker, event }) => {
  return (
    <div className="relative w-full h-full bg-white overflow-hidden" style={{ minHeight: '600px' }}>
      {/* Two-tone Background */}
      <div className="absolute inset-0">
        {/* White upper section */}
        <div className="absolute top-0 left-0 right-0 h-2/5 bg-white"></div>
        {/* Teal lower section */}
        <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-br from-teal-500 to-cyan-600"></div>
      </div>

      {/* Curved Decorative Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 1 }}>
          <path
            d="M 0 100 Q 200 50 400 80 T 800 70 T 1200 90"
            stroke="rgba(20, 184, 166, 0.15)"
            strokeWidth="3"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 0 120 Q 250 70 500 100 T 1000 85 T 1500 110"
            stroke="rgba(20, 184, 166, 0.2)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center p-8 md:p-12">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="relative z-20 space-y-8">
            {/* Event Information - Small at top */}
            <div className="mb-6">
              <div className="text-sm font-medium text-teal-600 mb-2 uppercase tracking-wide">
                {event.name}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {event.date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {event.place && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{event.place}</span>
                  </div>
                )}
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                  >
                    <LinkIcon size={14} />
                    <span>Event Link</span>
                  </a>
                )}
              </div>
            </div>

            {/* Speaker Name - Large Bold Text */}
            <div className="space-y-2">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-tight">
                {speaker.name.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </h1>
            </div>

            {/* Title and Entity */}
            {(speaker.title || speaker.entity) && (
              <div className="space-y-1">
                {speaker.title && (
                  <div className="text-2xl md:text-3xl font-semibold text-slate-700">
                    {speaker.title}
                  </div>
                )}
                {speaker.entity && (
                  <div className="text-xl md:text-2xl text-slate-600">
                    {speaker.entity}
                  </div>
                )}
              </div>
            )}

            {/* Intervention Title - On Teal Background */}
            {speaker.interventionTitle && (
              <div className="mt-8 p-6 bg-teal-500 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                  {speaker.interventionTitle}
                </div>
              </div>
            )}

            {/* Speaker Info */}
            {speaker.speakerInfo && (
              <div className="mt-6">
                <div className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {speaker.speakerInfo}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Circular Photo */}
          <div className="relative flex justify-center lg:justify-end items-center">
            <div className="relative">
              {/* Circular Frame with Photo */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                {/* Outer Circle - Overlaps both sections */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-2 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                    {speaker.picture ? (
                      <img
                        src={speaker.picture}
                        alt={speaker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <div className="text-6xl font-bold text-slate-400">
                          {speaker.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Decorative Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-teal-400/30"></div>
              </div>

              {/* Floating Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-teal-200/20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-cyan-200/20 blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Floating Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-teal-400/10"
            style={{
              width: Math.random() * 60 + 20 + 'px',
              height: Math.random() * 60 + 20 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 4 + 3}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { transform: translateY(-15px) translateX(10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Template1Preview;

import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  FileText,
  Send,
  Award,
  ClipboardList,
  Code,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { NetworkingIllustration, CollaborationIllustration } from './Illustrations';

const ParticipantFeatures: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: User,
      title: 'Profile Management',
      description: 'Create and manage your professional profile with academic credentials, affiliations, and research domains.',
      color: 'indigo',
    },
    {
      icon: Mail,
      title: 'Committee Invitations',
      description: 'Receive and respond to review committee invitations. Accept or decline with ease.',
      color: 'violet',
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Browse available events, confirm attendance, and track your participation history.',
      color: 'indigo',
    },
    {
      icon: FileText,
      title: 'Paper Submissions',
      description: 'Submit your research papers, track submission status, and receive notifications on decisions.',
      color: 'violet',
    },
    {
      icon: ClipboardList,
      title: 'Registrations',
      description: 'Register for conferences and events with customizable forms. Track all your registrations in one place.',
      color: 'indigo',
    },
    {
      icon: Send,
      title: 'Peer Reviews',
      description: 'Conduct thorough peer reviews with our intuitive review system. Provide detailed feedback and scores.',
      color: 'violet',
    },
    {
      icon: Award,
      title: 'Certificates',
      description: 'Receive digital certificates for your participation, presentations, and contributions.',
      color: 'indigo',
    },
    {
      icon: Code,
      title: 'LaTeX Editor',
      description: 'Professional LaTeX editor for writing and formatting academic papers with real-time preview.',
      color: 'violet',
    },
  ];

  return (
    <section
      id="participant-features"
      className="relative min-h-screen py-32 bg-gradient-to-b from-white via-violet-50/30 to-white overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Gradient Orbs */}
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-200/25 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-gradient-to-tl from-violet-200/25 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-indigo-100/10 via-violet-100/10 to-indigo-100/10 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-8 shadow-sm">
            <Sparkles size={18} className="text-indigo-600" />
            <span>For Participants & Reviewers</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Participant{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Features
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need as a researcher, reviewer, or conference participant in one powerful platform
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            const isIndigo = feature.color === 'indigo';

            return (
              <div
                key={index}
                className={`
                  group relative bg-white rounded-3xl p-8 border-2
                  transition-all duration-500 cursor-pointer
                  ${
                    isHovered
                      ? isIndigo
                        ? 'border-indigo-400 shadow-2xl shadow-indigo-500/30 scale-105 -translate-y-2'
                        : 'border-violet-400 shadow-2xl shadow-violet-500/30 scale-105 -translate-y-2'
                      : 'border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl'
                  }
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  transitionDelay: `${index * 80}ms`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`
                  absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500
                  ${isHovered
                    ? isIndigo
                      ? 'opacity-5 bg-gradient-to-br from-indigo-500 to-indigo-600'
                      : 'opacity-5 bg-gradient-to-br from-violet-500 to-violet-600'
                    : ''
                  }
                `}></div>

                {/* Enhanced Icon */}
                <div
                  className={`
                    relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                    transition-all duration-500
                    ${
                      isHovered
                        ? isIndigo
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 scale-110 rotate-3 shadow-xl shadow-indigo-500/50'
                          : 'bg-gradient-to-br from-violet-600 to-violet-700 scale-110 rotate-3 shadow-xl shadow-violet-500/50'
                        : isIndigo
                        ? 'bg-indigo-100 group-hover:bg-indigo-200'
                        : 'bg-violet-100 group-hover:bg-violet-200'
                    }
                  `}
                >
                  <Icon
                    className={`transition-colors duration-500 ${
                      isHovered 
                        ? 'text-white' 
                        : isIndigo 
                        ? 'text-indigo-600' 
                        : 'text-violet-600'
                    }`}
                    size={32}
                  />
                </div>

                {/* Enhanced Content */}
                <div className="relative z-10">
                  <h3
                    className={`
                      text-xl font-bold mb-3 transition-colors duration-300
                      ${
                        isHovered
                          ? isIndigo
                            ? 'text-indigo-600'
                            : 'text-violet-600'
                          : 'text-slate-900'
                      }
                    `}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Enhanced Hover Indicator */}
                {isHovered && (
                  <div
                    className={`
                      absolute bottom-0 left-0 right-0 h-1.5 rounded-b-3xl
                      ${isIndigo 
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600' 
                        : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600'
                      }
                      animate-pulse
                    `}
                  ></div>
                )}

                {/* Decorative Corner */}
                <div className={`
                  absolute top-0 right-0 w-32 h-32 rounded-bl-3xl opacity-0 transition-opacity duration-500
                  ${isHovered
                    ? isIndigo
                      ? 'opacity-10 bg-gradient-to-br from-indigo-500 to-transparent'
                      : 'opacity-10 bg-gradient-to-br from-violet-500 to-transparent'
                    : ''
                  }
                `}></div>
              </div>
            );
          })}
        </div>

        {/* Enhanced CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-[2.5rem] p-[2px]">
            <div className="absolute inset-[2px] bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] opacity-90"></div>
          </div>
          <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-[2.5rem] p-12 md:p-16 text-white overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)] animate-pulse"></div>
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Join as a Participant?
              </h3>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Create your profile and start participating in scientific events worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                {[
                  { text: 'Free to join', icon: CheckCircle2 },
                  { text: 'No commitment', icon: CheckCircle2 },
                  { text: 'Instant access', icon: CheckCircle2 },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Icon className="text-yellow-300" size={20} />
                      <span className="font-semibold">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </section>
  );
};

export default ParticipantFeatures;

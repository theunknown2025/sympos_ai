import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Award,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ConferenceIllustration, CollaborationIllustration } from './Illustrations';

const Features: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'Submission Management',
      description: 'Streamline paper submissions with automated workflows, version control, and comprehensive tracking.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Users,
      title: 'Review System',
      description: 'Powerful peer review system with blind review options, scoring, and committee management.',
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      icon: Award,
      title: 'Certificate Generation',
      description: 'Automatically generate professional certificates for participants, speakers, and reviewers.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Mail,
      title: 'Email Automation',
      description: 'Send personalized emails, reminders, and notifications with customizable templates.',
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Complete event lifecycle management from planning to execution and follow-up.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Comprehensive dashboards with real-time analytics and exportable reports.',
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with GDPR compliance and data protection measures.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Zap,
      title: 'AI-Powered Tools',
      description: 'Leverage AI for content generation, smart recommendations, and automated workflows.',
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Fully localized interface supporting multiple languages for international events.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
    },
  ];

  return (
    <section
      id="features"
      className="relative min-h-screen py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-violet-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-200/10 via-violet-200/10 to-indigo-200/10 rounded-full blur-3xl"></div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="featuresGrid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#featuresGrid)" className="text-indigo-600" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Sparkles size={16} className="text-indigo-600" />
            <span>Comprehensive Platform</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Powerful Features for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient">
              Modern Events
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to organize, manage, and execute successful scientific conferences with cutting-edge technology
          </p>
        </div>

        {/* Features Grid - Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            const isIndigo = feature.color === 'indigo';

            return (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Card with enhanced styling */}
                <div
                  className={`
                    relative h-full bg-white rounded-3xl p-8 border-2 transition-all duration-500
                    ${isHovered 
                      ? isIndigo
                        ? 'border-indigo-300 shadow-2xl shadow-indigo-500/20 scale-105 -translate-y-2'
                        : 'border-violet-300 shadow-2xl shadow-violet-500/20 scale-105 -translate-y-2'
                      : 'border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl'
                    }
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`,
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

                  {/* Icon Container */}
                  <div className="relative z-10 mb-6">
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500
                      ${isHovered
                        ? isIndigo
                          ? `bg-gradient-to-br ${feature.gradient} text-white shadow-xl shadow-indigo-500/50 scale-110 rotate-3`
                          : `bg-gradient-to-br ${feature.gradient} text-white shadow-xl shadow-violet-500/50 scale-110 rotate-3`
                        : isIndigo
                        ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                        : 'bg-violet-50 text-violet-600 group-hover:bg-violet-100'
                      }
                    `}>
                      <Icon size={28} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className={`
                      text-xl font-bold mb-3 transition-colors duration-300
                      ${isHovered
                        ? isIndigo ? 'text-indigo-600' : 'text-violet-600'
                        : 'text-slate-900'
                      }
                    `}>
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-base">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative Corner Element */}
                  <div className={`
                    absolute top-0 right-0 w-24 h-24 rounded-bl-3xl opacity-0 transition-opacity duration-500
                    ${isHovered 
                      ? isIndigo 
                        ? 'opacity-10 bg-gradient-to-br from-indigo-500 to-transparent' 
                        : 'opacity-10 bg-gradient-to-br from-violet-500 to-transparent'
                      : ''
                    }
                  `}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Benefits Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-[2.5rem] p-[2px]">
            <div className="absolute inset-[2px] bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] opacity-90"></div>
          </div>
          <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-[2.5rem] p-12 md:p-16 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h3 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Sympose AI?</h3>
                <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                  Trusted by leading scientific organizations worldwide
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { text: '99.9% Uptime', icon: Shield },
                  { text: '24/7 Support', icon: Users },
                  { text: 'No Credit Card Required', icon: CheckCircle2 },
                  { text: 'Free Trial Available', icon: Sparkles },
                ].map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div 
                      key={index} 
                      className="flex flex-col items-center gap-3 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      <Icon size={32} className="text-yellow-300" />
                      <span className="font-semibold text-lg">{benefit.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default Features;

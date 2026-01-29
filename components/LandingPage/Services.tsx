import React, { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  UserCheck,
  FileCheck,
  Mail,
  Award,
  Calendar,
  BarChart,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../routes';
import { ViewState } from '../../types';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate cards on mount
    setIsVisible(true);
    
    // Also set up IntersectionObserver as fallback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-scale-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll('.service-card');
      cards.forEach((card, index) => {
        // Animate with staggered delay
        setTimeout(() => {
          card.classList.add('animate-scale-in');
        }, index * 100);
        observer.observe(card);
      });
    }

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      icon: ClipboardList,
      title: 'Registration Management',
      description: 'Customizable registration forms with payment integration, automated confirmations, and attendee management.',
      features: ['Custom Forms', 'Payment Processing', 'Attendee Tracking'],
    },
    {
      icon: FileCheck,
      title: 'Submission Handling',
      description: 'Complete submission workflow from initial upload to final decision, with version control and tracking.',
      features: ['Document Upload', 'Version Control', 'Status Tracking'],
    },
    {
      icon: UserCheck,
      title: 'Review & Evaluation',
      description: 'Comprehensive peer review system with blind review options, scoring rubrics, and committee coordination.',
      features: ['Blind Reviews', 'Scoring System', 'Committee Management'],
    },
    {
      icon: Mail,
      title: 'Communication Hub',
      description: 'Centralized communication platform with email templates, automated notifications, and bulk messaging.',
      features: ['Email Templates', 'Automated Notifications', 'Bulk Messaging'],
    },
    {
      icon: Award,
      title: 'Certificate Generation',
      description: 'Automated certificate creation for participants, speakers, reviewers, and sponsors with custom designs.',
      features: ['Custom Templates', 'Bulk Generation', 'Digital Signatures'],
    },
    {
      icon: Calendar,
      title: 'Event Scheduling',
      description: 'Intelligent scheduling system for sessions, workshops, and meetings with conflict detection.',
      features: ['Session Planning', 'Conflict Detection', 'Calendar Integration'],
    },
    {
      icon: BarChart,
      title: 'Analytics Dashboard',
      description: 'Real-time insights and comprehensive reports on registrations, submissions, reviews, and engagement.',
      features: ['Real-time Metrics', 'Custom Reports', 'Data Export'],
    },
    {
      icon: Settings,
      title: 'Customization & Integration',
      description: 'Fully customizable platform with API access and integrations with popular tools and services.',
      features: ['API Access', 'Third-party Integrations', 'White-label Options'],
    },
  ];

  return (
    <section
      id="services"
      className="relative min-h-screen py-32 bg-gradient-to-b from-white via-indigo-50/30 to-white overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Gradient Orbs */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-indigo-300/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-tl from-violet-300/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-indigo-300/20 rounded-2xl blur-2xl rotate-45 animate-float-shape" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-violet-300/20 rounded-full blur-2xl animate-float-shape" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="saasPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="40" height="40" fill="currentColor" />
                <rect x="40" y="40" width="40" height="40" fill="currentColor" />
                <circle cx="20" cy="20" r="3" fill="currentColor" />
                <circle cx="60" cy="60" r="3" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#saasPattern)" className="text-indigo-600" />
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <ClipboardList size={16} className="text-indigo-600" />
            <span>Complete Solutions</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Comprehensive{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Services
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            End-to-end solutions for every aspect of your scientific event, from planning to execution
          </p>
        </div>

        {/* Enhanced Services Grid */}
        <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className={`
                  service-card group relative bg-white rounded-3xl p-8 border-2 border-slate-100
                  hover:border-indigo-200 hover:shadow-2xl transition-all duration-500
                  hover:-translate-y-2 overflow-hidden
                  ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                `}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Decorative Corner Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-violet-100/50 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Enhanced Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-2xl group-hover:shadow-indigo-500/50">
                    <Icon className="text-white" size={28} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-base mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  
                  {/* Enhanced Features List */}
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                        <div className="w-2 h-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Event Management?
              </h3>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of organizations already using Sympose AI to streamline their scientific events
              </p>
              <button
                onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
                className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-shape {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.3;
          }
        }
        .animate-float-shape {
          animation: float-shape ease-in-out infinite;
        }
        .service-card {
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        .service-card.animate-scale-in {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
      `}</style>
    </section>
  );
};

export default Services;

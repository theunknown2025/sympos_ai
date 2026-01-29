import React, { useEffect, useRef } from 'react';
import { Target, Lightbulb, Heart, TrendingUp } from 'lucide-react';
import { NetworkingIllustration, CollaborationIllustration } from './Illustrations';

const About: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show elements immediately on mount
    if (sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('.fade-in');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate-fade-in');
        }, index * 100);
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

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description:
        'To empower scientific organizations worldwide with cutting-edge technology that simplifies event management and enhances collaboration.',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description:
        'We continuously evolve our platform with the latest AI technologies and user feedback to stay ahead of the curve.',
      color: 'from-violet-500 to-violet-600',
    },
    {
      icon: Heart,
      title: 'User-Centric',
      description:
        'Every feature is designed with our users in mind, ensuring an intuitive and delightful experience for all stakeholders.',
      color: 'from-indigo-500 to-violet-600',
    },
    {
      icon: TrendingUp,
      title: 'Growth',
      description:
        'We support organizations at every stage, from small workshops to large international conferences with thousands of participants.',
      color: 'from-violet-500 to-indigo-600',
    },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative min-h-screen py-32 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-200/30 via-indigo-100/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[900px] h-[900px] bg-gradient-to-tr from-violet-200/30 via-violet-100/20 to-transparent rounded-full blur-3xl"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="aboutPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="2" fill="currentColor" />
                <path d="M 0 60 L 120 60" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 60 0 L 60 120" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#aboutPattern)" className="text-indigo-600" />
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="fade-in text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Target size={16} className="text-indigo-600" />
            <span>Our Story</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            About{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Sympose AI
            </span>
          </h2>
        </div>

        {/* Subtitle */}
        <div className="fade-in text-center mb-8">
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
            Empowering international scientific organizations with cutting-edge event management solutions
          </p>
        </div>

        {/* First Text */}
        <div className="fade-in mb-8">
          <p className="text-lg md:text-xl text-slate-700 leading-relaxed text-center max-w-4xl mx-auto">
            Sympose AI is a comprehensive platform designed specifically for international scientific
            organizations. We understand the complexities of managing academic events and have built
            a solution that addresses every aspect of event organization.
          </p>
        </div>

        {/* Second Text */}
        <div className="fade-in mb-16">
          <p className="text-lg text-slate-600 leading-relaxed text-center max-w-4xl mx-auto">
            From initial planning to post-event follow-up, our platform streamlines workflows,
            reduces administrative burden, and enables organizers to focus on what matters most:
            creating meaningful scientific exchanges.
          </p>
        </div>

        {/* Values Cards - Without Container */}
        <div className="fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div 
                  key={index} 
                  className="group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex-shrink-0">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed flex-grow">{value.description}</p>
                </div>
              );
            })}
          </div>
      </div>

      <style>{`
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

export default About;

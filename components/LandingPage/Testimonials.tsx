import React, { useEffect, useRef, useState } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConferenceIllustration } from './Illustrations';

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Conference Chair',
      organization: 'International Bioinformatics Society',
      image: '👩‍🔬',
      rating: 5,
      text: 'Sympose AI transformed how we manage our annual conference. The submission and review process that used to take weeks now takes days. The platform is intuitive, powerful, and our reviewers love it.',
    },
    {
      name: 'Prof. Michael Rodriguez',
      role: 'Event Coordinator',
      organization: 'European Research Network',
      image: '👨‍🏫',
      rating: 5,
      text: 'We\'ve organized 15+ events using Sympose AI. The certificate generation feature alone saves us countless hours. The support team is responsive, and the platform keeps getting better with each update.',
    },
    {
      name: 'Dr. Aisha Patel',
      role: 'Program Director',
      organization: 'Global Health Symposium',
      image: '👩‍⚕️',
      rating: 5,
      text: 'The analytics dashboard gives us insights we never had before. We can now make data-driven decisions about our events. Registration management is seamless, and attendees appreciate the smooth experience.',
    },
    {
      name: 'Prof. James Wilson',
      role: 'Organizing Committee',
      organization: 'International Physics Conference',
      image: '👨‍🔬',
      rating: 5,
      text: 'Managing 500+ submissions used to be a nightmare. With Sympose AI, we have complete visibility and control. The AI-powered features help us identify potential issues early, and the review workflow is excellent.',
    },
  ];

  useEffect(() => {
    // Show cards immediately on mount
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll('.testimonial-card');
      cards.forEach((card) => {
        card.classList.add('animate-fade-in');
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
      const cards = sectionRef.current.querySelectorAll('.testimonial-card');
      cards.forEach((card) => observer.observe(card));
    }

    return () => observer.disconnect();
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative min-h-screen py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-tl from-violet-200/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Quote size={16} className="text-indigo-600" />
            <span>Client Testimonials</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Trusted by{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Leading Organizations
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            See what our users have to say about their experience with Sympose AI
          </p>
        </div>

        {/* Enhanced Testimonials Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Enhanced Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-16 z-10 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-50 transition-all duration-300 border-2 border-slate-200 hover:border-indigo-300 hover:scale-110"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="text-indigo-600" size={28} />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-16 z-10 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-50 transition-all duration-300 border-2 border-slate-200 hover:border-indigo-300 hover:scale-110"
            aria-label="Next testimonial"
          >
            <ChevronRight className="text-indigo-600" size={28} />
          </button>

          {/* Enhanced Testimonial Cards */}
          <div className="relative overflow-hidden rounded-[2.5rem]">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="testimonial-card min-w-full px-4 md:px-8"
                >
                  <div className="relative bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/30 rounded-[2.5rem] p-10 md:p-16 border-2 border-indigo-100/50 shadow-2xl overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-200/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center">
                          <Quote className="text-indigo-500" size={48} />
                        </div>
                      </div>
                      <div className="flex justify-center mb-8 gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="text-yellow-400 fill-yellow-400"
                            size={28}
                          />
                        ))}
                      </div>
                      <p className="text-xl md:text-2xl text-slate-700 text-center mb-10 leading-relaxed italic font-medium">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-6xl">{testimonial.image}</div>
                        <div className="text-left">
                          <div className="font-bold text-slate-900 text-xl mb-1">
                            {testimonial.name}
                          </div>
                          <div className="text-slate-600 text-lg mb-1">{testimonial.role}</div>
                          <div className="text-indigo-600 font-semibold text-lg">
                            {testimonial.organization}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Dots Indicator */}
          <div className="flex justify-center gap-3 mt-12">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-indigo-600 w-10 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-300 w-2 hover:bg-slate-400 hover:w-6'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .testimonial-card {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonial-card:not(.animate-fade-in) {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .testimonial-card.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};

export default Testimonials;

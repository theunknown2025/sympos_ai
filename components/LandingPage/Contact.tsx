import React, { useEffect, useRef } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

const Contact: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('.contact-fade');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate-fade-in');
        }, index * 150);
      });
    }
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative min-h-screen py-32 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden"
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-indigo-200/25 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-tl from-violet-200/25 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-16 contact-fade">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Mail size={16} className="text-indigo-600" />
            <span>Get in Touch</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Contact{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Us
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Tell us about your conference or organization and we&apos;ll get back to you with the best setup for Sympose AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Enhanced Contact Info & Form */}
          <div className="space-y-8 contact-fade">
            {/* Enhanced Contact Info Card */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-100 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Get in touch</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="text-white" size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1">Email</div>
                    <a
                      href="mailto:contact@sympose.ai"
                      className="text-indigo-600 hover:text-indigo-700 font-semibold text-lg transition-colors"
                    >
                      contact@sympose.ai
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Phone className="text-white" size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1">Phone</div>
                    <div className="text-slate-700 font-semibold text-lg">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="text-white" size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1">Headquarters</div>
                    <div className="text-slate-700 font-semibold text-lg">Global · Remote-first team</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Contact Form */}
            <div className="bg-gradient-to-br from-white to-violet-50/30 border-2 border-violet-100 rounded-3xl p-8 shadow-xl contact-fade">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Send us a message
              </h3>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white transition-all"
                      placeholder="you@example.org"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Organization</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white transition-all"
                    placeholder="University / Society / Network"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">Message</label>
                  <textarea
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white min-h-[120px] transition-all"
                    placeholder="Tell us about your events and what you are looking for..."
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Send Message
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Map / Location Card */}
          <div className="contact-fade">
            <div className="bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-xl h-full">
              <div className="h-80 w-full bg-gradient-to-br from-indigo-100 to-violet-100 relative">
                {/* Enhanced Map placeholder */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#4f46e5_0,transparent_50%),radial-gradient(circle_at_80%_80%,#7c3aed_0,transparent_50%)] opacity-30" />
                <div className="absolute inset-6 rounded-2xl border-2 border-white/80 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center mb-4 shadow-xl">
                    <MapPin size={40} className="text-white" />
                  </div>
                  <p className="font-bold text-slate-900 text-xl mb-2">Global presence</p>
                  <p className="text-sm text-slate-700 max-w-xs">
                    Sympose AI supports conferences across all regions. Connect with us to localize your setup.
                  </p>
                </div>
              </div>
              <div className="p-8 space-y-3">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Offices & Support
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  Our team is distributed across multiple time zones to support international scientific organizations.
                </p>
                <p className="text-slate-600 pt-2">
                  Prefer email? Contact us at{' '}
                  <a
                    href="mailto:contact@sympose.ai"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
                  >
                    contact@sympose.ai
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-fade {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .contact-fade.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};

export default Contact;


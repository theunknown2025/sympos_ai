import React, { useEffect, useRef } from 'react';

const FAQ: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const items = sectionRef.current.querySelectorAll('.faq-item');
      items.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('animate-fade-in');
        }, index * 120);
      });
    }
  }, []);

  const faqs = [
    {
      question: 'What is Sympose AI?',
      answer:
        'Sympose AI is an end-to-end platform for managing scientific conferences and academic events, covering submissions, reviews, registrations, scheduling, and certificates.',
    },
    {
      question: 'Who is Sympose AI for?',
      answer:
        'We are built for international scientific organizations, universities, research networks, and professional societies that run conferences, workshops, and symposiums.',
    },
    {
      question: 'Do you support hybrid or fully virtual events?',
      answer:
        'Yes. Sympose AI supports on-site, virtual, and hybrid formats with flexible configuration for registrations, schedules, and communications.',
    },
    {
      question: 'Is my data secure and compliant?',
      answer:
        'We follow industry best practices with encryption in transit and at rest, role-based access control, audit logs, and GDPR-conscious data handling.',
    },
    {
      question: 'Can we integrate Sympose AI with our existing systems?',
      answer:
        'Yes. We offer API access and integration options so you can connect Sympose AI to your identity provider, payment gateways, and internal tools.',
    },
  ];

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative min-h-screen py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden"
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-violet-200/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <span>Common Questions</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Frequently Asked{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Questions
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Answers to the most common questions from organizing committees and scientific boards
          </p>
        </div>

        {/* Enhanced FAQ Items */}
        <div className="space-y-4 mb-12">
          {faqs.map((item, index) => (
            <details
              key={index}
              className="faq-item group bg-white rounded-2xl border-2 border-slate-100 p-6 md:p-8 shadow-lg transition-all duration-500 open:border-indigo-200 open:shadow-xl open:bg-gradient-to-br open:from-white open:to-indigo-50/30"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-lg md:text-xl font-bold text-slate-900 group-open:text-indigo-600 transition-colors duration-300 pr-4">
                  {item.question}
                </span>
                <span className="ml-4 text-indigo-500 text-2xl font-bold select-none transition-transform duration-300 group-open:rotate-45 flex-shrink-0">
                  +
                </span>
              </summary>
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* Enhanced Footer Message */}
        <div className="text-center p-8 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
          <p className="text-lg text-slate-700 mb-2 font-semibold">
            Can't find your answer?
          </p>
          <p className="text-base text-slate-600">
            Reach out via the contact form below and we'll be happy to help.
          </p>
        </div>
      </div>

      <style>{`
        .faq-item {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .faq-item.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};

export default FAQ;


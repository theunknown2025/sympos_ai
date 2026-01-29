import React, { useState } from 'react';
import { Check, ArrowRight, Key, Building2, Calendar, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../routes';
import { ViewState } from '../../types';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      icon: Gift,
      price: '$0',
      period: 'Forever',
      description: 'Perfect for trying out the platform',
      isPopular: false,
      features: [
        'Up to 1 event per month',
        'Basic submission management',
        'Email support',
        'Standard templates',
        'Up to 50 participants',
        'Basic analytics',
      ],
      buttonText: 'Get Started Free',
      buttonStyle: 'outline',
    },
    {
      id: 'per-event',
      name: 'Per Event',
      icon: Calendar,
      price: 'Custom',
      period: 'Per Event',
      description: 'Pay only for what you use',
      isPopular: false,
      features: [
        'Unlimited events',
        'Full submission management',
        'Priority email support',
        'Custom templates',
        'Unlimited participants',
        'Advanced analytics',
        'Certificate generation',
        'Review system',
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'outline',
    },
    {
      id: 'per-entity',
      name: 'Per Entity',
      icon: Building2,
      price: 'Custom',
      period: 'Monthly/Yearly',
      description: 'Best for organizations with multiple events',
      isPopular: true,
      features: [
        'Unlimited events',
        'Full platform access',
        '24/7 priority support',
        'Custom branding',
        'Unlimited participants',
        'Advanced analytics & reporting',
        'Certificate generation',
        'Complete review system',
        'API access',
        'White-label options',
        'Dedicated account manager',
        'Custom integrations',
      ],
      buttonText: 'Get Started',
      buttonStyle: 'primary',
    },
    {
      id: 'key-at-hand',
      name: 'Key at Hand',
      icon: Key,
      price: 'Custom',
      period: 'Enterprise',
      description: 'Full control and customization',
      isPopular: false,
      features: [
        'Everything in Per Entity',
        'On-premise deployment option',
        'Source code access',
        'Custom development',
        'SLA guarantee',
        'Dedicated infrastructure',
        'Advanced security features',
        'Compliance assistance',
        'Training & onboarding',
        'Custom support channels',
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'outline',
    },
  ];

  return (
    <section
      id="pricing"
      className="relative min-h-screen py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden"
    >
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-violet-200/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/3 right-1/3 w-40 h-40 bg-indigo-300/20 rounded-full blur-2xl animate-float-gentle" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-violet-300/20 rounded-full blur-2xl animate-float-gentle" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pricingPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="currentColor" />
                <path d="M 0 50 L 100 50" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 50 0 L 50 100" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pricingPattern)" className="text-indigo-600" />
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Gift size={16} className="text-indigo-600" />
            <span>Flexible Plans</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Simple, Transparent{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Pricing
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your organization's needs. All plans include our core features with no hidden costs.
          </p>
        </div>

        {/* Enhanced Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {pricingPlans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.isPopular;

            return (
              <div
                key={plan.id}
                className={`
                  group relative flex flex-col
                  transition-all duration-500
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                {/* Popular Badge - Enhanced */}
                {isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xl shadow-indigo-500/50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
                      Best Value
                    </span>
                  </div>
                )}

                {/* Card Container */}
                <div
                  className={`
                    relative h-full bg-white rounded-3xl border-2 p-8 flex flex-col
                    transition-all duration-500
                    ${
                      isPopular
                        ? 'border-indigo-400 shadow-2xl shadow-indigo-500/30 scale-105 lg:scale-110 z-10'
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl group-hover:-translate-y-2'
                    }
                  `}
                >
                  {/* Gradient Background for Popular */}
                  {isPopular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 rounded-3xl"></div>
                  )}

                  <div className="relative z-10">
                    {/* Enhanced Icon */}
                    <div
                      className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500
                        ${
                          isPopular
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/50'
                            : 'bg-indigo-100 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-violet-500'
                        }
                        group-hover:scale-110 group-hover:rotate-3
                      `}
                    >
                      <Icon
                        className={`transition-colors duration-500 ${
                          isPopular ? 'text-white' : 'text-indigo-600 group-hover:text-white'
                        }`}
                        size={32}
                      />
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{plan.description}</p>

                    {/* Enhanced Price Display */}
                    <div className="mb-8 pb-6 border-b border-slate-200">
                      <div className="flex items-baseline gap-2">
                        {plan.price === 'Custom' ? (
                          <>
                            <span className="text-4xl font-extrabold bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                              Custom
                            </span>
                            <span className="text-slate-500 text-sm ml-2">pricing</span>
                          </>
                        ) : (
                          <>
                            <span className="text-5xl font-extrabold bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                              {plan.price}
                            </span>
                            <span className="text-slate-500 text-lg">/{plan.period}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Features List */}
                    <div className="flex-grow space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div
                            className={`
                              w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300
                              ${
                                isPopular
                                  ? 'bg-indigo-100 border-2 border-indigo-200 group-hover:bg-indigo-200'
                                  : 'bg-emerald-50 border-2 border-emerald-100 group-hover:bg-emerald-100'
                              }
                            `}
                          >
                            <Check
                              size={14}
                              className={isPopular ? 'text-indigo-600' : 'text-emerald-600'}
                            />
                          </div>
                          <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced CTA Button */}
                    <button
                      onClick={() => {
                        if (plan.id === 'free' || plan.id === 'per-entity') {
                          navigate(getRoutePath(ViewState.REGISTER));
                        } else {
                          navigate(getRoutePath(ViewState.REGISTER));
                        }
                      }}
                      className={`
                        w-full py-4 px-6 rounded-2xl font-bold text-base
                        flex items-center justify-center gap-2
                        transition-all duration-300
                        ${
                          plan.buttonStyle === 'primary'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105'
                            : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 hover:scale-105'
                        }
                      `}
                    >
                      {plan.buttonText}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-slate-500">
            Need help choosing?{' '}
            <button
              onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
              className="text-indigo-600 hover:text-indigo-700 font-medium underline"
            >
              Contact our sales team
            </button>
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes float-gentle {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.15;
          }
          50% {
            transform: translate(20px, -20px);
            opacity: 0.2;
          }
        }
        .animate-float-gentle {
          animation: float-gentle ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Pricing;

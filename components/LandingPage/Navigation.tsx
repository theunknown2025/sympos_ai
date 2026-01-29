import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoutePath } from '../../routes';
import { ViewState } from '../../types';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed navigation height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className={`text-2xl font-bold transition-colors ${
              isScrolled 
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600'
                : 'text-white'
            }`}>
              Sympose AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-slate-700 hover:text-indigo-600'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Contact
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(getRoutePath(ViewState.LOGIN))}
                className={`px-4 py-2 transition-colors font-medium flex items-center gap-2 ${
                  isScrolled 
                    ? 'text-slate-700 hover:text-indigo-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                <LogIn size={18} />
                Login
              </button>
              <button
                onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium flex items-center gap-2"
              >
                <UserPlus size={18} />
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors ${
              isScrolled 
                ? 'text-slate-700 hover:text-indigo-600'
                : 'text-white hover:text-white/80'
            }`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl">
          <div className="px-4 py-6 space-y-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Contact
            </button>
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <button
                onClick={() => navigate(getRoutePath(ViewState.LOGIN))}
                className="w-full px-4 py-2.5 text-indigo-600 border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                Login
              </button>
              <button
                onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

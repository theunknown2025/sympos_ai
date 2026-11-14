import React from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import LandingEventsSection from './LandingEventsSection';
import Features from './Features';
import About from './About';
import Services from './Services';
import Pricing from './Pricing';
import ParticipantFeatures from './ParticipantFeatures';
import LandingOpportunitiesSection from './LandingOpportunitiesSection';
import Testimonials from './Testimonials';
import FAQ from './FAQ';
import Contact from './Contact';
import CTA from './CTA';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white overflow-y-auto scroll-smooth">
      <Navigation />
      <Hero />
      <LandingEventsSection />
      <Features />
      <About />
      <Services />
      <Pricing />
      <ParticipantFeatures />
      <LandingOpportunitiesSection />
      <Testimonials />
      <FAQ />
      <Contact />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;

import React, { useState } from 'react';
import { TeamMember } from '../../../types';
import { User, Phone, Mail, Linkedin, Twitter, Globe, Facebook, Instagram, Github, Youtube } from 'lucide-react';
import { isArabic } from '../../../utils/languageDetection';

interface TeamSectionProps {
  members: TeamMember[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const TeamSection: React.FC<TeamSectionProps> = ({ members, title = "Meet Our Team", titleAlignment = 'center' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  const itemsPerView = 3; // Number of team members to show at once
  const totalSlides = Math.ceil(members.length / itemsPerView);

  const goToSlide = (index: number) => {
    setCurrentIndex(index * itemsPerView);
  };

  const nextSlide = () => {
    const maxIndex = Math.max(0, members.length - itemsPerView);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + itemsPerView));
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, members.length - itemsPerView);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - itemsPerView));
  };

  const currentSlideIndex = Math.floor(currentIndex / itemsPerView);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin size={16} />;
      case 'twitter': return <Twitter size={16} />;
      case 'facebook': return <Facebook size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'github': return <Github size={16} />;
      case 'youtube': return <Youtube size={16} />;
      case 'website': return <Globe size={16} />;
      default: return <Globe size={16} />;
    }
  };

  return (
    <div className="py-16 px-8 bg-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Title Section */}
        <div className={`flex flex-col ${containerAlignClass} mb-12`}>
          <h2 className={`text-3xl font-bold text-slate-800 mb-3 ${titleAlignClass} ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {title.toUpperCase()}
          </h2>
          <div className={`w-16 h-1 bg-blue-600 rounded-full ${titleAlignment === 'left' ? 'ml-0' : titleAlignment === 'right' ? 'ml-auto' : 'mx-auto'}`}></div>
        </div>
        
        {members.length > 0 ? (
          <div className="relative">
            {/* Slider Container */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
              >
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex-shrink-0 px-4"
                    style={{ width: `${100 / itemsPerView}%`, minWidth: `${100 / itemsPerView}%` }}
                    onMouseEnter={() => setHoveredMemberId(member.id)}
                    onMouseLeave={() => setHoveredMemberId(null)}
                  >
                    <div className="bg-slate-200 rounded-2xl p-6 text-center relative overflow-hidden transition-all duration-300">
                      {/* Image */}
                      <div className="w-40 h-40 mx-auto rounded-full overflow-hidden mb-4 bg-slate-300">
                        {member.imageUrl ? (
                          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-400">
                            <User size={64} />
                          </div>
                        )}
                      </div>

                      {/* Name and Function */}
                      <div className="mt-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-wide">
                          {member.name.toUpperCase()}
                        </h3>
                        <p className="text-sm text-slate-600 font-medium mb-4">
                          {member.function}
                        </p>
                      </div>

                      {/* Contact Information */}
                      <div className={`space-y-2 mb-4 transition-opacity duration-300 ${
                        hoveredMemberId === member.id ? 'opacity-0' : 'opacity-100'
                      }`}>
                        {member.phone && (
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                            <Phone size={14} className="text-slate-500" />
                            <a href={`tel:${member.phone}`} className="hover:text-slate-800 transition-colors">
                              {member.phone}
                            </a>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                            <Mail size={14} className="text-slate-500" />
                            <a href={`mailto:${member.email}`} className="hover:text-slate-800 transition-colors truncate max-w-full">
                              {member.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Social Links */}
                      {member.links.length > 0 && (
                        <div className={`flex justify-center gap-3 transition-opacity duration-300 ${
                          hoveredMemberId === member.id ? 'opacity-0' : 'opacity-100'
                        }`}>
                          {member.links.map(link => (
                            <a 
                              key={link.id} 
                              href={link.url} 
                              className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-400 hover:text-slate-800 transition-all"
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getSocialIcon(link.platform)}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Bio Overlay - Shows on hover */}
                      {member.bio && (
                        <div 
                          className={`absolute inset-0 bg-slate-800 text-white rounded-2xl p-6 flex items-center justify-center transition-all duration-300 ${
                            hoveredMemberId === member.id
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 translate-y-4 pointer-events-none'
                          }`}
                        >
                          <p className="text-sm leading-relaxed text-center">
                            {member.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {totalSlides > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentSlideIndex === index
                        ? 'bg-slate-800 w-8'
                        : 'bg-slate-400 hover:bg-slate-600'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-200">
            <User size={48} className="mb-4 opacity-20"/>
            <p className="font-medium">No team members added yet.</p>
            <p className="text-sm">Use the Team Editor to populate this list.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSection;

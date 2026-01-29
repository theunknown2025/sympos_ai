import React from 'react';
import { ContactConfig } from '../../../../types';
import { Mail, Phone, MapPin, User, Send } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';

interface ContactSectionProps {
  config: ContactConfig;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const ContactSection: React.FC<ContactSectionProps> = ({ config, title = "Contact Us", titleAlignment = 'center' }) => {
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);
  
  return (
    <div className="py-24 px-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
           <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <Mail size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <Mail size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
           <p className="text-slate-500 max-w-2xl mx-auto">
             Have questions? Reach out to our organizing team.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           {/* Left Column: Info & Map */}
           <div className="space-y-8 flex flex-col">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-6">
                 <h3 className="text-xl font-bold text-slate-900">Conference Information</h3>
                 
                 <div className="space-y-4">
                    {config.contactPerson && (
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                             <User size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contact Person</p>
                             <p className="text-slate-800 font-medium">{config.contactPerson}</p>
                          </div>
                       </div>
                    )}
                    
                    {config.email && (
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                             <Mail size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                             <a href={`mailto:${config.email}`} className="text-slate-800 font-medium hover:text-indigo-600 transition-colors">{config.email}</a>
                          </div>
                       </div>
                    )}

                    {config.phone && (
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                             <Phone size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                             <p className="text-slate-800 font-medium">{config.phone}</p>
                          </div>
                       </div>
                    )}

                    {config.address && (
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                             <MapPin size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Address</p>
                             <p className="text-slate-800 font-medium leading-relaxed">{config.address}</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {config.showMap && config.mapEmbedUrl && (
                <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  <iframe 
                    src={config.mapEmbedUrl} 
                    width="100%" 
                    height="100%" 
                    style={{border:0, minHeight: '300px'}} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Conference Location"
                  ></iframe>
                </div>
              )}
           </div>

           {/* Right Column: Form */}
           {config.showForm && (
             <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col h-full">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h3>
                <form className="space-y-5 flex-1 flex flex-col" onSubmit={(e) => e.preventDefault()}>
                   <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-700">First Name</label>
                         <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-700">Last Name</label>
                         <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white" placeholder="Doe" />
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <input type="email" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white" placeholder="john@example.com" />
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Subject</label>
                      <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white" placeholder="Message Subject" />
                   </div>

                   <div className="space-y-2 flex-1">
                      <label className="text-sm font-medium text-slate-700">Message</label>
                      <textarea className="w-full h-full min-h-[120px] px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none bg-white" placeholder="How can we help you?"></textarea>
                   </div>

                   <button className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-4">
                      <Send size={18} />
                      Send Message
                   </button>
                </form>
             </div>
           )}

           {!config.showForm && (
              <div className="flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                 <div>
                    <Mail size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Message Form is Disabled</p>
                    <p className="text-sm">Enable it in the editor to accept inquiries.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ContactSection;

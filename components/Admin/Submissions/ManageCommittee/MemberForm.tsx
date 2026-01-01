import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight, User as UserIcon, Mail, GraduationCap, Link as LinkIcon, UserCircle, Check } from 'lucide-react';
import { ReviewCommitteeMember } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import { saveCommitteeMember, updateCommitteeMember } from '../../../../services/committeeMemberService';

interface MemberFormProps {
  member?: ReviewCommitteeMember | null;
  onClose: () => void;
  onSuccess?: () => void;
  inline?: boolean; // If true, render inline instead of as modal
}

const MemberForm: React.FC<MemberFormProps> = ({ member, onClose, onSuccess, inline = false }) => {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Personal Identity
  const [committeeMemberId, setCommitteeMemberId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  
  // Contact
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  
  // Academic & Professional Profile
  const [institution, setInstitution] = useState('');
  const [university, setUniversity] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [country, setCountry] = useState('');
  const [position, setPosition] = useState('');
  const [researchDomains, setResearchDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  
  // Identifiers
  const [orcidId, setOrcidId] = useState('');
  const [googleScholar, setGoogleScholar] = useState('');
  const [researchGate, setResearchGate] = useState('');
  const [otherLinks, setOtherLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');

  // Common languages list for autocomplete (alphabetically sorted)
  const commonLanguages = [
    'Arabic', 'Bengali', 'Chinese', 'Danish', 'Dutch', 'English', 'Finnish',
    'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian', 'Italian',
    'Japanese', 'Korean', 'Malay', 'Norwegian', 'Polish', 'Portuguese',
    'Russian', 'Spanish', 'Swahili', 'Swedish', 'Thai', 'Turkish', 'Urdu',
    'Vietnamese'
  ];

  // Close language suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-input-container')) {
        setShowLanguageSuggestions(false);
      }
    };

    if (showLanguageSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageSuggestions]);

  useEffect(() => {
    if (member) {
      setCommitteeMemberId(member.committeeMemberId);
      setFirstName(member.firstName);
      setLastName(member.lastName);
      setTitle(member.title || '');
      setGender(member.gender || '');
      setNationality(member.nationality || '');
      setEmail(member.email);
      setPhone(member.phone || '');
      setAddress((member as any).address || '');
      // Handle both string (old format) and array (new format) for languages
      if (member.preferredLanguage) {
        if (Array.isArray(member.preferredLanguage)) {
          setPreferredLanguages(member.preferredLanguage);
        } else {
          setPreferredLanguages([member.preferredLanguage]);
        }
      } else {
        setPreferredLanguages([]);
      }
      setInstitution(member.affiliation?.institution || '');
      setUniversity(member.affiliation?.university || '');
      setOrganization(member.affiliation?.organization || '');
      setDepartment(member.affiliation?.department || '');
      setFaculty(member.affiliation?.faculty || '');
      setCountry(member.affiliation?.country || '');
      setPosition(member.affiliation?.position || '');
      setResearchDomains(member.researchDomains || []);
      setOrcidId(member.identifiers?.orcidId || '');
      setGoogleScholar(member.identifiers?.googleScholar || '');
      setResearchGate(member.identifiers?.researchGate || '');
      setOtherLinks(member.identifiers?.otherLinks || []);
    } else {
      // Generate a default ID for new members
      setCommitteeMemberId(`CM-${Date.now()}`);
    }
  }, [member]);

  const addResearchDomain = () => {
    if (newDomain.trim() && !researchDomains.includes(newDomain.trim())) {
      setResearchDomains([...researchDomains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  const removeResearchDomain = (domain: string) => {
    setResearchDomains(researchDomains.filter(d => d !== domain));
  };

  const addOtherLink = () => {
    if (newLink.trim() && !otherLinks.includes(newLink.trim())) {
      setOtherLinks([...otherLinks, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeOtherLink = (link: string) => {
    setOtherLinks(otherLinks.filter(l => l !== link));
  };

  const filteredLanguages = languageInput
    ? commonLanguages.filter(lang =>
        lang.toLowerCase().includes(languageInput.toLowerCase()) &&
        !preferredLanguages.includes(lang)
      )
    : commonLanguages.filter(lang => !preferredLanguages.includes(lang));

  const addLanguage = (language: string) => {
    if (language.trim() && !preferredLanguages.includes(language.trim())) {
      setPreferredLanguages([...preferredLanguages, language.trim()]);
      setLanguageInput('');
      setShowLanguageSuggestions(false);
    }
  };

  const removeLanguage = (language: string) => {
    setPreferredLanguages(preferredLanguages.filter(l => l !== language));
  };

  const handleLanguageInputChange = (value: string) => {
    setLanguageInput(value);
    setShowLanguageSuggestions(true);
  };

  const handleLanguageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && languageInput.trim()) {
      e.preventDefault();
      // Check if it's an exact match or add as new language
      const exactMatch = commonLanguages.find(
        lang => lang.toLowerCase() === languageInput.trim().toLowerCase()
      );
      if (exactMatch) {
        addLanguage(exactMatch);
      } else if (languageInput.trim()) {
        // Allow adding custom languages
        addLanguage(languageInput.trim());
      }
    } else if (e.key === 'Escape') {
      setShowLanguageSuggestions(false);
    }
  };

  // Helper function to remove undefined values from nested objects
  const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => removeUndefined(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = removeUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  const validateForm = (): boolean => {
    if (!committeeMemberId.trim()) {
      setError('Committee Member ID is required');
      return false;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to save members');
      return;
    }

    try {
      setSaving(true);
      
      const memberData: Omit<ReviewCommitteeMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        committeeMemberId: committeeMemberId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: title.trim() || undefined,
        gender: gender.trim() || undefined,
        nationality: nationality.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        preferredLanguage: preferredLanguages.length > 0 ? preferredLanguages.join(', ') : undefined,
        affiliation: {
          institution: institution.trim() || undefined,
          university: university.trim() || undefined,
          organization: organization.trim() || undefined,
          department: department.trim() || undefined,
          faculty: faculty.trim() || undefined,
          country: country.trim() || undefined,
          position: position.trim() || undefined,
        },
        researchDomains: researchDomains.length > 0 ? researchDomains : undefined,
        identifiers: {
          orcidId: orcidId.trim() || undefined,
          googleScholar: googleScholar.trim() || undefined,
          researchGate: researchGate.trim() || undefined,
          otherLinks: otherLinks.length > 0 ? otherLinks : undefined,
        },
      };

      // Remove undefined values before saving to Firestore
      const cleanedMemberData = removeUndefined(memberData);

      if (member) {
        await updateCommitteeMember(member.id, cleanedMemberData);
      } else {
        await saveCommitteeMember(currentUser.id, cleanedMemberData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save member. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Identity';
      case 2: return 'Contact';
      case 3: return 'Academic & Professional Profile';
      case 4: return 'Identifiers';
      default: return '';
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return UserIcon;
      case 2: return Mail;
      case 3: return GraduationCap;
      case 4: return LinkIcon;
      default: return UserIcon;
    }
  };

  const formContent = (
    <>
      <div className={`${inline ? '' : 'sticky top-0'} bg-white border-b border-slate-200 px-6 py-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {member ? 'Edit Committee Member' : 'Add New Committee Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex w-full mt-2 gap-2">
            {[1, 2, 3, 4].map((step) => {
              const StepIcon = getStepIcon(step);
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    step === currentStep
                      ? 'bg-indigo-600 text-white'
                      : step < currentStep
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <StepIcon size={18} className={`flex-shrink-0 ${step === currentStep ? 'text-white' : step < currentStep ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium whitespace-nowrap">{getStepTitle(step)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 mb-6">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="min-h-[400px]">
          {/* Step 1: Personal Identity */}
          {currentStep === 1 && (
            <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
              1️⃣ Personal Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Committee Member ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={committeeMemberId}
                  onChange={(e) => setCommitteeMemberId(e.target.value)}
                  placeholder="CM-001"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Internal unique identifier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title
                </label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select title</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Eng.">Eng.</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('Male')}
                    className={`group relative flex flex-row items-center justify-between gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 h-[42px] ${
                      gender === 'Male'
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex-shrink-0 ${gender === 'Male' ? 'text-white' : 'text-indigo-600'}`}>
                        <UserCircle size={20} strokeWidth={gender === 'Male' ? 2.5 : 2} />
                      </div>
                      <span className={`text-sm font-semibold ${gender === 'Male' ? 'text-white' : 'text-slate-700'}`}>
                        Male
                      </span>
                    </div>
                    {gender === 'Male' && (
                      <div className="flex-shrink-0">
                        <Check size={18} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGender('Female')}
                    className={`group relative flex flex-row items-center justify-between gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 h-[42px] ${
                      gender === 'Female'
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white border-rose-500 shadow-lg shadow-pink-200 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-pink-400 hover:bg-pink-50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex-shrink-0 ${gender === 'Female' ? 'text-white' : 'text-pink-600'}`}>
                        <UserCircle size={20} strokeWidth={gender === 'Female' ? 2.5 : 2} />
                      </div>
                      <span className={`text-sm font-semibold ${gender === 'Female' ? 'text-white' : 'text-slate-700'}`}>
                        Female
                      </span>
                    </div>
                    {gender === 'Female' && (
                      <div className="flex-shrink-0">
                        <Check size={18} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g., American, French, Moroccan"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          )}

          {/* Step 2: Contact */}
          {currentStep === 2 && (
            <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
              2️⃣ Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Unique, mandatory</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, Country"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preferred Languages
                </label>
                <div className="relative language-input-container">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => handleLanguageInputChange(e.target.value)}
                    onKeyDown={handleLanguageInputKeyDown}
                    onFocus={() => setShowLanguageSuggestions(true)}
                    placeholder="Type to search languages..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {showLanguageSuggestions && filteredLanguages.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredLanguages.slice(0, 10).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => addLanguage(lang)}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {preferredLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {preferredLanguages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Step 3: Academic & Professional Profile */}
          {currentStep === 3 && (
            <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
              3️⃣ Academic & Professional Profile
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Affiliation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Institution / University / Organization
                    </label>
                    <input
                      type="text"
                      value={institution || university || organization}
                      onChange={(e) => {
                        setInstitution(e.target.value);
                        setUniversity(e.target.value);
                        setOrganization(e.target.value);
                      }}
                      placeholder="e.g., MIT, Harvard University"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Department / Faculty
                    </label>
                    <input
                      type="text"
                      value={department || faculty}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setFaculty(e.target.value);
                      }}
                      placeholder="e.g., Computer Science, Engineering"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., United States, France"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g., Professor, Researcher, PhD Candidate"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Research Domains / Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addResearchDomain();
                      }
                    }}
                    placeholder="Add research domain or keyword"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addResearchDomain}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {researchDomains.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {researchDomains.map((domain, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => removeResearchDomain(domain)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Step 4: Identifiers */}
          {currentStep === 4 && (
            <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
              4️⃣ Identifiers
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ORCID ID
                </label>
                <input
                  type="text"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google Scholar Profile
                </label>
                <input
                  type="url"
                  value={googleScholar}
                  onChange={(e) => setGoogleScholar(e.target.value)}
                  placeholder="https://scholar.google.com/..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ResearchGate Profile
                </label>
                <input
                  type="url"
                  value={researchGate}
                  onChange={(e) => setResearchGate(e.target.value)}
                  placeholder="https://www.researchgate.net/profile/..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Other Links
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOtherLink();
                    }
                  }}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addOtherLink}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={18} />
                </button>
              </div>
              {otherLinks.length > 0 && (
                <div className="space-y-2">
                  {otherLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-indigo-600 hover:underline truncate"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeOtherLink(link)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Navigation and Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={previousStep}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {member ? 'Update Member' : 'Save Member'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );

  if (inline) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-full max-h-[90vh] overflow-y-auto">
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {formContent}
      </div>
    </div>
  );
};

export default MemberForm;


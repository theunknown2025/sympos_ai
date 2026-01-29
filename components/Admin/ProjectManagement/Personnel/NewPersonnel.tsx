import React, { useState } from 'react';
import { UserPlus, Upload, Loader2, AlertCircle, CheckCircle2, User, Database } from 'lucide-react';
import { createPersonnel } from '../../../../services/personnelService';
import { useAuth } from '../../../../hooks/useAuth';
import { supabase, STORAGE_BUCKETS } from '../../../../supabase';
import SearchParticipant from '../SearchParticipant';

interface NewPersonnelProps {
  onSuccess: () => void;
}

type Mode = 'create' | 'search';

const NewPersonnel: React.FC<NewPersonnelProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<Mode>('create');
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    role: '',
    roleDescription: '',
    login: '',
    password: '',
    confirmPassword: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile || !currentUser) return undefined;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const filePath = `personnel/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.MEDIA)
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.MEDIA)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.role.trim()) {
      setError('Role is required');
      return;
    }
    if (!formData.login.trim()) {
      setError('Login is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to create personnel');
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      await createPersonnel(currentUser.id, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        email: formData.email,
        role: formData.role,
        roleDescription: formData.roleDescription || undefined,
        imageUrl,
        login: formData.login,
        password: formData.password,
      });

      setSuccess(true);
      // Reset form
      setFormData({
        fullName: '',
        phoneNumber: '',
        email: '',
        role: '',
        roleDescription: '',
        login: '',
        password: '',
        confirmPassword: '',
      });
      setImageFile(null);
      setImagePreview(null);

      // Call onSuccess after a short delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating personnel:', err);
      setError(err.message || 'Failed to create personnel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Mode Selection Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`p-6 rounded-xl border-2 transition-all ${
            mode === 'create'
              ? 'border-indigo-600 bg-indigo-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-lg ${
              mode === 'create' ? 'bg-indigo-600' : 'bg-slate-100'
            }`}>
              <User className={mode === 'create' ? 'text-white' : 'text-slate-600'} size={32} />
            </div>
            <div className="text-center">
              <h3 className={`font-semibold text-lg ${
                mode === 'create' ? 'text-indigo-900' : 'text-slate-900'
              }`}>
                Create Profile
              </h3>
              <p className={`text-sm mt-1 ${
                mode === 'create' ? 'text-indigo-700' : 'text-slate-500'
              }`}>
                Create a new personnel profile from scratch
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('search')}
          className={`p-6 rounded-xl border-2 transition-all ${
            mode === 'search'
              ? 'border-indigo-600 bg-indigo-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-lg ${
              mode === 'search' ? 'bg-indigo-600' : 'bg-slate-100'
            }`}>
              <Database className={mode === 'search' ? 'text-white' : 'text-slate-600'} size={32} />
            </div>
            <div className="text-center">
              <h3 className={`font-semibold text-lg ${
                mode === 'search' ? 'text-indigo-900' : 'text-slate-900'
              }`}>
                Find in Database
              </h3>
              <p className={`text-sm mt-1 ${
                mode === 'search' ? 'text-indigo-700' : 'text-slate-500'
              }`}>
                Search and add existing participants as personnel
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Content based on mode */}
      {mode === 'search' ? (
        <SearchParticipant onSuccess={onSuccess} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 pb-3 border-b border-slate-300">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Upload - Left Column */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Image (Optional)
              </label>
              <div className="flex flex-col items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white">
                    <Upload className="text-slate-400" size={32} />
                  </div>
                )}
                <div className="text-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                      <Upload size={16} />
                      Upload Image
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 mt-2">Max 5MB, JPG/PNG</p>
                </div>
              </div>
            </div>

            {/* Personal Details - Right Columns */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role Information Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 pb-3 border-b border-slate-300">
            Role Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="e.g., Project Manager, Assistant, Coordinator"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
              />
            </div>

            {/* Login */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Login <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                placeholder="Username or email for login"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
              />
            </div>

            {/* Role Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role Description (Optional)
              </label>
              <textarea
                name="roleDescription"
                value={formData.roleDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder="Describe the role and responsibilities..."
              />
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 pb-3 border-b border-slate-300">
            Authentication Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
                minLength={6}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
                minLength={6}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle2 size={20} />
            <span>Personnel created successfully! Redirecting to list...</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creating...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Personnel
              </>
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default NewPersonnel;


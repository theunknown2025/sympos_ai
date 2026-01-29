import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { Personnel, updatePersonnel } from '../../../../services/personnelService';
import { supabase, STORAGE_BUCKETS } from '../../../../supabase';

interface PersonnelEditModalProps {
  personnel: Personnel;
  onClose: () => void;
  onSuccess: () => void;
}

const PersonnelEditModal: React.FC<PersonnelEditModalProps> = ({ personnel, onClose, onSuccess }) => {
  // Check if password exists (personnel added manually vs from participant)
  const hasPassword = !!personnel.password;
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: personnel.fullName,
    phoneNumber: personnel.phoneNumber || '',
    email: personnel.email,
    role: personnel.role,
    roleDescription: personnel.roleDescription || '',
    login: personnel.login || '',
    password: personnel.password || '', // Password field
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(personnel.imageUrl || null);
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
    if (!imageFile) return undefined;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${personnel.userId}/${Date.now()}.${fileExt}`;
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
    if (!formData.role.trim()) {
      setError('Role is required');
      return;
    }
    
    // Only validate other fields if password exists (manually created personnel)
    if (hasPassword) {
      if (!formData.fullName.trim()) {
        setError('Full Name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!formData.login.trim()) {
        setError('Login is required');
        return;
      }
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined = personnel.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const updateData: any = {
        role: formData.role,
        roleDescription: formData.roleDescription || undefined,
      };
      
      // Only update other fields if password exists (manually created personnel)
      if (hasPassword) {
        updateData.fullName = formData.fullName;
        updateData.phoneNumber = formData.phoneNumber || undefined;
        updateData.email = formData.email;
        updateData.login = formData.login;
        if (imageUrl !== undefined) {
          updateData.imageUrl = imageUrl;
        }
        // Update password only if a new password was entered (not empty)
        if (formData.password && formData.password.trim() !== '' && formData.password !== personnel.password) {
          updateData.password = formData.password;
        }
      }
      
      await updatePersonnel(personnel.id, updateData);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error('Error updating personnel:', err);
      setError(err.message || 'Failed to update personnel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Edit Personnel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner for participants */}
          {!hasPassword && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Participant Account
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    This personnel was added from a participant. Only role and description can be edited. Other information is managed through their participant account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${hasPassword ? 'text-slate-700' : 'text-slate-400'}`}>
              Image
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(personnel.imageUrl || null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                  <Upload className="text-slate-400" size={24} />
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={!hasPassword}
                  />
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hasPassword 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer' 
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}>
                    <Upload size={16} />
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </span>
                </label>
                <p className="text-xs text-slate-500 mt-1">Max 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${hasPassword ? 'text-slate-700' : 'text-slate-400'}`}>
              Full Name {hasPassword && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={!hasPassword}
              className={`w-full px-4 py-2 border rounded-lg ${
                hasPassword
                  ? 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
              required={hasPassword}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${hasPassword ? 'text-slate-700' : 'text-slate-400'}`}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              disabled={!hasPassword}
              className={`w-full px-4 py-2 border rounded-lg ${
                hasPassword
                  ? 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${hasPassword ? 'text-slate-700' : 'text-slate-400'}`}>
              Email {hasPassword && <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!hasPassword}
              className={`w-full px-4 py-2 border rounded-lg ${
                hasPassword
                  ? 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
              required={hasPassword}
            />
          </div>

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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Role Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role Description
            </label>
            <textarea
              name="roleDescription"
              value={formData.roleDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Login */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${hasPassword ? 'text-slate-700' : 'text-slate-400'}`}>
              Login {hasPassword && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleInputChange}
              disabled={!hasPassword}
              className={`w-full px-4 py-2 border rounded-lg ${
                hasPassword
                  ? 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
              required={hasPassword}
            />
          </div>

          {/* Password - Only show if password exists */}
          {hasPassword && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave empty to keep current password"
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter new password to change, or leave empty to keep current password
              </p>
            </div>
          )}

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
              <span>Personnel updated successfully!</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Updating...
                </>
              ) : (
                'Update Personnel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonnelEditModal;


import React, { useState, useRef } from 'react';
import { ImageGroup, Image } from '../../../../types';
import { Plus, Trash2, Image as ImageIcon, ChevronUp, ChevronDown, Upload, X, CheckCircle2 } from 'lucide-react';
import { uploadImageToStorage } from '../../../../services/storageService';
import { useAuth } from '../../../../hooks/useAuth';
import { STORAGE_BUCKETS } from '../../../../supabase';

interface ImagesEditorProps {
  imageGroups: ImageGroup[];
  onChange: (groups: ImageGroup[]) => void;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  preview?: string;
  imageId?: string;
}

const ImagesEditor: React.FC<ImagesEditorProps> = ({ imageGroups, onChange }) => {
  const { currentUser } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress[]>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and resize image before upload
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.85): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addGroup = () => {
    const newGroup: ImageGroup = {
      id: Date.now().toString(),
      name: 'New Image Group',
      images: [],
      format: 'catalogue1',
      showNavigation: true,
      mainWidth: 480,
      mainHeight: 360,
    };
    onChange([...imageGroups, newGroup]);
    setExpandedId(newGroup.id);
  };

  const removeGroup = (id: string) => {
    onChange(imageGroups.filter(g => g.id !== id));
  };

  const updateGroup = (id: string, field: keyof ImageGroup, value: any) => {
    onChange(imageGroups.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleImageUpload = async (groupId: string, files: FileList | null) => {
    if (!files || !currentUser) return;

    const group = imageGroups.find(g => g.id === groupId);
    if (!group) return;

    setUploadingImageId(groupId);

    const fileArray = Array.from(files);
    const progressMap = new Map<string, UploadProgress[]>();
    const initialProgress: UploadProgress[] = fileArray.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending',
      preview: URL.createObjectURL(file),
    }));
    progressMap.set(groupId, initialProgress);
    setUploadProgress(new Map(progressMap));

    try {
      // Process images in batches of 5 for better performance
      const batchSize = 5;
      let uploadedCount = 0;

      for (let i = 0; i < fileArray.length; i += batchSize) {
        const batch = fileArray.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex;
          const fileProgress = initialProgress[globalIndex];

          try {
            // Update status to uploading
            const updateProgress = (progress: number, status: UploadProgress['status']) => {
              const current = progressMap.get(groupId) || [];
              current[globalIndex] = { ...fileProgress, progress, status };
              progressMap.set(groupId, [...current]);
              setUploadProgress(new Map(progressMap));
            };

            updateProgress(10, 'uploading');

            // Compress image (only if larger than 500KB)
            let fileToUpload = file;
            if (file.size > 500 * 1024) {
              updateProgress(30, 'uploading');
              fileToUpload = await compressImage(file);
            }

            updateProgress(50, 'uploading');

            // Upload to storage
            const url = await uploadImageToStorage(
              currentUser.id,
              fileToUpload,
              'landing-page-images'
            );

            updateProgress(90, 'uploading');

            const newImage: Image = {
              id: Date.now().toString() + Math.random().toString(36).substring(2),
              url,
              alt: file.name,
            };

            updateProgress(100, 'completed');
            
            // Update group incrementally for better UX (images appear as they upload)
            uploadedCount++;
            const currentGroup = imageGroups.find(g => g.id === groupId);
            if (currentGroup) {
              // Only add if not already in the list (prevent duplicates)
              if (!currentGroup.images.some(img => img.url === newImage.url)) {
                updateGroup(groupId, 'images', [...currentGroup.images, newImage]);
              }
            }

            return newImage;
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            const current = progressMap.get(groupId) || [];
            current[globalIndex] = { ...fileProgress, progress: 0, status: 'error' };
            progressMap.set(groupId, [...current]);
            setUploadProgress(new Map(progressMap));
            return null;
          }
        });

        await Promise.all(batchPromises);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      // Don't show alert for individual failures, just log them
    } finally {
      // Clear progress after a short delay
      setTimeout(() => {
        const current = progressMap.get(groupId);
        if (current) {
          progressMap.delete(groupId);
          setUploadProgress(new Map(progressMap));
        }
        setUploadingImageId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    }
  };

  const removeImage = (groupId: string, imageId: string) => {
    const group = imageGroups.find(g => g.id === groupId);
    if (group) {
      updateGroup(groupId, 'images', group.images.filter(img => img.id !== imageId));
    }
  };

  const formatOptions: { value: ImageGroup['format']; label: string }[] = [
    { value: 'catalogue1', label: 'Catalogue 1' },
    { value: 'catalogue2', label: 'Catalogue 2' },
    { value: 'catalogue3', label: 'Catalogue 3' },
    { value: 'catalogue4', label: 'Catalogue 4' },
    { value: 'slider-rtl', label: 'Slider RTL' },
    { value: 'slider-ltr', label: 'Slider LTR' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-slate-500">{imageGroups.length} Groups</span>
        <button
          onClick={addGroup}
          className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
        >
          <Plus size={12} /> Add Group
        </button>
      </div>

      <div className="space-y-4">
        {imageGroups.map((group) => (
          <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                  <ImageIcon size={14} />
                </div>
                <h5 className="text-sm font-semibold text-slate-800">{group.name}</h5>
                <span className="text-xs text-slate-400">({group.images.length} images)</span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {formatOptions.find(opt => opt.value === group.format)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGroup(group.id);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
                {expandedId === group.id ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>
            </div>

            {expandedId === group.id && (
              <div className="p-4 border-t border-slate-100 space-y-4">
                {/* Group Name */}
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, 'name', e.target.value)}
                  placeholder="Group Name"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                />

                {/* Format Selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    Format
                  </label>
                  <select
                    value={group.format}
                    onChange={(e) =>
                      updateGroup(group.id, 'format', e.target.value as ImageGroup['format'])
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                  >
                    {formatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Image Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      Main Width (px)
                    </label>
                    <input
                      type="number"
                      min={200}
                      max={1600}
                      value={group.mainWidth ?? 480}
                      onChange={(e) =>
                        updateGroup(
                          group.id,
                          'mainWidth',
                          Number.isNaN(parseInt(e.target.value, 10))
                            ? undefined
                            : parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      Main Height (px)
                    </label>
                    <input
                      type="number"
                      min={200}
                      max={1600}
                      value={group.mainHeight ?? 360}
                      onChange={(e) =>
                        updateGroup(
                          group.id,
                          'mainHeight',
                          Number.isNaN(parseInt(e.target.value, 10))
                            ? undefined
                            : parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Show Navigation Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Show Navigation Buttons
                  </label>
                  <button
                    type="button"
                    onClick={() => updateGroup(group.id, 'showNavigation', !group.showNavigation)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                      group.showNavigation ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        group.showNavigation ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    Images ({group.images.length})
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(group.id, e.target.files)}
                    className="hidden"
                    id={`image-upload-${group.id}`}
                    disabled={uploadingImageId === group.id}
                  />
                  <label
                    htmlFor={`image-upload-${group.id}`}
                    className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors ${
                      uploadingImageId === group.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImageId === group.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                        <span className="text-xs text-slate-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-indigo-600" />
                        <span className="text-xs text-indigo-600 font-medium">
                          Upload Images (Multiple)
                        </span>
                      </>
                    )}
                  </label>

                  {/* Upload Progress */}
                  {uploadProgress.has(group.id) && uploadProgress.get(group.id)!.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadProgress.get(group.id)!.map((progress) => (
                        <div key={progress.fileId} className="bg-slate-50 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            {progress.preview && (
                              <img
                                src={progress.preview}
                                alt=""
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <span className="text-xs text-slate-700 flex-1 truncate">
                              {progress.fileName}
                            </span>
                            {progress.status === 'completed' && (
                              <CheckCircle2 size={14} className="text-green-600" />
                            )}
                            {progress.status === 'error' && (
                              <X size={14} className="text-red-600" />
                            )}
                            {progress.status === 'uploading' && (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></div>
                            )}
                          </div>
                          {progress.status === 'uploading' && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Grid */}
                {group.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {group.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200">
                          <img
                            src={image.url}
                            alt={image.alt || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(group.id, image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagesEditor;


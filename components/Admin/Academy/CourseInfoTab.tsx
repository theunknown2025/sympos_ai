import React from 'react';
import { Edit2, Image, Upload, X, Loader2 } from 'lucide-react';
import type {
  AcademyCourseStatus,
  AcademyCourseVisibility,
  AcademyDifficulty,
} from '../../../types';

export type CourseFormState = {
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  thumbnailUrl: string;
  bannerImageUrl: string;
  difficulty: AcademyDifficulty | '';
  estimatedDurationMinutes: string;
  tagsInput: string;
  visibility: AcademyCourseVisibility;
  status: AcademyCourseStatus;
};

export interface CourseInfoTabProps {
  courseForm: CourseFormState;
  onChange: (
    field: keyof CourseFormState,
    value: string | AcademyCourseStatus | AcademyCourseVisibility | AcademyDifficulty | ''
  ) => void;
  onUploadBanner?: (file: File) => Promise<void>;
  bannerUploading?: boolean;
}

const CourseInfoTab: React.FC<CourseInfoTabProps> = ({
  courseForm,
  onChange,
  onUploadBanner,
  bannerUploading = false,
}) => {
  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadBanner) return;
    await onUploadBanner(file);
    event.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Edit2 size={16} />
        Course Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={courseForm.title}
            onChange={e => onChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Academic Writing Fundamentals"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Slug *
          </label>
          <input
            type="text"
            value={courseForm.slug}
            onChange={e => onChange('slug', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="academic-writing-fundamentals"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Difficulty
          </label>
          <select
            value={courseForm.difficulty}
            onChange={e =>
              onChange('difficulty', e.target.value as AcademyDifficulty | '')
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Not specified</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            min={0}
            value={courseForm.estimatedDurationMinutes}
            onChange={e => onChange('estimatedDurationMinutes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Visibility
          </label>
          <select
            value={courseForm.visibility}
            onChange={e =>
              onChange('visibility', e.target.value as AcademyCourseVisibility)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="organization">Organization only</option>
            <option value="public">Public</option>
            <option value="event">Linked to event</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Status
          </label>
          <select
            value={courseForm.status}
            onChange={e =>
              onChange('status', e.target.value as AcademyCourseStatus)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Short Description
        </label>
        <textarea
          value={courseForm.shortDescription}
          onChange={e => onChange('shortDescription', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="A brief summary of who this course is for and what it covers."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Long Description
        </label>
        <textarea
          value={courseForm.longDescription}
          onChange={e => onChange('longDescription', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Detailed description, learning objectives, prerequisites, and outcomes."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
          <Image size={14} className="text-slate-500" />
          Banner Image
        </label>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload size={14} />
              {bannerUploading ? 'Uploading...' : 'Upload from laptop'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              disabled={bannerUploading || !onUploadBanner}
              className="hidden"
            />
          </label>
          {bannerUploading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading banner image...
            </div>
          )}
          {courseForm.bannerImageUrl && (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={courseForm.bannerImageUrl}
                alt="Course banner"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => onChange('bannerImageUrl', '')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-600 hover:text-red-600 shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Thumbnail URL
          </label>
          <input
            type="text"
            value={courseForm.thumbnailUrl}
            onChange={e => onChange('thumbnailUrl', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={courseForm.tagsInput}
            onChange={e => onChange('tagsInput', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. research skills, writing, publishing"
          />
        </div>
      </div>
    </div>
  );
};

export default CourseInfoTab;


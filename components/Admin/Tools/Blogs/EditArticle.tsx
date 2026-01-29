import React, { useState, useEffect } from 'react';
import { Save, X, Loader2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  updateBlogArticle,
  getBlogArticle,
  uploadBlogArticleImage,
} from '../../../../services/blogArticleService';
import BlogEditor from './BlogEditor';

interface EditArticleProps {
  articleId: string;
  onSave: () => void;
  onCancel: () => void;
}

const EditArticle: React.FC<EditArticleProps> = ({ articleId, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setIsLoading(true);
      const article = await getBlogArticle(articleId);
      if (article) {
        setTitle(article.title);
        setExcerpt(article.excerpt || '');
        setContent(article.content);
        setFeaturedImage(article.featuredImage || '');
        setTags(article.tags || []);
        setAuthorName(article.authorName || '');
        setMetaDescription(article.metaDescription || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !currentUser?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');
      const imageUrl = await uploadBlogArticleImage(currentUser.id, file);
      setFeaturedImage(imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Article title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Article content is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      const articleData: Partial<{
        title: string;
        excerpt?: string;
        content: string;
        featuredImage?: string;
        tags?: string[];
        authorName?: string;
        metaDescription?: string;
      }> = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content: content.trim(),
        featuredImage: featuredImage || undefined,
        // Don't change status when editing - use publish/unpublish action instead
        tags: tags.length > 0 ? tags : undefined,
        authorName: authorName.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      };
      
      await updateBlogArticle(articleId, articleData);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to update article');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Edit Article</h2>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Featured Image
            </label>
            <div className="space-y-3">
              {featuredImage && (
                <div className="relative">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-64 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage('')}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  disabled={uploadingImage}
                  className="hidden"
                  accept="image/*"
                  id="featured-image-upload-edit"
                />
                <label
                  htmlFor="featured-image-upload-edit"
                  className="flex flex-col items-center gap-3 cursor-pointer"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="animate-spin text-indigo-600" size={32} />
                      <span className="text-sm text-slate-600">Uploading image...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-full">
                        <ImageIcon size={32} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {featuredImage ? 'Change Featured Image' : 'Upload Featured Image'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Drag and drop an image here, or click to browse
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
          <BlogEditor content={content} onChange={setContent} />
        </div>

        {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Author Name */}
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-slate-700 mb-2">
              Author Name
            </label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Meta Description */}
          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-slate-700 mb-2">
              Meta Description (SEO)
            </label>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Article
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditArticle;

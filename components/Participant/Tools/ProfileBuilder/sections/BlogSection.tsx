import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getEditorTranslations } from '../editorTranslations';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  url?: string;
}

interface BlogSectionProps {
  data: {
    blogPosts: BlogPost[];
  };
  onChange: (data: { blogPosts: BlogPost[] }) => void;
  language?: 'en' | 'fr' | 'ar';
  direction?: 'ltr' | 'rtl';
}

const BlogSection: React.FC<BlogSectionProps> = ({ data, onChange, language = 'en', direction = 'ltr' }) => {
  const t = getEditorTranslations(language);

  const handleAddBlogPost = () => {
    onChange({
      blogPosts: [
        ...data.blogPosts,
        {
          id: uuidv4(),
          title: '',
          content: '',
          date: '',
          url: '',
        },
      ],
    });
  };

  const handleRemoveBlogPost = (id: string) => {
    onChange({
      blogPosts: data.blogPosts.filter((post) => post.id !== id),
    });
  };

  const handleUpdateBlogPost = (id: string, field: keyof BlogPost, value: string) => {
    onChange({
      blogPosts: data.blogPosts.map((post) =>
        post.id === id ? { ...post, [field]: value } : post
      ),
    });
  };

  return (
    <div className="space-y-4" dir={direction}>
      {data.blogPosts.map((blogPost, index) => (
        <div key={blogPost.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">{t.blogPost} {index + 1}</h4>
            {data.blogPosts.length > 1 && (
              <button
                onClick={() => handleRemoveBlogPost(blogPost.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t.remove}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.postTitle}</label>
              <input
                type="text"
                value={blogPost.title || ''}
                onChange={(e) => handleUpdateBlogPost(blogPost.id, 'title', e.target.value)}
                placeholder={direction === 'rtl' ? 'عنوان المقال' : 'Blog Post Title'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.content}</label>
              <textarea
                value={blogPost.content || ''}
                onChange={(e) => handleUpdateBlogPost(blogPost.id, 'content', e.target.value)}
                placeholder={direction === 'rtl' ? 'محتوى المقال أو مقتطف...' : 'Blog post content or excerpt...'}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                dir={direction}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.date}</label>
                <input
                  type="text"
                  value={blogPost.date || ''}
                  onChange={(e) => handleUpdateBlogPost(blogPost.id, 'date', e.target.value)}
                  placeholder={direction === 'rtl' ? 'شهر/سنة' : 'MM/YYYY'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  dir={direction}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.postUrl} ({t.optional})</label>
                <input
                  type="url"
                  value={blogPost.url || ''}
                  onChange={(e) => handleUpdateBlogPost(blogPost.id, 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddBlogPost}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        {t.add} {t.blogPost}
      </button>
    </div>
  );
};

export default BlogSection;

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight, Calendar, User, Tag } from 'lucide-react';
import { getUserBlogArticles } from '../../../services/blogArticleService';
import { BlogArticle } from '../../../types';

interface BlogArticlesDisplayerProps {
  userId: string;
}

const BlogArticlesDisplayer: React.FC<BlogArticlesDisplayerProps> = ({ userId }) => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUserBlogArticles(userId);
        // Filter to show only published articles
        const publishedArticles = data.filter(article => article.status === 'published');
        // Sort by published date (most recent first)
        publishedArticles.sort((a, b) => {
          const dateA = a.publishedAt || a.createdAt;
          const dateB = b.publishedAt || b.createdAt;
          return dateB.getTime() - dateA.getTime();
        });
        setArticles(publishedArticles);
        setCurrentIndex(0); // Start with the latest article
      } catch (err: any) {
        console.error('Error loading blog articles:', err);
        setError(err.message || 'Failed to load blog articles');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadArticles();
    } else {
      setLoading(false);
      setArticles([]);
    }
  }, [userId]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : articles.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < articles.length - 1 ? prev + 1 : 0));
  };

  const goToArticle = (index: number) => {
    setCurrentIndex(index);
  };

  const formatDate = (date?: Date): string => {
    if (!date) return '';
    try {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="text-red-600" size={20} />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="mx-auto mb-2 text-slate-400" size={32} />
        <p>No published articles found</p>
      </div>
    );
  }

  const currentArticle = articles[currentIndex];

  return (
    <div className="relative">
      {/* Article Card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Featured Image */}
        {currentArticle.featuredImage && (
          <div className="h-48 bg-gradient-to-r from-indigo-500 to-violet-500 relative">
            <img
              src={currentArticle.featuredImage}
              alt={currentArticle.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        )}

        <div className="p-5">
          {/* Article Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
            {currentArticle.title}
          </h3>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
            {currentArticle.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="text-slate-400" size={14} />
                <span>{formatDate(currentArticle.publishedAt)}</span>
              </div>
            )}
            {currentArticle.authorName && (
              <div className="flex items-center gap-1">
                <User className="text-slate-400" size={14} />
                <span>{currentArticle.authorName}</span>
              </div>
            )}
          </div>

          {/* Excerpt */}
          {currentArticle.excerpt && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-3">
              {currentArticle.excerpt}
            </p>
          )}

          {/* Tags */}
          {currentArticle.tags && currentArticle.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {currentArticle.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
              {currentArticle.tags.length > 3 && (
                <span className="px-2 py-1 text-slate-500 text-xs">
                  +{currentArticle.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      {articles.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={goToPrevious}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous article"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Article Indicators/Dots */}
            <div className="flex items-center gap-2">
              {articles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToArticle(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-indigo-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to article ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next article"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Article Counter */}
          <div className="text-center mt-2 text-xs text-slate-500">
            {currentIndex + 1} of {articles.length}
          </div>
        </>
      )}
    </div>
  );
};

export default BlogArticlesDisplayer;

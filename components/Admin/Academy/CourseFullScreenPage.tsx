import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getCourseWithContent } from '../../../services/academyCourseService';
import type { AcademyCourse } from '../../../types';
import CourseFullScreenDisplay from './CourseFullScreenDisplay';

const CourseFullScreenPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        setError('Course not found.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const detail = await getCourseWithContent(courseId);
        if (!detail) {
          setError('Course not found.');
        } else {
          setCourse(detail);
        }
      } catch (e: any) {
        console.error('Error loading course preview:', e);
        setError(e.message || 'Failed to load course preview');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
            Course Preview
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Full Screen View
          </h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && course && (
        <CourseFullScreenDisplay course={course} />
      )}
    </div>
  );
};

export default CourseFullScreenPage;

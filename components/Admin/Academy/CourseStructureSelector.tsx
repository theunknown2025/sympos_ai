import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, GraduationCap } from 'lucide-react';
import type { AcademyCourse } from '../../../types';

export interface CourseStructureSelectorProps {
  courses: AcademyCourse[];
  selectedCourseId: string | null;
  onSelect: (courseId: string | null) => void;
  placeholder?: string;
}

const CourseStructureSelector: React.FC<CourseStructureSelectorProps> = ({
  courses,
  selectedCourseId,
  onSelect,
  placeholder = 'Search and select a course...',
}) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const filtered = search.trim()
    ? courses.filter(
        c =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
      )
    : courses;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors"
      >
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={open ? search : selectedCourse?.title || ''}
          onChange={e => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
        />
        <ChevronDown
          size={18}
          className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              {search ? 'No courses match your search.' : 'No courses yet. Create one first.'}
            </div>
          ) : (
            filtered.map(course => (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  onSelect(course.id);
                  setSearch('');
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                  selectedCourseId === course.id ? 'bg-indigo-50' : ''
                }`}
              >
                <GraduationCap
                  size={18}
                  className={selectedCourseId === course.id ? 'text-indigo-600' : 'text-slate-400'}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                  {course.slug && (
                    <p className="text-xs text-slate-500 truncate">{course.slug}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CourseStructureSelector;

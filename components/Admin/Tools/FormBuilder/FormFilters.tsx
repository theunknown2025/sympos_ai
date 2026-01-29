import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X, Calendar } from 'lucide-react';

export interface FormFilters {
  name: string;
  type: 'all' | 'registration' | 'submission' | 'evaluation' | 'other';
  dateType: 'created' | 'updated';
  dateFrom: string;
  dateTo: string;
  minFields: string;
  maxFields: string;
}

interface FormFiltersProps {
  filters: FormFilters;
  onFiltersChange: (filters: FormFilters) => void;
  onReset: () => void;
}

const FormFiltersComponent: React.FC<FormFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof FormFilters, value: string | 'created' | 'updated') => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = 
    filters.name !== '' ||
    filters.type !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.minFields !== '' ||
    filters.maxFields !== '';

  const hasAdvancedFilters = 
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.minFields !== '' ||
    filters.maxFields !== '';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
      {/* Main Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Name Search */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search by Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search forms by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {filters.name && (
              <button
                onClick={() => handleFilterChange('name', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Type Dropdown */}
        <div className="md:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value as FormFilters['type'])}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="registration">Registration</option>
            <option value="submission">Submission</option>
            <option value="evaluation">Evaluation</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Filter size={16} />
          <span>Advanced Filters</span>
          {showAdvanced ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Date Type Toggle Switch */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date Type
              </label>
              <div className="relative flex items-center bg-slate-200 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => handleFilterChange('dateType', 'created')}
                  className={`relative z-10 flex-1 px-4 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${
                    filters.dateType === 'created'
                      ? 'text-indigo-600'
                      : 'text-slate-500'
                  }`}
                >
                  Created
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('dateType', 'updated')}
                  className={`relative z-10 flex-1 px-4 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${
                    filters.dateType === 'updated'
                      ? 'text-indigo-600'
                      : 'text-slate-500'
                  }`}
                >
                  Updated
                </button>
                <div
                  className={`absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
                    filters.dateType === 'created'
                      ? 'left-1 right-1/2'
                      : 'left-1/2 right-1'
                  }`}
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={14} className="inline mr-1" />
                {filters.dateType === 'created' ? 'Created' : 'Updated'} From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={14} className="inline mr-1" />
                {filters.dateType === 'created' ? 'Created' : 'Updated'} To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Min Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Min Fields
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.minFields}
                onChange={(e) => handleFilterChange('minFields', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Max Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Fields
              </label>
              <input
                type="number"
                min="0"
                placeholder="Any"
                value={filters.maxFields}
                onChange={(e) => handleFilterChange('maxFields', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {hasAdvancedFilters && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Filter size={14} />
              <span>Advanced filters are active</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormFiltersComponent;


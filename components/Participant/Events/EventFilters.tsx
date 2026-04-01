import React, { useState } from 'react';
import { Search, Filter, X, Calendar, User, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Event } from '../../../types';

interface EventFiltersProps {
  events: Event[];
  onFilterChange: (filteredEvents: Event[]) => void;
}

interface FilterState {
  searchQuery: string;
  startDate: string;
  endDate: string;
  organizerIds: string[];
  fields: string[];
  showAdvanced: boolean;
}

const EventFilters: React.FC<EventFiltersProps> = ({ events, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    startDate: '',
    endDate: '',
    organizerIds: [],
    fields: [],
    showAdvanced: false,
  });

  // Get unique organizers and fields from events
  // For organizers, we'll use userId for now (can be enhanced to load organizer names)
  const uniqueOrganizers = Array.from(new Set(events.map(e => e.userId)));
  const uniqueFields = Array.from(
    new Set(events.flatMap(e => e.fields || []))
  ).filter(Boolean);

  const applyFilters = (newFilters: FilterState) => {
    let filtered = [...events];

    // Simple search: event name
    if (newFilters.searchQuery.trim()) {
      const query = newFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query)
      );
    }

    // Advanced filters
    if (newFilters.showAdvanced) {
      // Date range filter
      if (newFilters.startDate || newFilters.endDate) {
        filtered = filtered.filter(event => {
          if (!event.dates || event.dates.length === 0) return false;
          
          const eventStart = new Date(event.dates[0].startDate);
          const eventEnd = event.dates[0].endDate 
            ? new Date(event.dates[0].endDate)
            : eventStart;

          if (newFilters.startDate) {
            const filterStart = new Date(newFilters.startDate);
            if (eventEnd < filterStart) return false;
          }

          if (newFilters.endDate) {
            const filterEnd = new Date(newFilters.endDate);
            if (eventStart > filterEnd) return false;
          }

          return true;
        });
      }

      // Organizer filter
      if (newFilters.organizerIds.length > 0) {
        filtered = filtered.filter(event =>
          newFilters.organizerIds.includes(event.userId)
        );
      }

      // Fields filter
      if (newFilters.fields.length > 0) {
        filtered = filtered.filter(event => {
          const eventFields = event.fields || [];
          return newFilters.fields.some(field => eventFields.includes(field));
        });
      }
    }

    onFilterChange(filtered);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleToggleField = (field: string) => {
    const newFields = filters.fields.includes(field)
      ? filters.fields.filter(f => f !== field)
      : [...filters.fields, field];
    handleFilterChange('fields', newFields);
  };

  const handleToggleOrganizer = (organizerId: string) => {
    const newOrganizers = filters.organizerIds.includes(organizerId)
      ? filters.organizerIds.filter(id => id !== organizerId)
      : [...filters.organizerIds, organizerId];
    handleFilterChange('organizerIds', newOrganizers);
  };

  const resetFilters = () => {
    const resetFilters: FilterState = {
      searchQuery: '',
      startDate: '',
      endDate: '',
      organizerIds: [],
      fields: [],
      showAdvanced: filters.showAdvanced,
    };
    setFilters(resetFilters);
    applyFilters(resetFilters);
  };

  const hasActiveFilters = filters.searchQuery || 
    filters.startDate || 
    filters.endDate || 
    filters.organizerIds.length > 0 || 
    filters.fields.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      {/* Simple Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by event name..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => handleFilterChange('showAdvanced', !filters.showAdvanced)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Filter size={16} />
          <span>Advanced Filters</span>
          {filters.showAdvanced ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-700"
          >
            <X size={16} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {filters.showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Event Dates
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Organizers */}
          {uniqueOrganizers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} />
                Organizers
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {uniqueOrganizers.map(organizerId => (
                  <label key={organizerId} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.organizerIds.includes(organizerId)}
                      onChange={() => handleToggleOrganizer(organizerId)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Organizer {organizerId.substring(0, 8)}...
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          {uniqueFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Tag size={16} />
                Fields
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {uniqueFields.map(field => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.fields.includes(field)}
                      onChange={() => handleToggleField(field)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{field}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFilters;

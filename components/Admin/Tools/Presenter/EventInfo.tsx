import React, { useState, useEffect } from 'react';
import { Save, Trash2, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { PresenterEvent } from '../../../../types';

interface EventInfoProps {
  event: PresenterEvent | null;
  onSave: (eventId: string, data: Partial<PresenterEvent>) => void | ((data: Omit<PresenterEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void);
  onDelete: (eventId: string) => void;
}

const EventInfo: React.FC<EventInfoProps> = ({ event, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (event) {
      setName(event.name);
      setPlace(event.place || '');
      setDate(event.date ? new Date(event.date).toISOString().split('T')[0] : '');
      setLink(event.link || '');
    } else {
      setName('');
      setPlace('');
      setDate('');
      setLink('');
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const eventData: any = {
      name: name.trim(),
      place: place.trim() || undefined,
      date: date ? new Date(date) : undefined,
      link: link.trim() || undefined,
    };

    if (event) {
      (onSave as (eventId: string, data: Partial<PresenterEvent>) => void)(event.id, eventData);
    } else {
      (onSave as (data: Omit<PresenterEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void)(eventData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <MapPin size={16} className="inline mr-1" />
          Place
        </label>
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Event location"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Calendar size={16} className="inline mr-1" />
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <LinkIcon size={16} className="inline mr-1" />
          Link
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {event && (
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="px-4 py-2 text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete Event
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          {event ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventInfo;

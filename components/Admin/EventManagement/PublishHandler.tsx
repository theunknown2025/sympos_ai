import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { updateEventPublishStatus } from '../../../services/eventService';
import { PublishStatus } from '../../../types';

interface PublishHandlerProps {
  eventId: string;
  currentStatus: PublishStatus;
  onStatusChange: (newStatus: PublishStatus) => void;
  onClose: () => void;
}

const PublishHandler: React.FC<PublishHandlerProps> = ({
  eventId,
  currentStatus,
  onStatusChange,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (newStatus: PublishStatus) => {
    try {
      setLoading(true);
      setError('');
      await updateEventPublishStatus(eventId, newStatus);
      onStatusChange(newStatus);
      onClose();
    } catch (err: any) {
      console.error('Error updating publish status:', err);
      setError(err.message || 'Failed to update publish status');
    } finally {
      setLoading(false);
    }
  };

  // If event is Draft, show publish button
  if (currentStatus === 'Draft') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Publish Event</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to publish this event? Published events will be visible to participants.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange('Published')}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If event is Published, show options to Unpublish or Close
  if (currentStatus === 'Published') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Change Publication Status</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <p className="text-slate-600 mb-6">
              Choose an action for this published event:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleStatusChange('Draft')}
                disabled={loading}
                className="w-full px-4 py-3 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="font-medium">Unpublish</span>
                    <span className="text-xs text-slate-500">(Change to Draft)</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleStatusChange('Closed')}
                disabled={loading}
                className="w-full px-4 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="font-medium">Close Event</span>
                    <span className="text-xs text-white/80">(Mark as Closed)</span>
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={onClose}
              disabled={loading}
              className="mt-4 w-full px-4 py-2 text-slate-600 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If event is Closed, show option to reopen as Published or Draft
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Reopen Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <p className="text-slate-600 mb-6">
            This event is currently closed. Choose how you want to reopen it:
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleStatusChange('Published')}
              disabled={loading}
              className="w-full px-4 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <span className="font-medium">Reopen as Published</span>
                  <span className="text-xs text-white/80">(Visible to participants)</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => handleStatusChange('Draft')}
              disabled={loading}
              className="w-full px-4 py-3 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <span className="font-medium">Reopen as Draft</span>
                  <span className="text-xs text-slate-500">(Not visible to participants)</span>
                </>
              )}
            </button>
          </div>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="mt-4 w-full px-4 py-2 text-slate-600 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishHandler;

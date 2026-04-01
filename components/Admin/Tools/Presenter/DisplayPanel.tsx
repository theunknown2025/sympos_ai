import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { getPresenterPanel } from '../../../../services/presenterService';
import { PresenterPanel, PresenterEvent } from '../../../../types';

interface DisplayPanelProps {
  panelId: string;
  event: PresenterEvent;
  onClose: () => void;
  templateId?: string;
}

const DisplayPanel: React.FC<DisplayPanelProps> = ({ panelId, event, onClose }) => {
  const [panel, setPanel] = useState<PresenterPanel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPanel();
  }, [panelId]);

  const loadPanel = async () => {
    try {
      setLoading(true);
      const panelData = await getPresenterPanel(panelId);
      setPanel(panelData);
    } catch (err) {
      console.error('Failed to load panel:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !panel) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden z-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Dots */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-pulse"
            style={{
              width: Math.random() * 100 + 20 + 'px',
              height: Math.random() * 100 + 20 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
        {/* Floating Lines */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/5"
            style={{
              width: Math.random() * 200 + 100 + 'px',
              height: '2px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `float ${Math.random() * 5 + 5}s infinite ease-in-out`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <div className="max-w-6xl w-full text-center text-white">
          {/* Event Information */}
          <div className="mb-12 space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{event.name}</h1>
            <div className="flex items-center justify-center gap-6 text-lg md:text-xl">
              {event.date && (
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {event.place && (
                <div className="flex items-center gap-2">
                  <MapPin size={20} />
                  <span>{event.place}</span>
                </div>
              )}
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  <LinkIcon size={20} />
                  <span>Event Link</span>
                </a>
              )}
            </div>
          </div>

          {/* Panel Title */}
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 drop-shadow-lg">{panel.title}</h2>
          </div>

          {/* Moderator */}
          {panel.moderatorName && (
            <div className="mb-12">
              <div className="text-2xl font-semibold mb-6 text-indigo-200">Moderator</div>
              <div className="flex flex-col items-center gap-4">
                {panel.moderatorPicture && (
                  <img
                    src={panel.moderatorPicture}
                    alt={panel.moderatorName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                  />
                )}
                <div>
                  <div className="text-3xl font-bold mb-2">{panel.moderatorName}</div>
                  {panel.moderatorTitle && (
                    <div className="text-xl text-indigo-200 mb-1">{panel.moderatorTitle}</div>
                  )}
                  {panel.moderatorEntity && (
                    <div className="text-lg text-indigo-300">{panel.moderatorEntity}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Speakers */}
          {panel.speakers && panel.speakers.length > 0 && (
            <div>
              <div className="text-2xl font-semibold mb-8 text-indigo-200">Speakers</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {panel.speakers.map((speaker, index) => (
                  <div key={index} className="flex flex-col items-center gap-4">
                    {speaker.picture && (
                      <img
                        src={speaker.picture}
                        alt={speaker.name}
                        className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                      />
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">{speaker.name}</div>
                      {speaker.title && (
                        <div className="text-lg text-indigo-200 mb-1">{speaker.title}</div>
                      )}
                      {speaker.entity && (
                        <div className="text-base text-indigo-300">{speaker.entity}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
          50% { transform: translateY(-20px) rotate(var(--rotation)); }
        }
      `}</style>
    </div>
  );
};

export default DisplayPanel;

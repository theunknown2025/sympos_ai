import React from 'react';

// Conference Illustration Component (stage, audience, screen)
export const ConferenceIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uniqueId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`stageGradient-${uniqueId}`} x1="50" y1="180" x2="350" y2="260">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`screenGradient-${uniqueId}`} x1="100" y1="60" x2="300" y2="180">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Background Stage */}
      <rect x="50" y="180" width="300" height="80" rx="8" fill={`url(#stageGradient-${uniqueId})`} />

      {/* People Silhouettes */}
      <circle cx="120" cy="200" r="25" fill="#6366f1" opacity="0.3" />
      <rect x="105" y="225" width="30" height="35" rx="4" fill="#6366f1" opacity="0.3" />

      <circle cx="200" cy="190" r="30" fill="#8b5cf6" opacity="0.3" />
      <rect x="182" y="220" width="36" height="40" rx="4" fill="#8b5cf6" opacity="0.3" />

      <circle cx="280" cy="200" r="25" fill="#6366f1" opacity="0.3" />
      <rect x="265" y="225" width="30" height="35" rx="4" fill="#6366f1" opacity="0.3" />

      {/* Presentation Screen */}
      <rect x="100" y="60" width="200" height="120" rx="8" fill={`url(#screenGradient-${uniqueId})`} />

      {/* Simple content on screen */}
      <line x1="120" y1="120" x2="180" y2="100" stroke="#6366f1" strokeWidth="2" opacity="0.3" />
      <line x1="180" y1="100" x2="240" y2="130" stroke="#8b5cf6" strokeWidth="2" opacity="0.3" />
      <circle cx="150" cy="140" r="6" fill="#6366f1" opacity="0.3" />
      <circle cx="230" cy="110" r="5" fill="#8b5cf6" opacity="0.3" />
    </svg>
  );
};

// Networking Illustration (connected people nodes)
export const NetworkingIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uniqueId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`person1-${uniqueId}`} x1="70" y1="120" x2="130" y2="180">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id={`person2-${uniqueId}`} x1="165" y1="65" x2="235" y2="135">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={`person3-${uniqueId}`} x1="270" y1="120" x2="330" y2="180">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id={`person4-${uniqueId}`} x1="170" y1="170" x2="230" y2="230">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Connection Lines */}
      <line x1="100" y1="150" x2="200" y2="100" stroke="#6366f1" strokeWidth="2" opacity="0.3" />
      <line x1="200" y1="100" x2="300" y2="150" stroke="#8b5cf6" strokeWidth="2" opacity="0.3" />
      <line x1="100" y1="150" x2="200" y2="200" stroke="#6366f1" strokeWidth="2" opacity="0.3" />
      <line x1="300" y1="150" x2="200" y2="200" stroke="#8b5cf6" strokeWidth="2" opacity="0.3" />
      <line x1="100" y1="150" x2="300" y2="150" stroke="#6366f1" strokeWidth="2" opacity="0.2" />

      {/* People Nodes */}
      <circle cx="100" cy="150" r="30" fill={`url(#person1-${uniqueId})`} />
      <circle cx="100" cy="150" r="20" fill="white" opacity="0.3" />

      <circle cx="200" cy="100" r="35" fill={`url(#person2-${uniqueId})`} />
      <circle cx="200" cy="100" r="25" fill="white" opacity="0.3" />

      <circle cx="300" cy="150" r="30" fill={`url(#person3-${uniqueId})`} />
      <circle cx="300" cy="150" r="20" fill="white" opacity="0.3" />

      <circle cx="200" cy="200" r="30" fill={`url(#person4-${uniqueId})`} />
      <circle cx="200" cy="200" r="20" fill="white" opacity="0.3" />
    </svg>
  );
};

// Collaboration Illustration (documents and arrows)
export const CollaborationIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uniqueId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id={`arrowhead-${uniqueId}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
        </marker>
      </defs>

      {/* Document/Paper */}
      <rect
        x="80"
        y="60"
        width="120"
        height="160"
        rx="4"
        fill="white"
        stroke="#6366f1"
        strokeWidth="2"
        opacity="0.8"
      />
      <line x1="100" y1="90" x2="180" y2="90" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="100" y1="110" x2="160" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="100" y1="130" x2="170" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="100" y1="150" x2="150" y2="150" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Second Document */}
      <rect
        x="200"
        y="80"
        width="120"
        height="160"
        rx="4"
        fill="white"
        stroke="#8b5cf6"
        strokeWidth="2"
        opacity="0.8"
      />
      <line x1="220" y1="110" x2="300" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="220" y1="130" x2="280" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="220" y1="150" x2="290" y2="150" stroke="#cbd5f1" strokeWidth="1.5" />
      <line x1="220" y1="170" x2="270" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Connection Arrow */}
      <path
        d="M 200 140 L 180 140"
        stroke="#6366f1"
        strokeWidth="3"
        fill="none"
        markerEnd={`url(#arrowhead-${uniqueId})`}
      />

      {/* Checkmarks */}
      <circle cx="90" cy="100" r="8" fill="#10b981" opacity="0.2" />
      <path
        d="M 86 100 L 89 103 L 94 98"
        stroke="#10b981"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};


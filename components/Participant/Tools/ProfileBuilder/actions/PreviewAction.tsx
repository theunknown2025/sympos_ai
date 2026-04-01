import React from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PreviewActionProps {
  profileId: string;
  className?: string;
}

const PreviewAction: React.FC<PreviewActionProps> = ({ profileId, className = '' }) => {
  const navigate = useNavigate();

  const handlePreview = () => {
    // Open preview in new tab
    const previewUrl = `/jury/tools/profile-builder/preview/${profileId}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <button
      onClick={handlePreview}
      className={`p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors ${className}`}
      title="Preview in new tab"
    >
      <Eye size={18} />
    </button>
  );
};

export default PreviewAction;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCertificate } from '../../../services/certificateService';
import { Certificate } from '../../../services/certificateService';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

const ViewCertificate: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (certificateId) {
      loadCertificate();
    }
  }, [certificateId]);

  const loadCertificate = async () => {
    if (!certificateId) return;
    try {
      setLoading(true);
      setError('');
      const cert = await getCertificate(certificateId);
      setCertificate(cert);
      if (!cert) {
        setError('Certificate not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load certificate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate) return;
    
    try {
      // Fetch the certificate image
      const response = await fetch(certificate.certificateImageUrl);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      // Create an image element to get dimensions
      const img = new Image();
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height],
      });
      
      pdf.addImage(imageUrl, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`certificate-${certificate.participantName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Certificate Not Found</h1>
          <p className="text-slate-600">{error || 'The certificate you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Certificate of Participation</h1>
              <p className="text-slate-600 mt-1">Issued to {certificate.participantName}</p>
            </div>
            <button
              onClick={downloadCertificate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
          
          <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
            <img
              src={certificate.certificateImageUrl}
              alt={`Certificate for ${certificate.participantName}`}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCertificate;

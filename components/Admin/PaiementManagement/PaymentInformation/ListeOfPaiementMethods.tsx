import React, { useState, useEffect } from 'react';
import { CreditCard, Edit, Trash2, Loader2, File, Download } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getPaymentMethods,
  deletePaymentMethod,
  type PaymentMethod,
} from '../../../../services/paymentService';
import { supabase, TABLES } from '../../../../supabase';

interface PaymentMethodFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

interface ListeOfPaiementMethodsProps {
  onEdit: (method: PaymentMethod) => void;
}

const ListeOfPaiementMethods: React.FC<ListeOfPaiementMethodsProps> = ({ onEdit }) => {
  const { currentUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesMap, setFilesMap] = useState<Record<string, PaymentMethodFile[]>>({});

  // Fetch payment methods on component mount
  useEffect(() => {
    if (currentUser) {
      loadPaymentMethods();
    }
  }, [currentUser]);

  const loadPaymentMethods = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const methods = await getPaymentMethods(currentUser.id);
      setPaymentMethods(methods);

      // Load files for each method
      const filesPromises = methods.map(async (method) => {
        const { data, error } = await supabase
          .from(TABLES.PAYMENT_METHOD_FILES)
          .select('*')
          .eq('payment_method_id', method.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('Error loading files for method:', method.id, error);
          return { methodId: method.id, files: [] };
        }

        return {
          methodId: method.id,
          files: (data || []).map(f => ({
            id: f.id,
            fileName: f.file_name,
            fileUrl: f.file_url,
            fileSize: f.file_size,
            fileType: f.file_type,
          })),
        };
      });

      const filesResults = await Promise.all(filesPromises);
      const newFilesMap: Record<string, PaymentMethodFile[]> = {};
      filesResults.forEach(({ methodId, files }) => {
        newFilesMap[methodId] = files;
      });
      setFilesMap(newFilesMap);
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      alert('Failed to load payment methods: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) {
      alert('You must be logged in to delete payment methods');
      return;
    }

    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      await deletePaymentMethod(currentUser.id, id);
      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method: ' + error.message);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        Liste of paiement to edit, display and delete
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No payment methods created yet.</p>
          <p className="text-slate-400 text-sm mt-2">Create your first payment method in the "New Paiement Methode Information" tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const methodFiles = filesMap[method.id] || [];
            return (
              <div
                key={method.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{method.name}</h3>
                    {method.fields.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {method.fields.map((field, index) => (
                          <div key={index} className="text-sm text-slate-600">
                            <span className="font-medium">{field.name}:</span> {field.content}
                          </div>
                        ))}
                      </div>
                    )}
                    {methodFiles.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-2">Files:</p>
                        <div className="space-y-1">
                          {methodFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              <File size={14} className="text-slate-400" />
                              <span className="truncate flex-1">{file.fileName}</span>
                              <span className="text-xs text-slate-400">{formatFileSize(file.fileSize)}</span>
                              <button
                                onClick={() => handleDownloadFile(file.fileUrl, file.fileName)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Download"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onEdit(method)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListeOfPaiementMethods;

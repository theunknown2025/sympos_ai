import React, { useState, useEffect } from 'react';
import { Users, Edit, Trash2, Eye, Loader2, Mail, Phone, User as UserIcon, Image as ImageIcon } from 'lucide-react';
import { Personnel, getPersonnel, deletePersonnel } from '../../../../services/personnelService';
import { useAuth } from '../../../../hooks/useAuth';
import PersonnelViewModal from './PersonnelViewModal';
import PersonnelEditModal from './PersonnelEditModal';

const PersonnelList: React.FC = () => {
  const { currentUser } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPersonnel, setViewingPersonnel] = useState<Personnel | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadPersonnel();
    }
  }, [currentUser]);

  const loadPersonnel = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const personnelList = await getPersonnel(currentUser.id);
      setPersonnel(personnelList);
    } catch (error) {
      console.error('Error loading personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (personnelItem: Personnel) => {
    if (!window.confirm(`Are you sure you want to delete ${personnelItem.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(personnelItem.id);
      await deletePersonnel(personnelItem.id);
      await loadPersonnel();
    } catch (error: any) {
      console.error('Error deleting personnel:', error);
      alert(error.message || 'Failed to delete personnel. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading personnel...</p>
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No personnel found</p>
        <p className="text-sm">Create your first personnel member to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {personnel.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-slate-200">
                    <UserIcon className="text-indigo-600" size={32} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.fullName}</h3>
                  <p className="text-sm text-slate-600">{item.role}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    {item.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        <span>{item.email}</span>
                      </div>
                    )}
                    {item.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        <span>{item.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  {item.roleDescription && (
                    <p className="text-sm text-slate-500 mt-1">{item.roleDescription}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingPersonnel(item)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="View"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => setEditingPersonnel(item)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingPersonnel && (
        <PersonnelViewModal
          personnel={viewingPersonnel}
          onClose={() => setViewingPersonnel(null)}
        />
      )}

      {editingPersonnel && (
        <PersonnelEditModal
          personnel={editingPersonnel}
          onClose={() => setEditingPersonnel(null)}
          onSuccess={() => {
            setEditingPersonnel(null);
            loadPersonnel();
          }}
        />
      )}
    </>
  );
};

export default PersonnelList;


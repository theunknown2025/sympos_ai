import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  X,
  Folder,
  FolderPlus,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { supabase, STORAGE_BUCKETS } from '../../../../supabase';

interface FileItem {
  name: string;
  path: string;
  size: number;
  created_at: string;
  updated_at: string;
}

interface FolderItem {
  name: string;
  path: string;
}

const DocumentsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pathPrefix = currentPath.length > 0 
        ? `${currentPath.join('/')}/`
        : '';

      const { data, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .list(pathPrefix, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (listError) {
        throw listError;
      }

      // Separate folders and files
      const folderItems: FolderItem[] = (data || [])
        .filter(item => item.id === null) // Folders have id === null
        .map(item => ({
          name: item.name,
          path: `${pathPrefix}${item.name}`,
        }));

      const fileItems: FileItem[] = (data || [])
        .filter(item => item.id !== null) // Files have id, folders don't
        .map(item => ({
          name: item.name,
          path: `${pathPrefix}${item.name}`,
          size: item.metadata?.size || 0,
          created_at: item.created_at || '',
          updated_at: item.updated_at || item.created_at || '',
        }));

      setFolders(folderItems);
      setFiles(fileItems);
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !currentUser) return;

    try {
      setUploading(true);
      setError(null);

      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const pathPrefix = currentPath.length > 0 
          ? `${currentPath.join('/')}/`
          : '';
        
        const fileName = pathPrefix ? `${pathPrefix}${Date.now()}-${file.name}` : `${Date.now()}-${file.name}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.DOCUMENTS)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        return data;
      });

      await Promise.all(uploadPromises);
      await loadFiles();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .getPublicUrl(file.path);
      
      window.open(data.publicUrl, '_blank');
    } catch (err: any) {
      console.error('Error downloading file:', err);
      setError(err.message || 'Failed to download file');
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .remove([file.path]);

      if (deleteError) throw deleteError;
      
      await loadFiles();
    } catch (err: any) {
      console.error('Error deleting file:', err);
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    // Validate folder name (no special characters except - and _)
    const folderNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!folderNameRegex.test(newFolderName.trim())) {
      setError('Folder name can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    try {
      setCreatingFolder(true);
      setError(null);

      const pathPrefix = currentPath.length > 0 
        ? `${currentPath.join('/')}/`
        : '';
      
      const folderPath = `${pathPrefix}${newFolderName.trim()}/.keep`;
      
      // Create folder by uploading a placeholder file
      const placeholderFile = new File([''], '.keep', { type: 'text/plain' });
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(folderPath, placeholderFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      
      setNewFolderName('');
      setShowCreateFolder(false);
      await loadFiles();
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    if (!confirm(`Are you sure you want to delete folder "${folder.name}" and all its contents?`)) return;

    try {
      // Collect all file paths to delete recursively
      const pathsToDelete: string[] = [];
      
      const collectPaths = async (folderPath: string) => {
        const { data: items, error: listError } = await supabase.storage
          .from(STORAGE_BUCKETS.DOCUMENTS)
          .list(folderPath, {
            limit: 1000,
            offset: 0,
          });

        if (listError) throw listError;

        if (items) {
          for (const item of items) {
            const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
            if (item.id === null) {
              // It's a folder, recurse
              await collectPaths(itemPath);
            } else {
              // It's a file
              pathsToDelete.push(itemPath);
            }
          }
        }
      };

      await collectPaths(folder.path);

      // Also delete the .keep file if it exists
      pathsToDelete.push(`${folder.path}/.keep`);

      if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKETS.DOCUMENTS)
          .remove(pathsToDelete);

        if (deleteError) throw deleteError;
      }
      
      await loadFiles();
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      setError(err.message || 'Failed to delete folder');
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    setCurrentPath([...currentPath, folder.name]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Upload Documents</h3>
            <p className="text-xs text-slate-600">Upload PDF, DOC, DOCX, TXT, and other document files</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              disabled={!currentUser}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <FolderPlus size={18} />
              <span>New Folder</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !currentUser}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Upload Files</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Create Folder Input */}
        {showCreateFolder && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {creatingFolder ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create</span>
              )}
            </button>
            <button
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      {currentPath.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <button
            onClick={() => setCurrentPath([])}
            className="hover:text-indigo-600 transition-colors"
          >
            Documents
          </button>
          {currentPath.map((folder, index) => (
            <React.Fragment key={index}>
              <span>/</span>
              <button
                onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                className="hover:text-indigo-600 transition-colors"
              >
                {folder}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Files and Folders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-600 font-medium">No documents found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Upload your first document or create a folder to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Folders */}
          {filteredFolders.map((folder) => (
            <div
              key={folder.path}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => handleFolderClick(folder)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Folder className="text-amber-600" size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDeleteFolder(folder)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete Folder"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-900 text-sm truncate flex-1" title={folder.name}>
                  {folder.name}
                </h4>
                <ChevronRight className="text-slate-400 flex-shrink-0" size={16} />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <p>Folder</p>
              </div>
            </div>
          ))}

          {/* Files */}
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText className="text-indigo-600" size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="font-medium text-slate-900 text-sm mb-1 truncate" title={file.name}>
                {file.name}
              </h4>
              <div className="text-xs text-slate-500 space-y-1">
                <p>{formatFileSize(file.size)}</p>
                <p>{formatDate(file.updated_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;


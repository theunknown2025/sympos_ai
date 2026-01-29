import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Trash2,
  Search,
  Grid3x3,
  List,
  Maximize2,
  X,
  Loader2,
  AlertCircle,
  Play,
  Folder,
  FolderPlus,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { supabase, STORAGE_BUCKETS } from '../../../../supabase';

interface MediaItem {
  name: string;
  path: string;
  size: number;
  created_at: string;
  updated_at: string;
  type: 'image' | 'video';
  url?: string;
}

interface FolderItem {
  name: string;
  path: string;
}

const MediaTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bigPreview, setBigPreview] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, [mediaTypeFilter, currentPath]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      const pathPrefix = currentPath.length > 0 
        ? `${currentPath.join('/')}/`
        : '';

      const { data, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.MEDIA)
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

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];

      const mediaItems: MediaItem[] = (data || [])
        .filter(item => item.id !== null)
        .map(item => {
          const ext = item.name.toLowerCase().substring(item.name.lastIndexOf('.'));
          const isImage = imageExtensions.includes(ext);
          const isVideo = videoExtensions.includes(ext);

          if (!isImage && !isVideo) return null;

          return {
            name: item.name,
            path: `${pathPrefix}${item.name}`,
            size: item.metadata?.size || 0,
            created_at: item.created_at || '',
            updated_at: item.updated_at || item.created_at || '',
            type: isImage ? 'image' as const : 'video' as const,
          };
        })
        .filter((item): item is MediaItem => item !== null);

      // Apply filter
      const filteredMedia = mediaTypeFilter === 'all'
        ? mediaItems
        : mediaItems.filter(item => 
            mediaTypeFilter === 'images' ? item.type === 'image' : item.type === 'video'
          );

      // Load URLs
      const mediaWithUrls = await Promise.all(
        filteredMedia.map(async (item) => {
          try {
            const { data } = supabase.storage
              .from(STORAGE_BUCKETS.MEDIA)
              .getPublicUrl(item.path);
            return { ...item, url: data.publicUrl };
          } catch (err) {
            return item;
          }
        })
      );

      setFolders(folderItems);
      setMedia(mediaWithUrls);
    } catch (err: any) {
      console.error('Error loading media:', err);
      setError(err.message || 'Failed to load media');
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

      const pathPrefix = currentPath.length > 0 
        ? `${currentPath.join('/')}/`
        : '';

      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const fileName = pathPrefix ? `${pathPrefix}${Date.now()}-${file.name}` : `${Date.now()}-${file.name}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.MEDIA)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        return data;
      });

      await Promise.all(uploadPromises);
      await loadMedia();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading media:', err);
      setError(err.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (item: MediaItem) => {
    if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.MEDIA)
        .remove([item.path]);

      if (deleteError) throw deleteError;
      
      await loadMedia();
    } catch (err: any) {
      console.error('Error deleting media:', err);
      setError(err.message || 'Failed to delete media');
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
        .from(STORAGE_BUCKETS.MEDIA)
        .upload(folderPath, placeholderFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      
      setNewFolderName('');
      setShowCreateFolder(false);
      await loadMedia();
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
          .from(STORAGE_BUCKETS.MEDIA)
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
          .from(STORAGE_BUCKETS.MEDIA)
          .remove(pathsToDelete);

        if (deleteError) throw deleteError;
      }
      
      await loadMedia();
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      setError(err.message || 'Failed to delete folder');
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    setCurrentPath([...currentPath, folder.name]);
  };

  const handlePreview = (item: MediaItem) => {
    setSelectedMedia(item);
    setBigPreview(true);
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
    });
  };

  const filteredMedia = media.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Upload Media</h3>
            <p className="text-xs text-slate-600">Upload images (JPG, PNG, GIF, WEBP) and videos (MP4, WEBM, MOV)</p>
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
              accept="image/*,video/*"
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
                  <span>Upload Media</span>
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
            Media
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

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center gap-3">
          {/* Media Type Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setMediaTypeFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                mediaTypeFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaTypeFilter('images')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1 ${
                mediaTypeFilter === 'images'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ImageIcon size={16} />
              Images
            </button>
            <button
              onClick={() => setMediaTypeFilter('videos')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1 ${
                mediaTypeFilter === 'videos'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <VideoIcon size={16} />
              Videos
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="Grid View"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>

          {/* Big Preview Toggle */}
          <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={bigPreview}
              onChange={(e) => setBigPreview(e.target.checked)}
              className="sr-only"
            />
            <Maximize2 size={18} className={bigPreview ? 'text-indigo-600' : 'text-slate-400'} />
            <span className="text-sm font-medium text-slate-700">Big Preview</span>
          </label>
        </div>
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : filteredFolders.length === 0 && filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <ImageIcon className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-600 font-medium">No media found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Upload your first image or video or create a folder to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={`grid gap-4 ${bigPreview ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
          {/* Folders */}
          {filteredFolders.map((folder) => (
            <div
              key={folder.path}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative cursor-pointer"
              onClick={() => handleFolderClick(folder)}
            >
              <div className="relative aspect-square bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <Folder className="text-amber-600 mx-auto mb-2" size={48} />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDeleteFolder(folder)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-red-600 rounded transition-colors"
                      title="Delete Folder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {!bigPreview && (
                <div className="p-2">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-slate-900 truncate flex-1" title={folder.name}>
                      {folder.name}
                    </p>
                    <ChevronRight className="text-slate-400 flex-shrink-0" size={14} />
                  </div>
                  <p className="text-xs text-slate-500">Folder</p>
                </div>
              )}
            </div>
          ))}

          {/* Media Items */}
          {filteredMedia.map((item) => (
            <div
              key={item.path}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative"
            >
              <div className="relative aspect-square bg-slate-100">
                {item.type === 'image' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handlePreview(item)}
                  />
                ) : item.type === 'video' && item.url ? (
                  <div className="relative w-full h-full">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="text-white" size={32} />
                    </div>
                    <button
                      onClick={() => handlePreview(item)}
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="text-slate-300" size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-indigo-600 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-red-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {!bigPreview && (
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-900 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(item.size)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200">
          {/* Folders in List View */}
          {filteredFolders.map((folder) => (
            <div
              key={folder.path}
              className="p-4 hover:bg-slate-50 transition-colors group flex items-center gap-4 cursor-pointer"
              onClick={() => handleFolderClick(folder)}
            >
              <div className="relative w-20 h-20 bg-amber-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                <Folder className="text-amber-600" size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 truncate">{folder.name}</p>
                  <ChevronRight className="text-slate-400 flex-shrink-0" size={16} />
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span>Folder</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDeleteFolder(folder)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete Folder"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Media Items in List View */}
          {filteredMedia.map((item) => (
            <div
              key={item.path}
              className="p-4 hover:bg-slate-50 transition-colors group flex items-center gap-4"
            >
              <div className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.type === 'image' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handlePreview(item)}
                  />
                ) : item.type === 'video' && item.url ? (
                  <div className="relative w-full h-full">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="text-white" size={20} />
                    </div>
                    <button
                      onClick={() => handlePreview(item)}
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.type === 'image' ? (
                      <ImageIcon className="text-slate-300" size={24} />
                    ) : (
                      <VideoIcon className="text-slate-300" size={24} />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{item.name}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span>{formatFileSize(item.size)}</span>
                  <span>{formatDate(item.updated_at)}</span>
                  <span className="capitalize">{item.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(item)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Preview"
                >
                  <Maximize2 size={18} />
                </button>
                <button
                  onClick={() => handleDownload(item)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Big Preview Modal */}
      {bigPreview && selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setBigPreview(false)}>
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setBigPreview(false);
                setSelectedMedia(null);
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <X size={24} />
            </button>
            {selectedMedia.type === 'image' && selectedMedia.url ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : selectedMedia.type === 'video' && selectedMedia.url ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : null}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4">
              <p className="font-medium text-slate-900">{selectedMedia.name}</p>
              <p className="text-sm text-slate-600 mt-1">
                {formatFileSize(selectedMedia.size)} • {formatDate(selectedMedia.updated_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaTab;


import React, { useState, useEffect, useRef } from 'react';
import { CertificateTemplate, CertificateTextElement } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { 
  saveCertificateTemplate, 
  updateCertificateTemplate, 
  getCertificateTemplate 
} from '../../../services/certificateTemplateService';
import {
  saveBadgeTemplate,
  updateBadgeTemplate,
  getBadgeTemplate
} from '../../../services/badgeTemplateService';
import { uploadImageToStorage, uploadBase64ImageToStorage } from '../../../services/storageService';
import SaveTypeModal from './SaveTypeModal';
import { 
  ArrowLeft, 
  Save, 
  ImageIcon, 
  Type, 
  Plus, 
  Trash2, 
  Loader2, 
  Upload,
  X,
  Move,
  Maximize2,
  Minimize2,
  QrCode
} from 'lucide-react';

interface CertificateTemplateBuilderProps {
  templateId?: string;
  onSave?: () => void;
  onBack?: () => void;
}

const CertificateTemplateBuilder: React.FC<CertificateTemplateBuilderProps> = ({ 
  templateId, 
  onSave, 
  onBack 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateType, setTemplateType] = useState<'certificate' | 'badge' | null>(null);
  
  const [title, setTitle] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundImageType, setBackgroundImageType] = useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(''); // For preview only
  const [elements, setElements] = useState<CertificateTextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Size and orientation state
  const [sizeType, setSizeType] = useState<'predefined' | 'custom'>('predefined');
  const [paperSize, setPaperSize] = useState<'A5' | 'A4' | 'A3'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Paper size dimensions in pixels (at 150 DPI for good quality)
  const paperDimensions: Record<'A5' | 'A4' | 'A3', { portrait: { width: number; height: number }; landscape: { width: number; height: number } }> = {
    A5: {
      portrait: { width: 496, height: 701 },
      landscape: { width: 701, height: 496 }
    },
    A4: {
      portrait: { width: 701, height: 993 },
      landscape: { width: 993, height: 701 }
    },
    A3: {
      portrait: { width: 993, height: 1403 },
      landscape: { width: 1403, height: 993 }
    }
  };
  
  // Calculate current dimensions
  const getCurrentDimensions = () => {
    if (sizeType === 'custom') {
      return { width: customWidth, height: customHeight };
    } else {
      return paperDimensions[paperSize][orientation];
    }
  };
  
  const { width: canvasWidth, height: canvasHeight } = getCurrentDimensions();

  useEffect(() => {
    if (currentUser && templateId) {
        loadTemplate();
    } else if (currentUser && !templateId) {
        // Check if there's a Canva background URL from session storage
        const canvaBackgroundUrl = sessionStorage.getItem('canvaBackgroundUrl');
        if (canvaBackgroundUrl) {
          setBackgroundImage(canvaBackgroundUrl);
          setBackgroundImageType('url');
          setPreviewImage(canvaBackgroundUrl);
          sessionStorage.removeItem('canvaBackgroundUrl'); // Clear after use
        }
        setLoading(false);
      }
  }, [templateId, currentUser]);

  const loadTemplate = async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      // Try to load as certificate first, then badge
      let template = await getCertificateTemplate(templateId);
      if (template) {
        setTemplateType('certificate');
      } else {
        template = await getBadgeTemplate(templateId);
        if (template) {
          setTemplateType('badge');
        }
      }
      
      if (template) {
        setTitle(template.title);
        setBackgroundImage(template.backgroundImage);
        setBackgroundImageType(template.backgroundImageType);
        setPreviewImage(template.backgroundImage); // Set preview for display
        setElements(template.elements || []);
        
        // Load dimensions and determine size type
        if (template.width && template.height) {
          // Check if dimensions match a predefined size
          const matchesPredefined = Object.entries(paperDimensions).some(([size, dims]) => 
            (dims.portrait.width === template.width && dims.portrait.height === template.height) ||
            (dims.landscape.width === template.width && dims.landscape.height === template.height)
          );
          
          if (matchesPredefined) {
            // Find which predefined size matches
            for (const [size, dims] of Object.entries(paperDimensions)) {
              if (dims.portrait.width === template.width && dims.portrait.height === template.height) {
                setPaperSize(size as 'A5' | 'A4' | 'A3');
                setOrientation('portrait');
                setSizeType('predefined');
                break;
              } else if (dims.landscape.width === template.width && dims.landscape.height === template.height) {
                setPaperSize(size as 'A5' | 'A4' | 'A3');
                setOrientation('landscape');
                setSizeType('predefined');
                break;
              }
            }
          } else {
            // Custom dimensions
            setSizeType('custom');
            setCustomWidth(template.width);
            setCustomHeight(template.height);
          }
        }
      }
    } catch (err: any) {
      setError('Failed to load template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setBackgroundImageType('upload');
      // Create preview for display
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewImage(result);
        // Don't set backgroundImage yet - we'll upload to Storage on save
      };
      reader.readAsDataURL(file);
    }
  };


  const addTextElement = () => {
    const newElement: CertificateTextElement = {
      id: Date.now().toString(),
      type: 'text',
      content: 'New Text',
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const addFieldElement = () => {
    const newElement: CertificateTextElement = {
      id: Date.now().toString(),
      type: 'field',
      content: 'name', // Default to name field
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const addQRElement = () => {
    const newElement: CertificateTextElement = {
      id: Date.now().toString(),
      type: 'qr',
      content: '', // Will be auto-generated when certificate is created
      x: 85, // Default position (right side)
      y: 85, // Default position (bottom)
      fontSize: 100, // QR code size in pixels
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const updateElement = (id: string, updates: Partial<CertificateTextElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    const element = elements.find(el => el.id === elementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const elementX = (element.x / 100) * rect.width;
    const elementY = (element.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateElement(selectedElementId, { x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveClick = () => {
    if (!currentUser) {
      setError('You must be logged in to save templates');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a template title');
      return;
    }

    if (!backgroundImage && !uploadedFile && !previewImage) {
      setError('Please add a background image');
      return;
    }

    // If editing existing template, use the existing type
    if (templateId && templateType) {
      handleSave(templateType);
    } else {
      // Show modal to select type for new templates
      setShowSaveModal(true);
    }
  };

  const handleSave = async (type: 'certificate' | 'badge') => {
    if (!currentUser) {
      setError('You must be logged in to save templates');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      setShowSaveModal(false);

      // Upload image to Storage if it's a file upload
      let finalBackgroundImage = backgroundImage;
      let finalBackgroundImageType = backgroundImageType;
      const folder = type === 'badge' ? 'badges' : 'certificate-templates';

      if (backgroundImageType === 'upload' && uploadedFile) {
        try {
          setError('Uploading image to storage...');
          // Upload the file to Storage
          finalBackgroundImage = await uploadImageToStorage(currentUser.id, uploadedFile, folder);
          finalBackgroundImageType = 'upload';
          setError(''); // Clear error on success
        } catch (err: any) {
          setError(err.message || 'Failed to upload image. Please try again.');
          throw err;
        }
      } else if (backgroundImageType === 'url' && backgroundImage) {
        // For URL images, save the URL directly (no conversion needed)
        finalBackgroundImage = backgroundImage;
        finalBackgroundImageType = 'url';
      } else if (!finalBackgroundImage) {
        setError('Please add a background image');
        return;
      }

      const dimensions = getCurrentDimensions();
      const templateData = {
        title: title.trim(),
        backgroundImage: finalBackgroundImage,
        backgroundImageType: finalBackgroundImageType,
        width: dimensions.width,
        height: dimensions.height,
        elements,
      };

      if (templateId && templateType) {
        // Update existing template
        if (type === 'badge') {
          await updateBadgeTemplate(templateId, templateData);
        } else {
          await updateCertificateTemplate(templateId, templateData);
        }
      } else {
        // Save new template
        if (type === 'badge') {
          await saveBadgeTemplate(currentUser.id, templateData);
        } else {
          await saveCertificateTemplate(currentUser.id, templateData);
        }
      }

      setTemplateType(type);
      setSuccess(true);
      setTimeout(() => {
        if (onSave) onSave();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading template...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {templateId ? 'Edit Template' : 'New Template'}
            </h1>
            <p className="text-sm text-slate-500">Design your certificate template</p>
          </div>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={saving || !title.trim() || (!backgroundImage && !uploadedFile && !previewImage)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Template
            </>
          )}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto p-6 space-y-6">
          {/* Template Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Template Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conference Certificate"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Canvas Size
            </label>
            <div className="space-y-3">
              {/* Size Type Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSizeType('predefined')}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg ${
                    sizeType === 'predefined'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Predefined
                </button>
                <button
                  onClick={() => setSizeType('custom')}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg ${
                    sizeType === 'custom'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Predefined Size Options */}
              {sizeType === 'predefined' && (
                <>
                  {/* Paper Size Selection */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Paper Size</label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as 'A5' | 'A4' | 'A3')}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    >
                      <option value="A5">A5</option>
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                    </select>
                  </div>

                  {/* Orientation Selection */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Orientation</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrientation('portrait')}
                        className={`flex-1 px-2 py-1.5 text-xs border rounded ${
                          orientation === 'portrait'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        Portrait
                      </button>
                      <button
                        onClick={() => setOrientation('landscape')}
                        className={`flex-1 px-2 py-1.5 text-xs border rounded ${
                          orientation === 'landscape'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>

                  {/* Display Dimensions */}
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    Dimensions: {canvasWidth} × {canvasHeight} px
                  </div>
                </>
              )}

              {/* Custom Size Options */}
              {sizeType === 'custom' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Width (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || 100)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Height (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || 100)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    Dimensions: {canvasWidth} × {canvasHeight} px
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Background Image <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setBackgroundImageType('url')}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg ${
                    backgroundImageType === 'url'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => {
                    setBackgroundImageType('upload');
                    fileInputRef.current?.click();
                  }}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg ${
                    backgroundImageType === 'upload'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Upload
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {backgroundImageType === 'url' && (
                <input
                  type="text"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              {backgroundImageType === 'upload' && (uploadedFile || previewImage) && (
                <div className="text-xs text-slate-500">
                  {uploadedFile ? `File selected: ${uploadedFile.name}` : 'Image ready to upload'}
                </div>
              )}
            </div>
          </div>

          {/* Add Elements */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add Elements
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={addTextElement}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Type size={16} />
                <span className="text-xs">Text</span>
              </button>
              <button
                onClick={addFieldElement}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Type size={16} />
                <span className="text-xs">Field</span>
              </button>
              <button
                onClick={addQRElement}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <QrCode size={16} />
                <span className="text-xs">QR Code</span>
              </button>
            </div>
          </div>

          {/* Element Properties */}
          {selectedElement && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Element Properties</h3>
                <button
                  onClick={() => removeElement(selectedElement.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  value={selectedElement.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'text' | 'field' | 'qr';
                    updateElement(selectedElement.id, { 
                      type: newType,
                      content: newType === 'field' ? 'name' : newType === 'qr' ? '' : selectedElement.content
                    });
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                >
                  <option value="text">Text</option>
                  <option value="field">Field (Placeholder)</option>
                  <option value="qr">QR Code</option>
                </select>
              </div>

              {/* Content */}
              {selectedElement.type === 'text' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Text Content</label>
                  <input
                    type="text"
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
              ) : selectedElement.type === 'field' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Field Name</label>
                  <select
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="organization">Organization</option>
                    <option value="phone">Phone</option>
                    <option value="address">Address</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">QR Code</label>
                  <p className="text-xs text-slate-500 mb-2">
                    QR code will automatically link to the certificate when generated.
                  </p>
                </div>
              )}

              {/* Font Size / QR Size */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {selectedElement.type === 'qr' ? 'QR Code Size' : 'Font Size'}: {selectedElement.fontSize}px
                </label>
                <input
                  type="range"
                  min={selectedElement.type === 'qr' ? '50' : '12'}
                  max={selectedElement.type === 'qr' ? '300' : '72'}
                  value={selectedElement.fontSize}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Font Weight</label>
                <select
                  value={selectedElement.fontWeight}
                  onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value as any })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="semibold">Semi Bold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
                <input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                  className="w-full h-10 border border-slate-300 rounded"
                />
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Text Align</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                      className={`flex-1 px-2 py-1.5 text-xs border rounded ${
                        selectedElement.textAlign === align
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Template saved successfully!
            </div>
          )}
        </div>

        {/* Right Panel - Canvas */}
        <div className="flex-1 bg-slate-100 p-8 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 inline-block">
            <div
              ref={canvasRef}
              className="relative bg-white border-2 border-slate-300"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                backgroundImage: (previewImage || backgroundImage) ? `url(${previewImage || backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e) => {
                if (e.target === canvasRef.current) {
                  setSelectedElementId(null);
                }
              }}
            >
              {!backgroundImage && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Add a background image to get started</p>
                  </div>
                </div>
              )}

              {elements.map((element) => (
                <div
                  key={element.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(element.id);
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  className={`absolute cursor-move select-none ${
                    selectedElementId === element.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  style={{
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: element.type === 'qr' ? undefined : `${element.fontSize}px`,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    color: element.color,
                    textAlign: element.textAlign,
                    width: element.type === 'qr' ? `${element.fontSize}px` : undefined,
                    height: element.type === 'qr' ? `${element.fontSize}px` : undefined,
                  }}
                >
                  {element.type === 'field' ? (
                    <span className="px-2 py-1 bg-indigo-100 border border-indigo-300 rounded text-indigo-700">
                      {'{'}{element.content}{'}'}
                    </span>
                  ) : element.type === 'qr' ? (
                    <div className="w-full h-full bg-slate-200 border-2 border-dashed border-slate-400 rounded flex items-center justify-center">
                      <QrCode size={element.fontSize * 0.6} className="text-slate-500" />
                    </div>
                  ) : (
                    <span>{element.content}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Type Modal */}
      <SaveTypeModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSelect={handleSave}
      />
    </div>
  );
};

export default CertificateTemplateBuilder;


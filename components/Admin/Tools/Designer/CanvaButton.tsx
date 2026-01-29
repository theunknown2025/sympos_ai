import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Line, Group } from 'react-konva';
import { 
  ArrowLeft, Palette, Save, Download, Upload, Type, Square, Circle as CircleIcon, 
  Image as ImageIcon, Trash2, Undo, Redo, Move, Layers, Minus, RotateCw, 
  Maximize2, Minimize2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Underline, Copy, Lock, Unlock, Eye, EyeOff, Grid, ZoomIn, ZoomOut, 
  FlipHorizontal, FlipVertical, Settings, ChevronUp, ChevronDown
} from 'lucide-react';
import Konva from 'konva';

interface CanvaButtonProps {
  onBack?: () => void;
  onClick?: (imageUrl: string) => void;
}

type ToolType = 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'line';
type ShapeType = 'rectangle' | 'circle' | 'text' | 'image' | 'line';

interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  imageUrl?: string;
  rotation?: number;
  opacity?: number;
}

// Component for handling image loading
const ImageShape: React.FC<{
  shape: Shape;
  isSelected: boolean;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  draggable: boolean;
}> = ({ shape, isSelected, onDragEnd, onClick, draggable }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (shape.imageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = shape.imageUrl;
      img.onload = () => {
        setImage(img);
      };
    }
  }, [shape.imageUrl]);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      id={shape.id}
      x={shape.x}
      y={shape.y}
      image={image}
      width={shape.width || 200}
      height={shape.height || 200}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      stroke={isSelected ? '#3b82f6' : shape.stroke}
      strokeWidth={isSelected ? 3 : (shape.strokeWidth || 0)}
    />
  );
};

const CanvaButton: React.FC<CanvaButtonProps> = ({
  onBack,
  onClick,
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [tool, setTool] = useState<ToolType>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tools', 'colors']));
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  // Initialize with empty history
  useEffect(() => {
    setHistory([[]]);
    setHistoryIndex(0);
  }, []);

  const addToHistory = (newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newShapes]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes([...history[newIndex]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes([...history[newIndex]]);
    }
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    // Check if clicking on empty space
    if (e.target === stage) {
      setSelectedShapeId(null);
      
      if (tool === 'rectangle') {
        isDrawing.current = true;
        startPos.current = point;
        const newShape: Shape = {
          id: `rect-${Date.now()}`,
          type: 'rectangle',
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        };
        setShapes([...shapes, newShape]);
        setSelectedShapeId(newShape.id);
      } else if (tool === 'circle') {
        isDrawing.current = true;
        startPos.current = point;
        const newShape: Shape = {
          id: `circle-${Date.now()}`,
          type: 'circle',
          x: point.x,
          y: point.y,
          radius: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        };
        setShapes([...shapes, newShape]);
        setSelectedShapeId(newShape.id);
      } else if (tool === 'text') {
        const newShape: Shape = {
          id: `text-${Date.now()}`,
          type: 'text',
          x: point.x,
          y: point.y,
          text: 'Double click to edit',
          fontSize: 24,
          fontFamily: 'Arial',
          fill: fillColor,
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelectedShapeId(newShape.id);
        addToHistory(newShapes);
      } else if (tool === 'line') {
        isDrawing.current = true;
        startPos.current = point;
        const newShape: Shape = {
          id: `line-${Date.now()}`,
          type: 'line',
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        };
        setShapes([...shapes, newShape]);
        setSelectedShapeId(newShape.id);
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    if (!point) return;

    const lastShape = shapes[shapes.length - 1];
    if (!lastShape) return;

    if (tool === 'rectangle' && lastShape.type === 'rectangle') {
      const newShapes = [...shapes];
      const shape = newShapes[newShapes.length - 1];
      shape.width = Math.abs(point.x - startPos.current.x);
      shape.height = Math.abs(point.y - startPos.current.y);
      shape.x = Math.min(point.x, startPos.current.x);
      shape.y = Math.min(point.y, startPos.current.y);
      setShapes(newShapes);
    } else if (tool === 'circle' && lastShape.type === 'circle') {
      const newShapes = [...shapes];
      const shape = newShapes[newShapes.length - 1];
      const radius = Math.sqrt(
        Math.pow(point.x - startPos.current.x, 2) +
        Math.pow(point.y - startPos.current.y, 2)
      );
      shape.radius = radius;
      setShapes(newShapes);
    } else if (tool === 'line' && lastShape.type === 'line') {
      const newShapes = [...shapes];
      const shape = newShapes[newShapes.length - 1];
      shape.width = point.x - startPos.current.x;
      shape.height = point.y - startPos.current.y;
      setShapes(newShapes);
    }
  };

  const handleStageMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      addToHistory([...shapes]);
    }
  };

  const handleShapeClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const id = e.target.id();
    setSelectedShapeId(id);
  };

  const handleShapeDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const newShapes = shapes.map(shape => {
      if (shape.id === id) {
        return {
          ...shape,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return shape;
    });
    setShapes(newShapes);
    addToHistory(newShapes);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const newShape: Shape = {
        id: `image-${Date.now()}`,
        type: 'image',
        x: stageSize.width / 2 - 100,
        y: stageSize.height / 2 - 100,
        width: 200,
        height: 200,
        imageUrl,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      setSelectedShapeId(newShape.id);
      addToHistory(newShapes);
    };
    reader.readAsDataURL(file);
  };

  const deleteSelectedShape = () => {
    if (selectedShapeId) {
      const newShapes = shapes.filter(shape => shape.id !== selectedShapeId);
      setShapes(newShapes);
      setSelectedShapeId(null);
      addToHistory(newShapes);
    }
  };

  const duplicateSelectedShape = () => {
    if (selectedShapeId) {
      const shape = shapes.find(s => s.id === selectedShapeId);
      if (shape) {
        const newShape: Shape = {
          ...shape,
          id: `${shape.type}-${Date.now()}`,
          x: shape.x + 20,
          y: shape.y + 20,
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelectedShapeId(newShape.id);
        addToHistory(newShapes);
      }
    }
  };

  const bringToFront = () => {
    if (selectedShapeId) {
      const shape = shapes.find(s => s.id === selectedShapeId);
      if (shape) {
        const newShapes = [...shapes.filter(s => s.id !== selectedShapeId), shape];
        setShapes(newShapes);
        addToHistory(newShapes);
      }
    }
  };

  const sendToBack = () => {
    if (selectedShapeId) {
      const shape = shapes.find(s => s.id === selectedShapeId);
      if (shape) {
        const newShapes = [shape, ...shapes.filter(s => s.id !== selectedShapeId)];
        setShapes(newShapes);
        addToHistory(newShapes);
      }
    }
  };

  const updateSelectedShapeProperty = (updates: Partial<Shape>) => {
    if (selectedShapeId) {
      const newShapes = shapes.map(s =>
        s.id === selectedShapeId ? { ...s, ...updates } : s
      );
      setShapes(newShapes);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const canvasPresets = [
    { name: 'A4 Portrait', width: 794, height: 1123 },
    { name: 'A4 Landscape', width: 1123, height: 794 },
    { name: 'Letter Portrait', width: 816, height: 1056 },
    { name: 'Letter Landscape', width: 1056, height: 816 },
    { name: 'Square', width: 1000, height: 1000 },
    { name: 'Wide', width: 1920, height: 1080 },
  ];

  const exportAsImage = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
      quality: 1,
    });

    // Save to sessionStorage for certificate template builder
    sessionStorage.setItem('canvaBackgroundUrl', dataURL);

    // Call onClick callback if provided
    if (onClick) {
      onClick(dataURL);
    }

    // Also trigger download
    const link = document.createElement('a');
    link.download = `certificate-background-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  if (!showEditor) {
    return (
      <div className="h-full flex flex-col">
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
                Create Certificate Background
              </h1>
              <p className="text-sm text-slate-500">Design your certificate background</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <Palette className="text-indigo-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Design Certificate Background
            </h2>
            <p className="text-slate-600 mb-6">
              Create a beautiful certificate background using our design editor powered by Konva.js
            </p>
            <button
              onClick={() => setShowEditor(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-lg transition-colors"
            >
              <Palette size={24} />
              Open Design Editor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
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
            <h1 className="text-xl font-bold text-slate-900">Design Editor</h1>
            <p className="text-sm text-slate-500">Create your certificate background</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={exportAsImage}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Save size={18} />
            Save & Export
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Toolbar */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 overflow-y-auto flex-1">
            <div className="space-y-4">
              {/* Tools Section */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('tools')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900"
                >
                  <span>Drawing Tools</span>
                  {expandedSections.has('tools') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.has('tools') && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTool('select')}
                      className={`p-2.5 rounded-lg border-2 transition-colors ${
                        tool === 'select'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Select & Move"
                    >
                      <Move size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => setTool('rectangle')}
                      className={`p-2.5 rounded-lg border-2 transition-colors ${
                        tool === 'rectangle'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Rectangle"
                    >
                      <Square size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => setTool('circle')}
                      className={`p-2.5 rounded-lg border-2 transition-colors ${
                        tool === 'circle'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Circle"
                    >
                      <CircleIcon size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => setTool('line')}
                      className={`p-2.5 rounded-lg border-2 transition-colors ${
                        tool === 'line'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Line"
                    >
                      <Minus size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => setTool('text')}
                      className={`p-2.5 rounded-lg border-2 transition-colors ${
                        tool === 'text'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Text"
                    >
                      <Type size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2.5 rounded-lg border-2 transition-colors ${
                        tool === 'image'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Image"
                    >
                      <ImageIcon size={18} className="mx-auto" />
                    </button>
                  </div>
                )}
              </div>

              {/* Colors Section */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('colors')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900"
                >
                  <span>Colors & Style</span>
                  {expandedSections.has('colors') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.has('colors') && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">Fill Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">Stroke Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">
                        Stroke Width: {strokeWidth}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={strokeWidth}
                        onChange={(e) => {
                          const width = parseInt(e.target.value);
                          setStrokeWidth(width);
                          if (selectedShapeId) {
                            updateSelectedShapeProperty({ strokeWidth: width });
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">
                        Opacity: {Math.round((selectedShape?.opacity !== undefined ? selectedShape.opacity : opacity) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedShape?.opacity !== undefined ? selectedShape.opacity : opacity}
                        onChange={(e) => {
                          const op = parseFloat(e.target.value);
                          setOpacity(op);
                          if (selectedShapeId) {
                            updateSelectedShapeProperty({ opacity: op });
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">Background</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    {/* Color Presets */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">Quick Colors</label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#64748b', '#f1f5f9', '#e2e8f0', '#cbd5e1'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setFillColor(color)}
                            className="w-8 h-8 rounded border-2 border-slate-300 hover:border-indigo-500 transition-colors"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Shape Properties */}
              {selectedShape && (
                <div className="border-b border-slate-200 pb-4">
                  <button
                    onClick={() => toggleSection('properties')}
                    className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900"
                  >
                    <span>Properties</span>
                    {expandedSections.has('properties') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedSections.has('properties') && (
                    <div className="space-y-3">
                      {selectedShape.type === 'text' && (
                        <>
                          <div>
                            <label className="text-xs text-slate-600 mb-1.5 block">Text Content</label>
                            <textarea
                              value={selectedShape.text || ''}
                              onChange={(e) => updateSelectedShapeProperty({ text: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 mb-1.5 block">Font Size</label>
                            <input
                              type="number"
                              value={selectedShape.fontSize || 24}
                              onChange={(e) => updateSelectedShapeProperty({ fontSize: parseInt(e.target.value) || 24 })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                              min="8"
                              max="200"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 mb-1.5 block">Font Family</label>
                            <select
                              value={selectedShape.fontFamily || 'Arial'}
                              onChange={(e) => updateSelectedShapeProperty({ fontFamily: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Helvetica">Helvetica</option>
                            </select>
                          </div>
                        </>
                      )}
                      {(selectedShape.type === 'rectangle' || selectedShape.type === 'circle' || selectedShape.type === 'image') && (
                        <>
                          {selectedShape.width !== undefined && (
                            <div>
                              <label className="text-xs text-slate-600 mb-1.5 block">Width</label>
                              <input
                                type="number"
                                value={Math.round(selectedShape.width)}
                                onChange={(e) => updateSelectedShapeProperty({ width: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                                min="1"
                              />
                            </div>
                          )}
                          {selectedShape.height !== undefined && (
                            <div>
                              <label className="text-xs text-slate-600 mb-1.5 block">Height</label>
                              <input
                                type="number"
                                value={Math.round(selectedShape.height)}
                                onChange={(e) => updateSelectedShapeProperty({ height: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                                min="1"
                              />
                            </div>
                          )}
                          {selectedShape.radius !== undefined && (
                            <div>
                              <label className="text-xs text-slate-600 mb-1.5 block">Radius</label>
                              <input
                                type="number"
                                value={Math.round(selectedShape.radius)}
                                onChange={(e) => updateSelectedShapeProperty({ radius: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                                min="1"
                              />
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 block">Position</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">X</label>
                            <input
                              type="number"
                              value={Math.round(selectedShape.x)}
                              onChange={(e) => updateSelectedShapeProperty({ x: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Y</label>
                            <input
                              type="number"
                              value={Math.round(selectedShape.y)}
                              onChange={(e) => updateSelectedShapeProperty({ y: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                      {selectedShape.rotation !== undefined && (
                        <div>
                          <label className="text-xs text-slate-600 mb-1.5 block">
                            Rotation: {selectedShape.rotation}°
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={selectedShape.rotation || 0}
                            onChange={(e) => updateSelectedShapeProperty({ rotation: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 block">
                          Opacity: {Math.round((selectedShape.opacity !== undefined ? selectedShape.opacity : 1) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={selectedShape.opacity !== undefined ? selectedShape.opacity : 1}
                          onChange={(e) => updateSelectedShapeProperty({ opacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={duplicateSelectedShape}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                          <Copy size={14} />
                          Duplicate
                        </button>
                        <button
                          onClick={deleteSelectedShape}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={bringToFront}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                        >
                          <ChevronUp size={14} />
                          Bring Forward
                        </button>
                        <button
                          onClick={sendToBack}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                        >
                          <ChevronDown size={14} />
                          Send Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Canvas Settings */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('canvas')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900"
                >
                  <span>Canvas Settings</span>
                  {expandedSections.has('canvas') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.has('canvas') && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">Size Presets</label>
                      <select
                        onChange={(e) => {
                          const preset = canvasPresets[parseInt(e.target.value)];
                          if (preset) {
                            setStageSize({ width: preset.width, height: preset.height });
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      >
                        <option value="">Custom</option>
                        {canvasPresets.map((preset, idx) => (
                          <option key={idx} value={idx}>
                            {preset.name} ({preset.width} × {preset.height})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 block">Width</label>
                        <input
                          type="number"
                          value={stageSize.width}
                          onChange={(e) => setStageSize({ ...stageSize, width: parseInt(e.target.value) || 1200 })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          min="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 block">Height</label>
                        <input
                          type="number"
                          value={stageSize.height}
                          onChange={(e) => setStageSize({ ...stageSize, height: parseInt(e.target.value) || 800 })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                          min="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1.5 block">Zoom: {Math.round(zoom * 100)}%</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <input
                          type="range"
                          min="0.25"
                          max="2"
                          step="0.25"
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showGrid}
                          onChange={(e) => setShowGrid(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                        />
                        <Grid size={14} />
                        Show Grid
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={snapToGrid}
                          onChange={(e) => setSnapToGrid(e.target.checked)}
                          disabled={!showGrid}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded disabled:opacity-50"
                        />
                        <span>Snap to Grid</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Layers */}
              <div>
                <button
                  onClick={() => toggleSection('layers')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-3 hover:text-slate-900"
                >
                  <span className="flex items-center gap-2">
                    <Layers size={16} />
                    Layers ({shapes.length})
                  </span>
                  {expandedSections.has('layers') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.has('layers') && (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {shapes.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No layers yet</p>
                    ) : (
                      shapes.slice().reverse().map((shape, idx) => {
                        const actualIndex = shapes.length - 1 - idx;
                        const isSelected = selectedShapeId === shape.id;
                        return (
                          <div
                            key={shape.id}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <button
                              onClick={() => setSelectedShapeId(shape.id)}
                              className="flex-1 text-left flex items-center gap-2 min-w-0"
                            >
                              <span className="text-slate-400 w-4">{actualIndex + 1}</span>
                              <span className="truncate capitalize">{shape.type}</span>
                            </button>
                            <div className="flex items-center gap-1">
                              {shape.type === 'text' && <Type size={12} className="text-slate-400" />}
                              {shape.type === 'image' && <ImageIcon size={12} className="text-slate-400" />}
                              {shape.type === 'rectangle' && <Square size={12} className="text-slate-400" />}
                              {shape.type === 'circle' && <CircleIcon size={12} className="text-slate-400" />}
                              {shape.type === 'line' && <Minus size={12} className="text-slate-400" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-4" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
            >
              <Layer>
                <Rect
                  x={0}
                  y={0}
                  width={stageSize.width}
                  height={stageSize.height}
                  fill={backgroundColor}
                />
                {/* Grid */}
                {showGrid && (
                  <>
                    {Array.from({ length: Math.ceil(stageSize.width / 20) }).map((_, i) => (
                      <Line
                        key={`v-${i}`}
                        points={[i * 20, 0, i * 20, stageSize.height]}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        listening={false}
                      />
                    ))}
                    {Array.from({ length: Math.ceil(stageSize.height / 20) }).map((_, i) => (
                      <Line
                        key={`h-${i}`}
                        points={[0, i * 20, stageSize.width, i * 20]}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        listening={false}
                      />
                    ))}
                  </>
                )}
                {shapes.map((shape) => {
                  const isSelected = shape.id === selectedShapeId;
                  const commonProps = {
                    id: shape.id,
                    x: shape.x,
                    y: shape.y,
                    draggable: tool === 'select',
                    onClick: handleShapeClick,
                    onDragEnd: handleShapeDragEnd,
                    fill: shape.fill || fillColor,
                    stroke: isSelected ? '#3b82f6' : (shape.stroke || strokeColor),
                    strokeWidth: isSelected ? 3 : (shape.strokeWidth || strokeWidth),
                    opacity: shape.opacity !== undefined ? shape.opacity : 1,
                    rotation: shape.rotation || 0,
                  };

                  if (shape.type === 'rectangle') {
                    return (
                      <Rect
                        key={shape.id}
                        {...commonProps}
                        width={shape.width || 0}
                        height={shape.height || 0}
                      />
                    );
                  } else if (shape.type === 'circle') {
                    return (
                      <Circle
                        key={shape.id}
                        {...commonProps}
                        radius={shape.radius || 0}
                      />
                    );
                  } else if (shape.type === 'text') {
                    return (
                      <Text
                        key={shape.id}
                        {...commonProps}
                        text={shape.text || ''}
                        fontSize={shape.fontSize || 24}
                        fontFamily={shape.fontFamily || 'Arial'}
                        fill={shape.fill || fillColor}
                      />
                    );
                  } else if (shape.type === 'line') {
                    return (
                      <Line
                        key={shape.id}
                        id={shape.id}
                        points={[shape.x, shape.y, (shape.x || 0) + (shape.width || 0), (shape.y || 0) + (shape.height || 0)]}
                        stroke={isSelected ? '#3b82f6' : (shape.stroke || strokeColor)}
                        strokeWidth={isSelected ? 3 : (shape.strokeWidth || strokeWidth)}
                        draggable={tool === 'select'}
                        onClick={handleShapeClick}
                        onDragEnd={handleShapeDragEnd}
                      />
                    );
                  } else if (shape.type === 'image' && shape.imageUrl) {
                    return (
                      <ImageShape
                        key={shape.id}
                        shape={shape}
                        isSelected={isSelected}
                        onDragEnd={handleShapeDragEnd}
                        onClick={handleShapeClick}
                        draggable={tool === 'select'}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default CanvaButton;

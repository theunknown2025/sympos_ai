import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ImageIcon,
} from 'lucide-react';
import PosterConfigurationSection from './PosterConfigurationSection';
import PosterIconBox from './PosterIconBox';
import PosterIconsAccordion from './PosterIconsAccordion';
import PosterImageBoxOverlay from './PosterImageBox';
import PosterImagesAccordion from './PosterImagesAccordion';
import PosterQrAccordion from './PosterQrAccordion';
import PosterQrBox from './PosterQrBox';
import PosterShapeBox from './PosterShapeBox';
import PosterShapesAccordion from './PosterShapesAccordion';
import PosterTextBox from './PosterTextBox';
import PosterTextsAccordion from './PosterTextsAccordion';
import PosterTemplateForm from './PosterTemplateForm';
import PosterToolbar from './PosterToolbar';
import { AiPosterPanel, AiPosterPreview, createDefaultAiPosterInfo } from './AiPoster';
import type { AiPosterGeneralInfo, AiPosterResult } from './AiPoster';
import { downloadAiPosterPdf, downloadAiPosterPng } from './AiPoster/exportAiPoster';
import { exportPosterPdf, exportPosterPng } from './exportPoster';
import { createDefaultPosterData } from './posterTemplateDefaults';
import { getPosterTemplate } from './posterTemplateRegistry';
import {
  createIconItem,
  createImageItem,
  createQrItem,
  createShapeItem,
  createTextItem,
  snapElementBox,
} from './posterElementFactory';
import { bringLayerToFront, layerZIndex, removeLayer } from './posterLayerUtils';
import {
  GRID_SPACING_OPTIONS,
  POSTER_FORMATS,
  PX_PER_MM,
  clampBox,
  gridStepPx,
  pageSizePx,
  snapToGrid,
  type GridSpacingId,
  type PosterFormatId,
} from './posterConstants';
import type {
  PosterElementBox,
  PosterElementKind,
  PosterIconItem,
  PosterImageBox,
  PosterImageItem,
  PosterLayerRef,
  PosterQrItem,
  PosterSelectedElement,
  PosterShapeItem,
  PosterShapeKind,
  PosterTextItem,
  PosterTextKind,
} from './types';
import type { PosterData, PosterEditorMode, PosterTemplateId } from './posterTemplateTypes';

const VIEWPORT_PADDING = 32;
type FitMode = 'horizontal' | 'vertical' | 'manual';

const SHAPE_LABELS: Record<PosterShapeKind, string> = {
  square: 'Square',
  circle: 'Circle',
  rectangle: 'Rectangle',
};

const PosterManager: React.FC = () => {
  const [selectedFormatId, setSelectedFormatId] = useState<PosterFormatId>('a4');
  const [gridSpacingId, setGridSpacingId] = useState<GridSpacingId>('10');
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>('horizontal');
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  const [layerOrder, setLayerOrder] = useState<PosterLayerRef[]>([]);
  const [shapesAccordionOpen, setShapesAccordionOpen] = useState(true);
  const [configAccordionOpen, setConfigAccordionOpen] = useState(true);
  const [imagesAccordionOpen, setImagesAccordionOpen] = useState(true);
  const [textsAccordionOpen, setTextsAccordionOpen] = useState(true);
  const [iconsAccordionOpen, setIconsAccordionOpen] = useState(true);
  const [qrAccordionOpen, setQrAccordionOpen] = useState(true);

  const [shapes, setShapes] = useState<PosterShapeItem[]>([]);
  const [images, setImages] = useState<PosterImageItem[]>([]);
  const [texts, setTexts] = useState<PosterTextItem[]>([]);
  const [icons, setIcons] = useState<PosterIconItem[]>([]);
  const [qrCodes, setQrCodes] = useState<PosterQrItem[]>([]);

  const [selectedElement, setSelectedElement] = useState<PosterSelectedElement>(null);
  const [expandedShapeId, setExpandedShapeId] = useState<string | null>(null);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [expandedTextId, setExpandedTextId] = useState<string | null>(null);
  const [expandedIconId, setExpandedIconId] = useState<string | null>(null);
  const [expandedQrId, setExpandedQrId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editorMode, setEditorMode] = useState<PosterEditorMode>('blank');
  const [templateId, setTemplateId] = useState<PosterTemplateId>('premium');
  const [posterData, setPosterData] = useState<PosterData>(() => createDefaultPosterData('premium'));
  const [aiPosterInfo, setAiPosterInfo] = useState<AiPosterGeneralInfo>(() => createDefaultAiPosterInfo());
  const [aiPosterResult, setAiPosterResult] = useState<AiPosterResult | null>(null);

  const selectedFormat =
    POSTER_FORMATS.find((format) => format.id === selectedFormatId) ?? POSTER_FORMATS[1];
  const gridMm =
    GRID_SPACING_OPTIONS.find((option) => option.id === gridSpacingId)?.mm ?? 10;
  const pagePx = pageSizePx(selectedFormat.widthMm, selectedFormat.heightMm);
  const gridStepPxScaled = gridStepPx(gridMm) * zoom;

  const computeFitZoom = useCallback(
    (mode: 'horizontal' | 'vertical') => {
      const viewport = viewportRef.current;
      if (!viewport) return 1;
      const availableWidth = Math.max(viewport.clientWidth - VIEWPORT_PADDING, 1);
      const availableHeight = Math.max(viewport.clientHeight - VIEWPORT_PADDING, 1);
      if (mode === 'horizontal') {
        return Math.min(Math.max(availableWidth / pagePx.width, 0.1), 3);
      }
      return Math.min(Math.max(availableHeight / pagePx.height, 0.1), 3);
    },
    [pagePx.width, pagePx.height],
  );

  const applyFit = useCallback(
    (mode: 'horizontal' | 'vertical') => {
      setFitMode(mode);
      setZoom(computeFitZoom(mode));
    },
    [computeFitZoom],
  );

  useLayoutEffect(() => {
    if (fitMode === 'manual') return;
    setZoom(computeFitZoom(fitMode));
  }, [fitMode, computeFitZoom, selectedFormatId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || fitMode === 'manual') return;
    const observer = new ResizeObserver(() => setZoom(computeFitZoom(fitMode)));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitMode, computeFitZoom]);

  useEffect(() => {
    const snap = (box: PosterElementBox) =>
      snapElementBox(box, pagePx.width, pagePx.height, gridMm);
    setShapes((current) => current.map((item) => ({ ...item, box: snap(item.box) })));
    setImages((current) => current.map((item) => ({ ...item, box: snap(item.box) })));
    setTexts((current) => current.map((item) => ({ ...item, box: snap(item.box) })));
    setIcons((current) => current.map((item) => ({ ...item, box: snap(item.box) })));
    setQrCodes((current) => current.map((item) => ({ ...item, box: snap(item.box) })));
  }, [pagePx.width, pagePx.height, selectedFormatId, gridMm]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (editorMode !== 'template') return;
    const href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Playfair+Display:wght@400;700&display=swap';
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [editorMode]);

  const handleEditorModeChange = (mode: PosterEditorMode) => {
    setEditorMode(mode);
    setSelectedElement(null);
    if (mode === 'template') {
      setPosterData(createDefaultPosterData(templateId));
    }
    if (mode === 'ai') {
      setAiPosterResult(null);
      setAiPosterInfo((current) =>
        Array.isArray((current as { themes?: string[] }).themes) &&
        typeof (current as { about?: string }).about === 'string'
          ? current
          : createDefaultAiPosterInfo(),
      );
    }
  };

  const handleTemplateIdChange = (id: PosterTemplateId) => {
    setTemplateId(id);
    setPosterData(createDefaultPosterData(id));
  };

  const updatePosterData = (patch: Partial<PosterData>) => {
    setPosterData((current) => ({ ...current, ...patch }));
  };

  const activeTemplate = getPosterTemplate(templateId);
  const TemplateComponent = activeTemplate.Component;

  const pushLayer = (ref: PosterLayerRef) => {
    setLayerOrder((current) => bringLayerToFront(current, ref));
  };

  const clearExpanded = () => {
    setExpandedShapeId(null);
    setExpandedImageId(null);
    setExpandedTextId(null);
    setExpandedIconId(null);
    setExpandedQrId(null);
  };

  const openAccordionFor = (kind: PosterElementKind) => {
    setShapesAccordionOpen(kind === 'shape');
    setImagesAccordionOpen(kind === 'image');
    setTextsAccordionOpen(kind === 'text');
    setIconsAccordionOpen(kind === 'icon');
    setQrAccordionOpen(kind === 'qrcode');
  };

  const selectElement = (kind: PosterElementKind, id: string, expand = true) => {
    pushLayer({ kind, id });
    setSelectedElement({ kind, id });
    clearExpanded();
    openAccordionFor(kind);
    if (expand) {
      if (kind === 'shape') setExpandedShapeId(id);
      if (kind === 'image') setExpandedImageId(id);
      if (kind === 'text') setExpandedTextId(id);
      if (kind === 'icon') setExpandedIconId(id);
      if (kind === 'qrcode') setExpandedQrId(id);
    }
  };

  const editElement = (kind: PosterElementKind, id: string) => {
    selectElement(kind, id, true);
  };

  const removeElement = (kind: PosterElementKind, id: string) => {
    setLayerOrder((current) => removeLayer(current, kind, id));
    if (kind === 'shape') {
      setShapes((current) => current.filter((item) => item.id !== id));
      setExpandedShapeId((current) => (current === id ? null : current));
    }
    if (kind === 'image') {
      const existingUrl = objectUrlsRef.current.get(id);
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl);
        objectUrlsRef.current.delete(id);
      }
      setImages((current) => current.filter((item) => item.id !== id));
      setExpandedImageId((current) => (current === id ? null : current));
    }
    if (kind === 'text') {
      setTexts((current) => current.filter((item) => item.id !== id));
      setExpandedTextId((current) => (current === id ? null : current));
    }
    if (kind === 'icon') {
      setIcons((current) => current.filter((item) => item.id !== id));
      setExpandedIconId((current) => (current === id ? null : current));
    }
    if (kind === 'qrcode') {
      setQrCodes((current) => current.filter((item) => item.id !== id));
      setExpandedQrId((current) => (current === id ? null : current));
    }
    setSelectedElement((current) =>
      current?.kind === kind && current.id === id ? null : current,
    );
  };

  const handleZoomChange = (value: number) => {
    setFitMode('manual');
    setZoom(value);
  };

  const nudgeZoom = (delta: number) => {
    handleZoomChange(Math.min(3, Math.max(0.1, zoom + delta)));
  };

  const updateShape = (id: string, patch: Partial<PosterShapeItem>) => {
    setShapes((current) =>
      current.map((shape) => {
        if (shape.id !== id) return shape;
        const next = { ...shape, ...patch };
        if (patch.kind && patch.kind !== shape.kind) {
          next.label = `${SHAPE_LABELS[patch.kind]} ${shape.label.split(' ').pop() ?? '1'}`;
        }
        return next;
      }),
    );
  };

  const updateImage = (id: string, patch: Partial<PosterImageItem>) => {
    setImages((current) => current.map((image) => (image.id === id ? { ...image, ...patch } : image)));
  };

  const updateText = (id: string, patch: Partial<PosterTextItem>) => {
    setTexts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateIcon = (id: string, patch: Partial<PosterIconItem>) => {
    setIcons((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateQr = (id: string, patch: Partial<PosterQrItem>) => {
    setQrCodes((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateShapeBox = (id: string, box: PosterElementBox) => {
    setShapes((current) =>
      current.map((item) =>
        item.id === id ? { ...item, box: clampBox(box, pagePx.width, pagePx.height, gridMm) } : item,
      ),
    );
  };

  const updateImageBox = (id: string, box: PosterImageBox) => {
    setImages((current) =>
      current.map((item) =>
        item.id === id ? { ...item, box: clampBox(box, pagePx.width, pagePx.height, gridMm) } : item,
      ),
    );
  };

  const updateTextBox = (id: string, box: PosterElementBox) => {
    setTexts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, box: clampBox(box, pagePx.width, pagePx.height, gridMm) } : item,
      ),
    );
  };

  const updateIconBox = (id: string, box: PosterElementBox) => {
    setIcons((current) =>
      current.map((item) =>
        item.id === id ? { ...item, box: clampBox(box, pagePx.width, pagePx.height, gridMm) } : item,
      ),
    );
  };

  const updateQrBox = (id: string, box: PosterElementBox) => {
    setQrCodes((current) =>
      current.map((item) =>
        item.id === id ? { ...item, box: clampBox(box, pagePx.width, pagePx.height, gridMm) } : item,
      ),
    );
  };

  const updateBoxField = (
    kind: PosterElementKind,
    id: string,
    field: keyof PosterElementBox,
    mmValue: number,
    options?: { lockSquare?: boolean },
  ) => {
    const step = gridStepPx(gridMm);
    const pxValue = snapToGrid(mmValue * PX_PER_MM, step);

    const getBox = (): PosterElementBox | null => {
      if (kind === 'shape') return shapes.find((item) => item.id === id)?.box ?? null;
      if (kind === 'image') return images.find((item) => item.id === id)?.box ?? null;
      if (kind === 'text') return texts.find((item) => item.id === id)?.box ?? null;
      if (kind === 'icon') return icons.find((item) => item.id === id)?.box ?? null;
      return qrCodes.find((item) => item.id === id)?.box ?? null;
    };

    const box = getBox();
    if (!box) return;

    let next = { ...box, [field]: pxValue };
    const shape = kind === 'shape' ? shapes.find((item) => item.id === id) : null;
    const lockSquare =
      options?.lockSquare || shape?.kind === 'square' || shape?.kind === 'circle';
    if (lockSquare && (field === 'width' || field === 'height')) {
      const size = field === 'width' ? pxValue : next.width;
      next = { ...next, width: size, height: size };
    }

    if (kind === 'shape') updateShapeBox(id, next);
    if (kind === 'image') updateImageBox(id, next);
    if (kind === 'text') updateTextBox(id, next);
    if (kind === 'icon') updateIconBox(id, next);
    if (kind === 'qrcode') updateQrBox(id, next);
  };

  const addShape = (kind: PosterShapeKind) => {
    const count = shapes.filter((shape) => shape.kind === kind).length + 1;
    const next = createShapeItem(pagePx.width, pagePx.height, gridMm, kind, count);
    setShapes((current) => [...current, next]);
    selectElement('shape', next.id);
    setShapesAccordionOpen(true);
  };

  const addImage = () => {
    const next = createImageItem(pagePx.width, pagePx.height, gridMm, images.length + 1);
    setImages((current) => [...current, next]);
    selectElement('image', next.id);
    setImagesAccordionOpen(true);
  };

  const addText = (kind: PosterTextKind) => {
    const count = texts.filter((item) => item.kind === kind).length + 1;
    const next = createTextItem(pagePx.width, pagePx.height, gridMm, kind, count);
    setTexts((current) => [...current, next]);
    selectElement('text', next.id);
    setTextsAccordionOpen(true);
  };

  const addIcon = () => {
    const next = createIconItem(pagePx.width, pagePx.height, gridMm, icons.length + 1);
    setIcons((current) => [...current, next]);
    selectElement('icon', next.id);
    setIconsAccordionOpen(true);
  };

  const addQr = () => {
    const next = createQrItem(pagePx.width, pagePx.height, gridMm, qrCodes.length + 1);
    setQrCodes((current) => [...current, next]);
    selectElement('qrcode', next.id);
    setQrAccordionOpen(true);
  };

  const runExport = async (kind: 'png' | 'pdf') => {
    if (exporting) return;

    if (editorMode === 'ai') {
      if (!aiPosterResult?.imageDataUrl) {
        // Fall through to canvas capture of the draft preview
      } else {
        setExporting(true);
        try {
          const fileBase = (aiPosterInfo.title || 'ai-poster').replace(/[^\w\-]+/g, '_').slice(0, 48);
          if (kind === 'png') {
            await downloadAiPosterPng(aiPosterResult.imageDataUrl, `${fileBase}.png`);
          } else {
            await downloadAiPosterPdf(
              aiPosterResult.imageDataUrl,
              `${fileBase}.pdf`,
              selectedFormat.widthMm,
              selectedFormat.heightMm,
            );
          }
        } finally {
          setExporting(false);
        }
        return;
      }
    }

    if (!pageRef.current) return;
    setExporting(true);
    const prevZoom = zoom;
    const prevFitMode = fitMode;
    const prevSelected = selectedElement;
    try {
      setSelectedElement(null);
      setFitMode('manual');
      setZoom(1);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const fileBase = `poster-${selectedFormat.label.toLowerCase()}`;
      if (kind === 'png') {
        await exportPosterPng(pageRef.current, fileBase);
      } else {
        await exportPosterPdf(
          pageRef.current,
          fileBase,
          selectedFormat.widthMm,
          selectedFormat.heightMm,
        );
      }
    } finally {
      setZoom(prevZoom);
      setFitMode(prevFitMode);
      setSelectedElement(prevSelected);
      setExporting(false);
    }
  };

  const handleImageFile = (id: string, file: File) => {
    const existingUrl = objectUrlsRef.current.get(id);
    if (existingUrl) URL.revokeObjectURL(existingUrl);
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.set(id, url);
    updateImage(id, { imageSrc: url, cropX: 50, cropY: 50 });
  };

  const shapeMap = new Map(shapes.map((item) => [item.id, item]));
  const imageMap = new Map(images.map((item) => [item.id, item]));
  const textMap = new Map(texts.map((item) => [item.id, item]));
  const iconMap = new Map(icons.map((item) => [item.id, item]));
  const qrMap = new Map(qrCodes.map((item) => [item.id, item]));

  const renderLayer = (ref: PosterLayerRef) => {
    const zIndex = layerZIndex(layerOrder, ref.kind, ref.id);
    const common = {
      zoom,
      zIndex,
      pageWidth: pagePx.width,
      pageHeight: pagePx.height,
      pageRef,
      gridMm,
      onSelect: () => selectElement(ref.kind, ref.id),
      onEdit: () => editElement(ref.kind, ref.id),
      onDelete: () => removeElement(ref.kind, ref.id),
    };

    if (ref.kind === 'shape') {
      const shape = shapeMap.get(ref.id);
      if (!shape) return null;
      return (
        <PosterShapeBox
          key={`shape-${ref.id}`}
          shape={shape}
          isSelected={selectedElement?.kind === 'shape' && selectedElement.id === ref.id}
          onChange={(box) => updateShapeBox(ref.id, box)}
          {...common}
        />
      );
    }
    if (ref.kind === 'image') {
      const image = imageMap.get(ref.id);
      if (!image) return null;
      return (
        <PosterImageBoxOverlay
          key={`image-${ref.id}`}
          box={image.box}
          isSelected={selectedElement?.kind === 'image' && selectedElement.id === ref.id}
          imageSrc={image.imageSrc}
          cropX={image.cropX}
          cropY={image.cropY}
          label={image.label}
          onChange={(box) => updateImageBox(ref.id, box)}
          {...common}
        />
      );
    }
    if (ref.kind === 'text') {
      const text = textMap.get(ref.id);
      if (!text) return null;
      return (
        <PosterTextBox
          key={`text-${ref.id}`}
          item={text}
          isSelected={selectedElement?.kind === 'text' && selectedElement.id === ref.id}
          onChange={(box) => updateTextBox(ref.id, box)}
          {...common}
        />
      );
    }
    if (ref.kind === 'icon') {
      const icon = iconMap.get(ref.id);
      if (!icon) return null;
      return (
        <PosterIconBox
          key={`icon-${ref.id}`}
          item={icon}
          isSelected={selectedElement?.kind === 'icon' && selectedElement.id === ref.id}
          onChange={(box) => updateIconBox(ref.id, box)}
          {...common}
        />
      );
    }
    const qr = qrMap.get(ref.id);
    if (!qr) return null;
    return (
      <PosterQrBox
        key={`qrcode-${ref.id}`}
        item={qr}
        isSelected={selectedElement?.kind === 'qrcode' && selectedElement.id === ref.id}
        onChange={(box) => updateQrBox(ref.id, box)}
        {...common}
      />
    );
  };

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      <header className="shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="text-indigo-600" />
          Poster Manager
        </h1>
      </header>

      <div className="flex flex-1 gap-4 min-h-0">
        <aside className="w-[30%] min-w-[14rem] shrink-0 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <PosterConfigurationSection
            open={configAccordionOpen}
            onToggle={() => setConfigAccordionOpen((open) => !open)}
            editorMode={editorMode}
            onEditorModeChange={handleEditorModeChange}
            templateId={templateId}
            onTemplateIdChange={handleTemplateIdChange}
            selectedFormatId={selectedFormatId}
            onFormatChange={setSelectedFormatId}
            gridSpacingId={gridSpacingId}
            onGridSpacingChange={setGridSpacingId}
          />

          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900">
              {editorMode === 'blank'
                ? 'Components'
                : editorMode === 'ai'
                  ? 'AI Poster'
                  : 'Template content'}
            </h2>
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 min-h-0 overflow-y-auto space-y-3">
              {editorMode === 'ai' ? (
                <AiPosterPanel
                  info={aiPosterInfo}
                  onInfoChange={setAiPosterInfo}
                  result={aiPosterResult}
                  onResultChange={setAiPosterResult}
                  formatId={selectedFormatId}
                  widthPx={pagePx.width}
                  heightPx={pagePx.height}
                  widthMm={selectedFormat.widthMm}
                  heightMm={selectedFormat.heightMm}
                  exporting={exporting}
                  onExportingChange={setExporting}
                />
              ) : editorMode === 'template' ? (
                <PosterTemplateForm data={posterData} onChange={updatePosterData} />
              ) : (
                <>
              <PosterShapesAccordion
                open={shapesAccordionOpen}
                onToggle={() => setShapesAccordionOpen((open) => !open)}
                shapes={shapes}
                selectedShapeId={selectedElement?.kind === 'shape' ? selectedElement.id : null}
                expandedShapeId={expandedShapeId}
                gridMm={gridMm}
                onAddShape={addShape}
                onSelectShape={(id) => selectElement('shape', id)}
                onToggleShape={(id) => setExpandedShapeId((current) => (current === id ? null : id))}
                onUpdateShape={updateShape}
                onUpdateBoxField={(id, field, mm) => updateBoxField('shape', id, field, mm)}
                onDeleteShape={(id) => removeElement('shape', id)}
              />

              <PosterImagesAccordion
                open={imagesAccordionOpen}
                onToggle={() => setImagesAccordionOpen((open) => !open)}
                images={images}
                selectedImageId={selectedElement?.kind === 'image' ? selectedElement.id : null}
                expandedImageId={expandedImageId}
                onAddImage={addImage}
                onSelectImage={(id) => selectElement('image', id)}
                onToggleImage={(id) => setExpandedImageId((current) => (current === id ? null : id))}
                onUpdateImage={updateImage}
                onUpdateBoxField={(id, field, mm) => updateBoxField('image', id, field, mm)}
                onImageFile={handleImageFile}
                onDeleteImage={(id) => removeElement('image', id)}
                gridMm={gridMm}
              />

              <PosterTextsAccordion
                open={textsAccordionOpen}
                onToggle={() => setTextsAccordionOpen((open) => !open)}
                items={texts}
                selectedId={selectedElement?.kind === 'text' ? selectedElement.id : null}
                expandedId={expandedTextId}
                gridMm={gridMm}
                onAdd={addText}
                onSelect={(id) => selectElement('text', id)}
                onToggleItem={(id) => setExpandedTextId((current) => (current === id ? null : id))}
                onUpdate={updateText}
                onUpdateBoxField={(id, field, mm) => updateBoxField('text', id, field, mm)}
                onDelete={(id) => removeElement('text', id)}
              />

              <PosterIconsAccordion
                open={iconsAccordionOpen}
                onToggle={() => setIconsAccordionOpen((open) => !open)}
                items={icons}
                selectedId={selectedElement?.kind === 'icon' ? selectedElement.id : null}
                expandedId={expandedIconId}
                gridMm={gridMm}
                onAdd={addIcon}
                onSelect={(id) => selectElement('icon', id)}
                onToggleItem={(id) => setExpandedIconId((current) => (current === id ? null : id))}
                onUpdate={updateIcon}
                onUpdateBoxField={(id, field, mm) =>
                  updateBoxField('icon', id, field, mm, { lockSquare: true })
                }
                onDelete={(id) => removeElement('icon', id)}
              />

              <PosterQrAccordion
                open={qrAccordionOpen}
                onToggle={() => setQrAccordionOpen((open) => !open)}
                items={qrCodes}
                selectedId={selectedElement?.kind === 'qrcode' ? selectedElement.id : null}
                expandedId={expandedQrId}
                gridMm={gridMm}
                onAdd={addQr}
                onSelect={(id) => selectElement('qrcode', id)}
                onToggleItem={(id) => setExpandedQrId((current) => (current === id ? null : id))}
                onUpdate={updateQr}
                onUpdateBoxField={(id, field, mm) =>
                  updateBoxField('qrcode', id, field, mm, { lockSquare: true })
                }
                onDelete={(id) => removeElement('qrcode', id)}
              />
                </>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
          <PosterToolbar
            zoom={zoom}
            fitMode={fitMode}
            exporting={exporting}
            onZoomChange={handleZoomChange}
            onNudgeZoom={nudgeZoom}
            onFitHorizontal={() => applyFit('horizontal')}
            onFitVertical={() => applyFit('vertical')}
            onExportPng={() => runExport('png')}
            onExportPdf={() => runExport('pdf')}
          />

          <div ref={viewportRef} className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-slate-100 overflow-auto" onMouseDown={() => editorMode === 'blank' && setSelectedElement(null)}>
            <div className="min-h-full min-w-full flex items-center justify-center p-4">
              <div
                ref={pageRef}
                data-poster-page
                className="relative bg-white shadow-lg border border-slate-300 shrink-0 overflow-hidden"
                style={
                  editorMode === 'blank'
                    ? {
                        width: pagePx.width * zoom,
                        height: pagePx.height * zoom,
                        backgroundImage: `
                    linear-gradient(to right, rgb(203 213 225) 1px, transparent 1px),
                    linear-gradient(to bottom, rgb(203 213 225) 1px, transparent 1px)
                  `,
                        backgroundSize: `${gridStepPxScaled}px ${gridStepPxScaled}px`,
                      }
                    : {
                        width: pagePx.width * zoom,
                        height: pagePx.height * zoom,
                      }
                }
              >
                {editorMode === 'blank' ? (
                  <>
                <div
                  data-poster-export-hide
                  className="absolute top-3 left-3 rounded-md bg-white/90 border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm z-[100] pointer-events-none"
                >
                  {selectedFormat.label} · {selectedFormat.widthMm} × {selectedFormat.heightMm} mm · {gridMm} mm grid
                </div>
                {layerOrder.map((ref) => renderLayer(ref))}
                  </>
                ) : editorMode === 'ai' ? (
                  <div
                    style={{
                      width: pagePx.width,
                      height: pagePx.height,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <AiPosterPreview
                      info={aiPosterInfo}
                      result={aiPosterResult}
                      width={pagePx.width}
                      height={pagePx.height}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: pagePx.width,
                      height: pagePx.height,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <TemplateComponent data={posterData} width={pagePx.width} height={pagePx.height} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PosterManager;

'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface PreviewProps {
  pages: string[]; // Base64 encoded PNGs
  documentType: 'document' | 'slides';
  onExportPdf: () => void;
  isExporting: boolean;
  error?: string | null;
}

export default function Preview({
  pages,
  documentType,
  onExportPdf,
  isExporting,
  error,
}: PreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalPages = pages.length;

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.25));
  };

  if (pages.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#111] text-gray-400">
        <div className={`${documentType === 'slides' ? 'slide-preview' : 'doc-preview'}
                        w-3/4 max-w-2xl flex items-center justify-center border-2 border-dashed
                        border-gray-700 rounded-lg`}>
          <p className="text-center p-8">
            Your {documentType === 'slides' ? 'presentation' : 'document'} preview will appear here
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#111] text-red-400 p-8">
        <div className="max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2">Compilation Error</h3>
          <pre className="text-sm text-left bg-red-950/50 p-4 rounded-lg overflow-auto max-h-64">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[#111] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400 min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-vibe-600 hover:bg-vibe-500
                     rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
        <div
          className="preview-container transition-transform origin-top"
          style={{ transform: `scale(${zoom})` }}
        >
          {pages[currentPage] && (
            <img
              src={`data:image/png;base64,${pages[currentPage]}`}
              alt={`Page ${currentPage + 1}`}
              className={`${documentType === 'slides' ? 'max-w-4xl' : 'max-w-2xl'}
                         rounded-lg shadow-2xl`}
            />
          )}
        </div>
      </div>

      {/* Thumbnail strip for slides */}
      {documentType === 'slides' && totalPages > 1 && (
        <div className="flex gap-2 p-4 border-t border-white/10 overflow-x-auto bg-[#0a0a0a]">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                        ${currentPage === index ? 'border-vibe-500' : 'border-transparent hover:border-white/20'}`}
            >
              <img
                src={`data:image/png;base64,${page}`}
                alt={`Slide ${index + 1}`}
                className="w-24 h-auto"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileText,
  Presentation,
  Loader2,
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
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className={`${documentType === 'slides' ? 'slide-preview' : 'doc-preview'}
                        w-3/4 max-w-2xl flex flex-col items-center justify-center
                        glass-card rounded-2xl`}>
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            {documentType === 'slides' ? (
              <Presentation className="w-8 h-8 text-gray-600" />
            ) : (
              <FileText className="w-8 h-8 text-gray-600" />
            )}
          </div>
          <p className="text-center text-gray-500">
            Your {documentType === 'slides' ? 'presentation' : 'document'} will appear here
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-lg glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-red-400">Compilation Error</h3>
          <pre className="text-sm text-left text-red-300/80 bg-red-950/30 p-4 rounded-xl
                        overflow-auto max-h-64 border border-red-500/20">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#050508]' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 glass">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-sm text-gray-500 min-w-[4rem] text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 glass-card rounded-lg px-2 py-1">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 min-w-[3rem] text-center">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
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
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 glass-button
                     rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
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
                         rounded-xl shadow-2xl`}
            />
          )}
        </div>
      </div>

      {/* Thumbnail strip for slides */}
      {documentType === 'slides' && totalPages > 1 && (
        <div className="flex gap-3 p-4 glass overflow-x-auto">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`flex-shrink-0 rounded-xl overflow-hidden transition-all
                        ${currentPage === index
                          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#050508] shadow-lg glow-indigo'
                          : 'opacity-60 hover:opacity-100'}`}
            >
              <img
                src={`data:image/png;base64,${page}`}
                alt={`Slide ${index + 1}`}
                className="w-28 h-auto rounded-lg"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

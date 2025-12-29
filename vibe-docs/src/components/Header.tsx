'use client';

import { FileText, Presentation, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  documentType: 'document' | 'slides';
  onTypeChange: (type: 'document' | 'slides') => void;
  onNewDocument: () => void;
}

export default function Header({
  documentType,
  onTypeChange,
  onNewDocument,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0a]">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vibe-500 to-purple-600
                      flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="font-semibold text-lg">Vibe Docs</span>
      </div>

      {/* Document type toggle */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => onTypeChange('document')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${documentType === 'document'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'}`}
        >
          <FileText className="w-4 h-4" />
          Document
        </button>
        <button
          onClick={() => onTypeChange('slides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${documentType === 'slides'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'}`}
        >
          <Presentation className="w-4 h-4" />
          Slides
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewDocument}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10
                   rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>
    </header>
  );
}

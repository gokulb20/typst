'use client';

import { FileText, Presentation, Plus, Sparkles } from 'lucide-react';

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
    <header className="glass flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500
                      flex items-center justify-center shadow-lg glow-indigo">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg gradient-text">Office Vibes</span>
          <p className="text-xs text-gray-500">AI Document Creator</p>
        </div>
      </div>

      {/* Document type toggle */}
      <div className="flex items-center gap-1 p-1.5 glass-card rounded-xl">
        <button
          onClick={() => onTypeChange('document')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${documentType === 'document'
                      ? 'glass-button text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <FileText className="w-4 h-4" />
          Document
        </button>
        <button
          onClick={() => onTypeChange('slides')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${documentType === 'slides'
                      ? 'glass-button text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Presentation className="w-4 h-4" />
          Slides
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewDocument}
          className="flex items-center gap-2 px-5 py-2.5 glass-card hover:bg-white/10
                   rounded-xl transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>
    </header>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Chat from '@/components/Chat';
import Preview from '@/components/Preview';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedImage {
  path: string;
  data: string;
}

export default function Home() {
  const [documentType, setDocumentType] = useState<'document' | 'slides'>('slides');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [currentImages, setCurrentImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          documentType,
          existingCode: currentCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Build assistant message
      let messageContent = data.error
        ? `I generated the ${documentType === 'slides' ? 'slides' : 'document'}, but there was a compilation error. Let me try to fix it.`
        : `Done! I've ${currentCode ? 'updated' : 'created'} your ${documentType === 'slides' ? 'presentation' : 'document'}.`;

      if (data.imagesGenerated > 0) {
        messageContent += ` Generated ${data.imagesGenerated} image${data.imagesGenerated > 1 ? 's' : ''}.`;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update state
      setCurrentCode(data.code);
      if (data.images) {
        setCurrentImages(data.images);
      }
      if (data.pages && data.pages.length > 0) {
        setPages(data.pages);
      }
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [documentType, currentCode]);

  const handleExportPdf = useCallback(async () => {
    if (!currentCode) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          format: 'pdf',
          images: currentImages,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentType === 'slides' ? 'presentation.pdf' : 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [currentCode, currentImages, documentType]);

  const handleNewDocument = useCallback(() => {
    setMessages([]);
    setPages([]);
    setCurrentCode('');
    setCurrentImages([]);
    setError(null);
  }, []);

  const handleTypeChange = useCallback((type: 'document' | 'slides') => {
    setDocumentType(type);
    // Reset when switching types
    if (type !== documentType) {
      handleNewDocument();
    }
  }, [documentType, handleNewDocument]);

  return (
    <div className="flex flex-col h-screen">
      <Header
        documentType={documentType}
        onTypeChange={handleTypeChange}
        onNewDocument={handleNewDocument}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat sidebar */}
        <div className="w-[400px] min-w-[350px] max-w-[500px] border-r border-white/10">
          <Chat
            documentType={documentType}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            messages={messages}
            setMessages={setMessages}
          />
        </div>

        {/* Preview area */}
        <div className="flex-1">
          <Preview
            pages={pages}
            documentType={documentType}
            onExportPdf={handleExportPdf}
            isExporting={isExporting}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

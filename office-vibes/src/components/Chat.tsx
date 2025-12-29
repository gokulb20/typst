'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, FileText, Presentation } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  documentType: 'document' | 'slides';
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function Chat({
  documentType,
  onGenerate,
  isGenerating,
  messages,
  setMessages,
}: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    await onGenerate(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = documentType === 'slides'
    ? [
        'Create a pitch deck for my AI startup',
        'Make a quarterly business review presentation',
        'Design a product launch announcement',
        'Build a team introduction slideshow',
      ]
    : [
        'Write a professional proposal document',
        'Create a technical specification',
        'Draft a project status report',
        'Make a beautiful resume',
      ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vibe-500 to-purple-600 flex items-center justify-center mb-6">
              {documentType === 'slides' ? (
                <Presentation className="w-8 h-8 text-white" />
              ) : (
                <FileText className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {documentType === 'slides' ? 'Create Slides' : 'Create Document'}
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Describe what you want to create and I'll generate it for you instantly.
            </p>

            {/* Suggestions */}
            <div className="grid gap-2 w-full max-w-md">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10
                           border border-white/10 transition-all text-sm text-gray-300
                           hover:border-vibe-500/50"
                >
                  <Sparkles className="w-4 h-4 inline mr-2 text-vibe-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-animate flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-vibe-600 text-white'
                      : 'bg-white/10 text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="message-animate flex justify-start">
                <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-vibe-400" />
                  <span className="text-gray-400">
                    Generating your {documentType === 'slides' ? 'slides' : 'document'}...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Describe your ${documentType === 'slides' ? 'presentation' : 'document'}...`}
            rows={1}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12
                     text-white placeholder-gray-500 resize-none
                     focus:outline-none focus:ring-2 focus:ring-vibe-500 focus:border-transparent
                     transition-all"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-vibe-600 text-white
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-vibe-500 transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

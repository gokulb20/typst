'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, FileText, Presentation, Wand2 } from 'lucide-react';

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
        'Make a quarterly business review',
        'Design a product launch deck',
        'Build a team intro slideshow',
      ]
    : [
        'Write a professional proposal',
        'Create a technical spec',
        'Draft a project report',
        'Make a beautiful resume',
      ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500
                          flex items-center justify-center mb-6 shadow-2xl glow-purple">
              {documentType === 'slides' ? (
                <Presentation className="w-10 h-10 text-white" />
              ) : (
                <FileText className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2 gradient-text">
              {documentType === 'slides' ? 'Create Slides' : 'Create Document'}
            </h2>
            <p className="text-gray-400 mb-8 max-w-sm">
              Describe what you want and watch the magic happen.
            </p>

            {/* Suggestions */}
            <div className="grid gap-3 w-full max-w-sm">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-4 py-3 rounded-xl glass-card hover:bg-white/5
                           transition-all text-sm text-gray-300 group"
                >
                  <Wand2 className="w-4 h-4 inline mr-2 text-indigo-400 group-hover:text-indigo-300" />
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
                      ? 'glass-button'
                      : 'glass-card'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="message-animate flex justify-start">
                <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500
                                flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-400 text-sm">
                    Creating your {documentType === 'slides' ? 'slides' : 'document'}...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Describe your ${documentType === 'slides' ? 'presentation' : 'document'}...`}
            rows={1}
            className="w-full glass-input rounded-xl px-4 py-3 pr-14
                     text-white placeholder-gray-500 resize-none
                     focus:outline-none"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 bottom-2 p-2.5 rounded-lg glass-button
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

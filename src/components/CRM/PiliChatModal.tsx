// PiliChatModal - Modal para mostrar el chat con Pili

import { useState } from 'react';
import { PiliChat } from './PiliChat';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PiliChatModalProps {
  variant?: 'header' | 'floating';
}

export function PiliChatModal({ variant = 'floating' }: PiliChatModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'header') {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          aria-label="Abrir chat con Pili"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl h-[80vh] bg-white rounded-lg shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Chat con Pili</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PiliChat className="h-full" />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center z-40 transition-transform hover:scale-110"
        aria-label="Abrir chat con Pili"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl h-[80vh] bg-white rounded-lg shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Chat con Pili</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PiliChat className="h-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}







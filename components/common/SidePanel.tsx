import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface SidePanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({ children, isOpen, onClose, title }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Side Panel */}
      <div 
        ref={panelRef} 
        className={`fixed top-0 left-0 z-50 h-full w-full max-w-lg bg-[var(--surface-1)] shadow-2xl border-r border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out ${
            isOpen ? 'transform-none' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
      >
        <header className="flex items-center justify-between p-4 border-b border-[var(--border)] flex-shrink-0">
            <h2 id="side-panel-title" className="font-heading text-3xl text-[var(--text-main)]">{title}</h2>
            <button 
                onClick={onClose} 
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                aria-label="Close"
            >
                <CloseIcon className="w-6 h-6" />
            </button>
        </header>
        <div className="p-6 flex-1 overflow-y-auto">
            {children}
        </div>
      </div>
    </>
  );
};
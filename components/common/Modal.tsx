import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        // Use mousedown to prevent closing when dragging from inside to outside
        document.addEventListener('mousedown', handleClickOutside);
        
        // Prevent body from scrolling
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fade-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef} 
        className="bg-[var(--surface-modal)] rounded-xl shadow-lg border border-[var(--border)] w-full max-w-4xl m-4 relative animate-slide-up"
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors z-10"
            aria-label="Close"
        >
            <CloseIcon className="w-6 h-6" />
        </button>
        <div className="p-6 sm:p-8">
            {children}
        </div>
      </div>
    </div>
  );
};
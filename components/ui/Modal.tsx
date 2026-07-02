import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.4)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                style={{ 
                    background: '#fff', 
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #e2e5ea' }}>
                    <h2 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: '#9ca3af' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f3f6'; e.currentTarget.style.color = '#374151'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

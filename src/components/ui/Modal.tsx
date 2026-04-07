import React from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer, maxWidth = 'max-w-2xl' }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-200">
            <div className={`bg-white w-full ${maxWidth} rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh]`}>
                <header className="p-6 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                    {children}
                </div>
                {footer && (
                    <footer className="p-6 md:p-8 bg-slate-50 border-t shrink-0">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

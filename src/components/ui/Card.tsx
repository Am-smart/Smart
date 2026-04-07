import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-6 md:p-8' }) => {
    return (
        <div className={`bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 ${padding} ${className}`}>
            {children}
        </div>
    );
};

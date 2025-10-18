import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { theme } from '../../styles/theme';
import { typography } from '../../styles/typography';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  className = '',
  variant = 'default'
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  const variants = {
    default: 'bg-slate-900/95 border-slate-700/50',
    dark: 'bg-slate-950/95 border-slate-800/50',
    glass: 'bg-slate-900/80 backdrop-blur-xl border-slate-700/30'
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className={`
        ${variants[variant]} 
        text-white 
        rounded-xl 
        shadow-2xl 
        w-full 
        ${sizes[size]} 
        max-h-[90vh] 
        overflow-hidden 
        border 
        animate-in 
        zoom-in-95 
        duration-200
        ${className}
      `}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50">
            {title && (
              <h2 className={`${typography.presets.heading.h2} text-white flex items-center gap-2`}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={X}
                className="p-2 hover:bg-slate-700/50 text-slate-400 hover:text-white"
              />
            )}
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
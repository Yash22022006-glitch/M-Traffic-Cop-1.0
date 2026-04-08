
import React from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className={`relative bg-gray-800 w-full mx-auto rounded-lg shadow-2xl z-50 transform transition-all ${sizeClasses[size]}`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b border-gray-700 rounded-t ${size === 'xs' ? 'p-3' : 'p-5'}`}>
          <h3 className={`${size === 'xs' ? 'text-lg' : 'text-xl'} font-semibold text-white`}>{title}</h3>
          <button
            className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-white float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
            onClick={onClose}
          >
            <span className="h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
          </button>
        </div>
        {/* Modal Body */}
        <div className={`relative flex-auto text-white ${size === 'xs' ? 'p-4' : 'p-6'}`}>
          {children}
        </div>
        {/* Modal Footer */}
        <div className={`flex items-center justify-end border-t border-gray-700 rounded-b ${size === 'xs' ? 'p-3' : 'p-6'}`}>
          {footer ? (
            <>
              {footer}
              <Button 
                onClick={onClose} 
                variant="ghost"
                className="ml-2"
                size={size === 'xs' ? 'sm' : 'md'}
              >
                Close
              </Button>
            </>
          ) : (
            <Button 
              onClick={onClose} 
              variant="secondary"
              size={size === 'xs' ? 'sm' : 'md'}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

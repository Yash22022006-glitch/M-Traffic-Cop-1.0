import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';

interface ToastNotificationProps {
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number; // in milliseconds
  onClose?: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  duration = 2000, // Default to 2 seconds
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  // All types now use a black background with white text
  const typeStyles = {
    info: 'bg-black text-white',
    success: 'bg-black text-white',
    error: 'bg-black text-white',
  };

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-[100] transition-opacity ease-out duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-xs mx-auto text-center
          ${typeStyles[type]}
        `}
      >
        <span>{message}</span>
        {/* Removed close button to enforce 2-second duration for this specific request */}
        {/* <Button variant="ghost" size="sm" onClick={handleClose} className="!text-white hover:!bg-white hover:!bg-opacity-20 !p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button> */}
      </div>
    </div>,
    document.body
  );
};

export default ToastNotification;
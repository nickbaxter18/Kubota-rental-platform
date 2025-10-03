'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ToastIcons = {
  success: '✓',
  error: '⚠',
  warning: '!',
  info: 'ℹ',
};

const ToastColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const entranceTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, id]); // Add id to dependencies to ensure cleanup on prop changes

  const handleClose = () => {
    if (isLeaving) return; // Prevent multiple close attempts
    setIsLeaving(true);
    // Use requestAnimationFrame for better test compatibility
    const animationTimer = setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration

    return () => clearTimeout(animationTimer);
  };

  return (
    <div
      className={`toast ${ToastColors[type]} transform transition-all duration-300 ease-in-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : '-translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg font-bold">
            {ToastIcons[type]}
          </span>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">
            {title}
          </p>
          {message && (
            <p className="mt-1 text-sm opacity-90">
              {message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleClose}
            className="inline-flex rounded-md opacity-75 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="toast-container">
      {children}
    </div>
  );
}

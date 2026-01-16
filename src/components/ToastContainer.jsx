import React from 'react';
import { Toaster } from 'sonner';

export const ToastContainer = () => {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 3000,
        className: 'toast-modern',
        style: {
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        },
        success: {
          style: {
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
        },
        error: {
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
        },
        loading: {
          style: {
            border: '1px solid rgba(139, 92, 246, 0.3)',
          },
        },
      }}
    />
  );
};

export default ToastContainer;

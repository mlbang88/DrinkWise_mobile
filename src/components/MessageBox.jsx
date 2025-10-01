import React from 'react';
import { XCircle } from 'lucide-react';

const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;
    
    const getTypeStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.8))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                };
            case 'error':
                return {
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.8))',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)'
                };
            case 'info':
                return {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(29, 78, 216, 0.8))',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, rgba(75, 85, 99, 0.9), rgba(55, 65, 81, 0.8))',
                    border: '1px solid rgba(75, 85, 99, 0.4)',
                    boxShadow: '0 8px 25px rgba(75, 85, 99, 0.3)'
                };
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 20px',
            borderRadius: '20px',
            backdropFilter: 'blur(15px)',
            color: 'white',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: '300px',
            maxWidth: '90vw',
            fontSize: '15px',
            fontWeight: '600',
            ...getTypeStyles(type)
        }}>
            <span style={{ flex: 1, marginRight: '12px' }}>{message}</span>
            <button 
                onClick={onClose} 
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                <XCircle size={18} />
            </button>
        </div>
    );
};

export default MessageBox;
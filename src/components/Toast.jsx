import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            case 'warning': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return {
                bg: 'rgba(16, 185, 129, 0.95)',
                border: '#10b981',
                text: '#ffffff'
            };
            case 'error': return {
                bg: 'rgba(239, 68, 68, 0.95)',
                border: '#ef4444',
                text: '#ffffff'
            };
            case 'warning': return {
                bg: 'rgba(245, 158, 11, 0.95)',
                border: '#f59e0b',
                text: '#ffffff'
            };
            default: return {
                bg: 'rgba(59, 130, 246, 0.95)',
                border: '#3b82f6',
                text: '#ffffff'
            };
        }
    };

    if (!isVisible) return null;

    const colors = getColors();

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: `translateX(-50%) scale(${isClosing ? 0.9 : 1})`,
            zIndex: 10000,
            maxWidth: '90vw',
            minWidth: '300px',
            backgroundColor: colors.bg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: colors.text,
            fontSize: '15px',
            fontWeight: '500',
            opacity: isClosing ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: isClosing ? undefined : 'toastSlideIn 0.4s ease-out'
        }}>
            <div style={{ 
                color: colors.text, 
                display: 'flex', 
                alignItems: 'center',
                flexShrink: 0
            }}>
                {getIcon()}
            </div>
            
            <div style={{ 
                flex: 1, 
                lineHeight: '1.4',
                wordBreak: 'break-word'
            }}>
                {message}
            </div>
            
            <button
                onClick={handleClose}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px',
                    color: colors.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                <X size={16} />
            </button>

            {/* Barre de progression */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '0 0 12px 12px',
                animation: `toastProgress ${duration}ms linear`,
                transformOrigin: 'left'
            }} />
        </div>
    );
};

export default Toast;
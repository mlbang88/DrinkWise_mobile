// FeedbackOverlay.jsx - Système de feedback visuel avancé Phase 2C
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Loader } from 'lucide-react';

const FeedbackOverlay = ({ 
    isVisible, 
    type = 'loading', // 'loading', 'success', 'error', 'warning', 'info'
    title = '',
    message = '',
    onClose = null,
    autoClose = true,
    duration = 3000,
    showProgress = false
}) => {
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isVisible) {
            setIsAnimatingIn(true);
            setIsAnimatingOut(false);
            setProgress(0);
            
            if (autoClose && type !== 'loading' && duration > 0) {
                const progressInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(progressInterval);
                            handleClose();
                            return 100;
                        }
                        return prev + (100 / (duration / 50));
                    });
                }, 50);

                return () => clearInterval(progressInterval);
            }
        } else {
            setIsAnimatingIn(false);
            setIsAnimatingOut(true);
        }
    }, [isVisible, autoClose, duration, type]);

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300);
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.9))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
                    iconColor: '#ffffff',
                    icon: CheckCircle
                };
            case 'error':
                return {
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.9))',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
                    iconColor: '#ffffff',
                    icon: XCircle
                };
            case 'warning':
                return {
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.9))',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 20px 60px rgba(245, 158, 11, 0.3)',
                    iconColor: '#ffffff',
                    icon: AlertCircle
                };
            case 'info':
                return {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(29, 78, 216, 0.9))',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3)',
                    iconColor: '#ffffff',
                    icon: Info
                };
            default: // loading
                return {
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.9))',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
                    iconColor: '#ffffff',
                    icon: Loader
                };
        }
    };

    const typeStyles = getTypeStyles();
    const IconComponent = typeStyles.icon;

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        opacity: isAnimatingIn && !isAnimatingOut ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none'
    };

    const containerStyle = {
        background: typeStyles.background,
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: typeStyles.border,
        boxShadow: typeStyles.boxShadow,
        padding: '32px',
        maxWidth: '400px',
        width: '90vw',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        transform: isAnimatingIn && !isAnimatingOut 
            ? 'scale(1) translateY(0)' 
            : 'scale(0.9) translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };

    const iconStyle = {
        marginBottom: '16px',
        color: typeStyles.iconColor,
        animation: type === 'loading' ? 'spin 1s linear infinite' : 'none',
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
    };

    const titleStyle = {
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: message ? '8px' : '0',
        backgroundImage: 'linear-gradient(135deg, #ffffff, #f8fafc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '-0.02em'
    };

    const messageStyle = {
        fontSize: '15px',
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: '1.5',
        marginBottom: showProgress ? '20px' : '0'
    };

    const progressBarStyle = {
        width: '100%',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
    };

    const progressFillStyle = {
        height: '100%',
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 1))',
        borderRadius: '2px',
        width: `${progress}%`,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
    };

    if (!isVisible && !isAnimatingOut) return null;

    return (
        <>
            <div style={overlayStyle}>
                <div style={containerStyle}>
                    <div style={iconStyle}>
                        <IconComponent size={48} />
                    </div>
                    
                    {title && (
                        <h3 style={titleStyle}>
                            {title}
                        </h3>
                    )}
                    
                    {message && (
                        <p style={messageStyle}>
                            {message}
                        </p>
                    )}
                    
                    {showProgress && autoClose && type !== 'loading' && (
                        <div style={progressBarStyle}>
                            <div style={progressFillStyle} />
                        </div>
                    )}
                    
                    {/* Particules d'arrière-plan pour l'effet */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                                   radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                                   radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)`,
                        pointerEvents: 'none',
                        borderRadius: '24px'
                    }} />
                </div>
            </div>
            
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </>
    );
};

export default FeedbackOverlay;
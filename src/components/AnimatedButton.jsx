// AnimatedButton.jsx - Bouton avec micro-animations avancées
import React from 'react';
import { useHoverAnimation } from '../hooks/useAnimation.js';

const AnimatedButton = ({ 
    children,
    onClick,
    disabled = false,
    loading = false,
    variant = 'primary', // 'primary', 'secondary', 'success', 'danger', 'ghost'
    size = 'medium', // 'small', 'medium', 'large'
    style = {},
    className = '',
    ...props 
}) => {
    const { hoverProps, hoverStyle, isHovered } = useHoverAnimation();

    const getVariantStyles = () => {
        const baseStyles = {
            border: 'none',
            borderRadius: '16px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            outline: 'none',
            opacity: disabled ? 0.6 : 1,
        };

        switch (variant) {
            case 'primary':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'white',
                    boxShadow: isHovered 
                        ? '0 8px 25px rgba(139, 92, 246, 0.4)' 
                        : '0 4px 12px rgba(139, 92, 246, 0.3)',
                };
            case 'secondary':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: 'white',
                    boxShadow: isHovered 
                        ? '0 8px 25px rgba(59, 130, 246, 0.4)' 
                        : '0 4px 12px rgba(59, 130, 246, 0.3)',
                };
            case 'success':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'white',
                    boxShadow: isHovered 
                        ? '0 8px 25px rgba(16, 185, 129, 0.4)' 
                        : '0 4px 12px rgba(16, 185, 129, 0.3)',
                };
            case 'danger':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'white',
                    boxShadow: isHovered 
                        ? '0 8px 25px rgba(239, 68, 68, 0.4)' 
                        : '0 4px 12px rgba(239, 68, 68, 0.3)',
                };
            case 'ghost':
                return {
                    ...baseStyles,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: isHovered 
                        ? '0 8px 20px rgba(0, 0, 0, 0.2)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.1)',
                };
            default:
                return baseStyles;
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    padding: '10px 16px',
                    fontSize: '13px',
                    minHeight: '36px',
                };
            case 'large':
                return {
                    padding: '18px 32px',
                    fontSize: '17px',
                    minHeight: '56px',
                };
            default: // medium
                return {
                    padding: '14px 24px',
                    fontSize: '15px',
                    minHeight: '48px',
                };
        }
    };

    const buttonStyles = {
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...hoverStyle,
        ...style,
    };

    // Effet de ripple
    const handleClick = (e) => {
        if (disabled || loading) return;
        
        // Créer l'effet ripple
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (button.contains(ripple)) {
                button.removeChild(ripple);
            }
        }, 600);
        
        if (onClick) onClick(e);
    };

    return (
        <>
            <button
                {...props}
                {...hoverProps}
                onClick={handleClick}
                disabled={disabled || loading}
                style={buttonStyles}
                className={className}
            >
                {loading ? (
                    <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: children ? '8px' : '0'
                    }} />
                ) : null}
                {children}
            </button>
            
            <style>
                {`
                    @keyframes ripple {
                        to {
                            transform: scale(2);
                            opacity: 0;
                        }
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </>
    );
};

export default AnimatedButton;
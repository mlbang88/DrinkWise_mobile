import React from 'react';

/**
 * Composant bouton avec effet glassmorphique moderne
 * Utilise uniquement du CSS inline pour éviter les problèmes de rendu
 */
const GlassButton = ({ 
    children,
    onClick,
    disabled = false,
    loading = false,
    variant = 'default', // 'default', 'primary', 'secondary'
    size = 'medium', // 'small', 'medium', 'large'
    style = {},
    ...props 
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(124, 58, 237, 0.8)',
                };
            case 'secondary':
                return {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(99, 102, 241, 0.98) 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(59, 130, 246, 0.8)',
                };
            default:
                return {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
                    color: '#1e293b',
                    border: '1px solid rgba(226,232,240,0.8)',
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    padding: '12px 20px',
                    fontSize: '14px',
                    borderRadius: '12px',
                };
            case 'large':
                return {
                    padding: '20px 32px',
                    fontSize: '18px',
                    borderRadius: '20px',
                };
            default:
                return {
                    padding: '18px 24px',
                    fontSize: '16px',
                    borderRadius: '16px',
                };
        }
    };

    const baseStyles = {
        ...getVariantStyles(),
        ...getSizeStyles(),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontWeight: '600',
        letterSpacing: '0.025em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled || loading ? 0.7 : 1,
        boxShadow: disabled || loading ? 
            '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 
            '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        textShadow: variant === 'default' ? 
            '0 1px 2px rgba(0, 0, 0, 0.1)' : 
            '0 1px 3px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        ...style
    };

    const handleMouseEnter = (e) => {
        if (!disabled && !loading) {
            const variantStyles = getVariantStyles();
            if (variant === 'default') {
                e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,1) 100%)';
                e.target.style.borderColor = 'rgba(203,213,225,0.9)';
            } else {
                e.target.style.filter = 'brightness(1.1)';
            }
            e.target.style.boxShadow = '0 20px 40px -4px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'translateY(-2px)';
        }
    };

    const handleMouseLeave = (e) => {
        if (!disabled && !loading) {
            const variantStyles = getVariantStyles();
            e.target.style.background = variantStyles.background;
            e.target.style.borderColor = variantStyles.border.split(' ')[2];
            e.target.style.filter = 'none';
            e.target.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            e.target.style.transform = 'translateY(0px)';
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={baseStyles}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}
        </button>
    );
};

export default GlassButton;
import React, { useState, useEffect, useRef } from 'react';
import { useHoverAnimation } from '../hooks/useAnimation';

const AnimatedCard = ({ 
    children, 
    className = '',
    variant = 'default', // 'default', 'glass', 'gradient', 'solid'
    hoverEffect = 'lift', // 'lift', 'scale', 'glow', 'rotate', 'none'
    onClick = null,
    delay = 0,
    animateOnMount = true
}) => {
    const [isVisible, setIsVisible] = useState(!animateOnMount);
    const cardRef = useRef(null);
    const { hoverStyle, isHovered } = useHoverAnimation();

    // Mount animation
    useEffect(() => {
        if (animateOnMount) {
            setTimeout(() => {
                setIsVisible(true);
            }, delay);
        }
    }, [animateOnMount, delay]);

    const getVariantClasses = () => {
        switch (variant) {
            case 'glass':
                return 'bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg';
            case 'gradient':
                return 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10';
            case 'solid':
                return 'bg-white/95 text-gray-900 shadow-xl';
            default:
                return 'bg-white/10 backdrop-blur-md border border-white/10 shadow-md';
        }
    };

    const getHoverEffectStyle = () => {
        if (!isHovered) return {};
        
        switch (hoverEffect) {
            case 'scale':
                return { transform: 'scale(1.05) translateZ(0)' };
            case 'glow':
                return { 
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
                    borderColor: 'rgba(139, 92, 246, 0.5)'
                };
            case 'rotate':
                return { transform: 'rotate(1deg) translateZ(0)' };
            case 'lift':
            default:
                return { 
                    transform: 'translateY(-8px) translateZ(0)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                };
        }
    };

    const cardStyle = {
        ...hoverStyle,
        ...getHoverEffectStyle(),
        transform: isVisible 
            ? getHoverEffectStyle().transform || 'translateY(0) translateZ(0)'
            : 'translateY(30px) translateZ(0)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'transform, opacity, box-shadow',
        backfaceVisibility: 'hidden',
    };

    return (
        <>
            <div
                ref={cardRef}
                style={cardStyle}
                className={`
                    animated-card rounded-2xl p-6 
                    ${getVariantClasses()}
                    ${onClick ? 'cursor-pointer select-none' : ''}
                    ${className}
                `}
                onClick={onClick}
            >
                {children}
                
                {/* Shine effect on hover */}
                {isHovered && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shine" />
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .animated-card {
                    position: relative;
                    -webkit-font-smoothing: antialiased;
                }
                
                .animated-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: inherit;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%);
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .animated-card:hover::before {
                    opacity: 1;
                }
                
                @keyframes shine {
                    0% { transform: translateX(-100%) skew(-12deg); }
                    100% { transform: translateX(200%) skew(-12deg); }
                }
                
                .animate-shine {
                    animation: shine 1.5s ease-in-out;
                }
                
                /* Micro-interactions */
                .animated-card:active {
                    transform: scale(0.98) translateZ(0) !important;
                    transition: all 0.1s ease !important;
                }
                
                /* Focus states for accessibility */
                .animated-card:focus-visible {
                    outline: 2px solid rgba(139, 92, 246, 0.8);
                    outline-offset: 2px;
                }
            `}</style>
        </>
    );
};

export default AnimatedCard;
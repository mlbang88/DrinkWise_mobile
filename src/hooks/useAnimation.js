// useAnimation.js - Hook personnalisé pour gérer les animations d'entrée/sortie
import { useState, useEffect, useRef } from 'react';

export const useModalAnimation = (isOpen, onClose, duration = 300) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Petite pause pour permettre au DOM de se mettre à jour
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                if (onClose) onClose();
            }, duration);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isOpen, onClose, duration]);

    const animationStyles = {
        overlay: {
            opacity: isAnimating ? 1 : 0,
            transition: `opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
        },
        modal: {
            transform: isAnimating ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            opacity: isAnimating ? 1 : 0,
            transition: `all ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
        }
    };

    return { isVisible, isAnimating, animationStyles };
};

export const useSlideAnimation = (isVisible, direction = 'up', duration = 300) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
        }
    }, [isVisible]);

    const getTransform = () => {
        if (!isAnimating) {
            switch (direction) {
                case 'up': return 'translateY(20px)';
                case 'down': return 'translateY(-20px)';
                case 'left': return 'translateX(20px)';
                case 'right': return 'translateX(-20px)';
                default: return 'translateY(20px)';
            }
        }
        return 'translate(0)';
    };

    return {
        style: {
            transform: getTransform(),
            opacity: isAnimating ? 1 : 0,
            transition: `all ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
        }
    };
};

export const useStaggeredAnimation = (items, delay = 100) => {
    const [visibleItems, setVisibleItems] = useState(new Set());

    useEffect(() => {
        items.forEach((_, index) => {
            setTimeout(() => {
                setVisibleItems(prev => new Set([...prev, index]));
            }, index * delay);
        });

        return () => setVisibleItems(new Set());
    }, [items, delay]);

    const getItemStyle = (index) => ({
        transform: visibleItems.has(index) ? 'translateY(0)' : 'translateY(20px)',
        opacity: visibleItems.has(index) ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
    });

    return { getItemStyle };
};

export const useHoverAnimation = () => {
    const [isHovered, setIsHovered] = useState(false);

    const hoverProps = {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
    };

    const hoverStyle = {
        transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    };

    return { hoverProps, hoverStyle, isHovered };
};

export const usePulseAnimation = (isActive = false) => {
    const pulseStyle = {
        animation: isActive ? 'pulse 2s cubic-bezier(0.4, 0.0, 0.6, 1) infinite' : 'none',
    };

    const pulseKeyframes = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
    `;

    return { pulseStyle, pulseKeyframes };
};

export const useListAnimation = (items, options = {}) => {
    const [visibleItems, setVisibleItems] = useState(new Set());
    const [isInitialized, setIsInitialized] = useState(false);
    
    const {
        delay = 80,
        staggerDirection = 'down', // 'down', 'up', 'random'
        animationType = 'slide' // 'slide', 'fade', 'scale', 'flip'
    } = options;

    useEffect(() => {
        setVisibleItems(new Set());
        setIsInitialized(false);

        const indices = items.map((_, index) => index);
        
        if (staggerDirection === 'up') {
            indices.reverse();
        } else if (staggerDirection === 'random') {
            indices.sort(() => Math.random() - 0.5);
        }

        indices.forEach((index, staggerIndex) => {
            setTimeout(() => {
                setVisibleItems(prev => new Set([...prev, index]));
            }, staggerIndex * delay);
        });

        setTimeout(() => {
            setIsInitialized(true);
        }, indices.length * delay + 100);

        return () => {
            setVisibleItems(new Set());
            setIsInitialized(false);
        };
    }, [items, delay, staggerDirection]);

    const getItemStyle = (index) => {
        const isVisible = visibleItems.has(index);
        
        const baseStyle = {
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: '0ms'
        };

        if (!isVisible) {
            switch (animationType) {
                case 'scale':
                    return {
                        ...baseStyle,
                        transform: 'scale(0.8) translateZ(0)',
                        opacity: 0,
                        filter: 'blur(2px)'
                    };
                case 'flip':
                    return {
                        ...baseStyle,
                        transform: 'rotateX(90deg) translateZ(0)',
                        opacity: 0,
                        transformOrigin: 'center center',
                        transformStyle: 'preserve-3d'
                    };
                case 'fade':
                    return {
                        ...baseStyle,
                        opacity: 0,
                        filter: 'blur(1px)'
                    };
                default: // slide
                    return {
                        ...baseStyle,
                        transform: 'translateY(30px) translateZ(0)',
                        opacity: 0,
                        filter: 'blur(1px)'
                    };
            }
        }

        return {
            ...baseStyle,
            transform: 'translateY(0) translateZ(0) scale(1) rotateX(0deg)',
            opacity: 1,
            filter: 'blur(0px)'
        };
    };

    return { getItemStyle, isInitialized };
};

export const useScrollAnimation = (threshold = 0.1) => {
    const [visibleElements, setVisibleElements] = useState(new Set());
    const observerRef = useRef(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisibleElements(prev => new Set([...prev, entry.target.dataset.scrollId]));
                    }
                });
            },
            { threshold, rootMargin: '50px' }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [threshold]);

    const registerElement = (id) => {
        return {
            'data-scroll-id': id,
            ref: (el) => {
                if (el && observerRef.current) {
                    observerRef.current.observe(el);
                }
            }
        };
    };

    const getElementStyle = (id) => ({
        transform: visibleElements.has(id) ? 'translateY(0)' : 'translateY(30px)',
        opacity: visibleElements.has(id) ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    });

    return { registerElement, getElementStyle, visibleElements };
};

// Export final pour s'assurer que tous les hooks sont disponibles
export {
    useModalAnimation,
    useSlideAnimation, 
    useStaggeredAnimation,
    useHoverAnimation,
    usePulseAnimation,
    useListAnimation,
    useScrollAnimation
};
// useListAnimation.js - Hook séparé pour les animations de liste
import { useState, useEffect } from 'react';

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

export default useListAnimation;
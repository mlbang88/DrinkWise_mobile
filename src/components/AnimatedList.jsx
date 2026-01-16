import React from 'react';
import { useListAnimation } from '../hooks/useListAnimation';

const AnimatedList = ({ 
    items, 
    renderItem, 
    className = '',
    animationType = 'slide',
    staggerDirection = 'down',
    delay = 80,
    loadingComponent = null,
    emptyComponent = null,
    keyExtractor = (item, index) => index,
    onItemClick = null
}) => {
    const { getItemStyle, isInitialized } = useListAnimation(items, {
        delay,
        staggerDirection,
        animationType
    });

    if (!items || items.length === 0) {
        return emptyComponent || (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <div className="text-white/60 text-center">
                    <div className="text-3xl mb-2">🌟</div>
                    <p>Aucun élément à afficher</p>
                </div>
            </div>
        );
    }

    if (!isInitialized && loadingComponent) {
        return loadingComponent;
    }

    return (
        <div className={`animated-list ${className}`} style={{ position: 'relative' }}>
            {items.map((item, index) => {
                const key = keyExtractor(item, index);
                
                return (
                    <div
                        key={key}
                        style={{
                            ...getItemStyle(index),
                            willChange: 'transform, opacity',
                            backfaceVisibility: 'hidden',
                            WebkitFontSmoothing: 'antialiased'
                        }}
                        className={`animated-list-item ${onItemClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onItemClick && onItemClick(item, index)}
                        onMouseEnter={(e) => {
                            const currentTransform = e.currentTarget.style.transform;
                            e.currentTarget.style.transform = currentTransform.includes('translateY') 
                                ? currentTransform.replace(/translateY\([^)]*\)/, 'translateY(-2px)')
                                : `${currentTransform} translateY(-2px)`;
                        }}
                        onMouseLeave={(e) => {
                            const currentTransform = e.currentTarget.style.transform;
                            e.currentTarget.style.transform = currentTransform.replace(/translateY\([^)]*\)/, 'translateY(0)');
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                );
            })}
        </div>
    );
};

export default AnimatedList;
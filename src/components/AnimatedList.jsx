import React from 'react';
import { useListAnimation } from '../hooks/useAnimation';

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
        <div className={`animated-list ${className}`}>
            {items.map((item, index) => {
                const key = keyExtractor(item, index);
                
                return (
                    <div
                        key={key}
                        style={getItemStyle(index)}
                        className={`animated-list-item ${onItemClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onItemClick && onItemClick(item, index)}
                    >
                        {renderItem(item, index)}
                    </div>
                );
            })}
            
            <style jsx>{`
                .animated-list {
                    position: relative;
                }
                
                .animated-list-item {
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                    -webkit-font-smoothing: antialiased;
                }
                
                .animated-list-item:hover {
                    transform: translateY(-2px) translateZ(0) !important;
                    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
                }
            `}</style>
        </div>
    );
};

export default AnimatedList;
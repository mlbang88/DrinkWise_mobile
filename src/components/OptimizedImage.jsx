import React, { useState, useEffect, useRef } from 'react';

const OptimizedImage = ({ 
    src, 
    alt, 
    style = {}, 
    onClick, 
    fallbackSrc = 'https://images.unsplash.com/photo-1514362545857-3bc7d00a937b?q=80&w=2070&auto=format&fit=crop',
    lazy = true,
    ...props 
}) => {
    const [imageSrc, setImageSrc] = useState(lazy ? null : src);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        if (!lazy) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    setImageSrc(src);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [src, lazy]);

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
        if (imageSrc !== fallbackSrc) {
            setImageSrc(fallbackSrc);
            setError(false);
            setLoading(true);
        }
    };

    return (
        <div 
            ref={imgRef}
            style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                ...style
            }}
            onClick={onClick}
            {...props}
        >
            {/* Loading placeholder */}
            {loading && imageSrc && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    zIndex: 1
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>
            )}

            {/* Lazy loading placeholder */}
            {!imageSrc && (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px'
                }}>
                    📷 Chargement...
                </div>
            )}

            {/* Image */}
            {imageSrc && (
                <img
                    src={imageSrc}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: loading ? 'none' : 'block',
                        transition: 'opacity 0.3s ease',
                        opacity: loading ? 0 : 1,
                        ...style
                    }}
                    loading={lazy ? "lazy" : "eager"}
                />
            )}
        </div>
    );
};

export default OptimizedImage;
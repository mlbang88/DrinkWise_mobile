import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import '../styles/MediaLightbox.css';

export const MediaLightbox = ({ 
  media, 
  onClose, 
  initialIndex = 0,
  type = 'photo' // 'photo' or 'video'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  
  const mediaArray = Array.isArray(media) ? media : [media];
  const totalCount = mediaArray.length;
  const currentMedia = mediaArray[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="lightbox-overlay"
        onClick={onClose}
      >
        {/* Close button */}
        <button 
          className="lightbox-close" 
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={24} />
        </button>

        {/* Zoom controls (photo only) */}
        {type === 'photo' && (
          <div className="lightbox-zoom-controls">
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              aria-label="Dézoomer"
              disabled={zoom <= 1}
            >
              <ZoomOut size={20} />
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              aria-label="Zoomer"
              disabled={zoom >= 3}
            >
              <ZoomIn size={20} />
            </button>
          </div>
        )}

        {/* Media content */}
        <div 
          className="lightbox-content" 
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="lightbox-media-wrapper"
            >
              {type === 'video' ? (
                <video 
                  controls 
                  autoPlay 
                  className="lightbox-video"
                  src={currentMedia}
                >
                  <source src={currentMedia} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              ) : (
                <img 
                  src={currentMedia} 
                  alt={`Media ${currentIndex + 1}`}
                  className="lightbox-image"
                  style={{ transform: `scale(${zoom})` }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation (multiple media) */}
        {totalCount > 1 && (
          <div className="lightbox-nav" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              aria-label="Précédent"
              className="lightbox-nav-btn"
            >
              <ChevronLeft size={32} />
            </button>
            
            <span className="lightbox-counter">
              {currentIndex + 1} / {totalCount}
            </span>
            
            <button 
              onClick={handleNext} 
              disabled={currentIndex === totalCount - 1}
              aria-label="Suivant"
              className="lightbox-nav-btn"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        )}

        {/* Thumbnail strip (multiple photos) */}
        {totalCount > 1 && type === 'photo' && (
          <div className="lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
            {mediaArray.map((thumb, index) => (
              <button
                key={index}
                onClick={() => { setCurrentIndex(index); setZoom(1); }}
                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Voir photo ${index + 1}`}
              >
                <img src={thumb} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaLightbox;

import React, { useState } from 'react';
import { logger } from '../utils/logger';

/**
 * Composant d'image accessible avec gestion du texte alternatif et fallback
 * @param {string} src - URL de l'image
 * @param {string} alt - Texte alternatif (obligatoire pour images non décoratives)
 * @param {boolean} decorative - Si true, l'image est purement décorative (pas de alt nécessaire)
 * @param {string} fallbackSrc - Image de secours en cas d'erreur
 * @param {function} onLoad - Callback appelé au chargement réussi
 * @param {function} onError - Callback appelé en cas d'erreur
 */
const AccessibleImage = ({ 
    src, 
    alt, 
    decorative = false, 
    fallbackSrc = null,
    onLoad,
    onError,
    className = '',
    style = {},
    ...props 
}) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    // Validation: image non-décorative DOIT avoir un alt
    if (!decorative && !alt) {
        logger.warn('AccessibleImage: Image non-décorative sans texte alt', { src });
    }

    const handleError = (e) => {
        if (!hasError && fallbackSrc) {
            logger.info('Fallback image utilisée', { originalSrc: src, fallbackSrc });
            setCurrentSrc(fallbackSrc);
            setHasError(true);
        } else {
            logger.error('Erreur chargement image', { src, fallbackSrc });
        }
        
        if (onError) {
            onError(e);
        }
    };

    const handleLoad = (e) => {
        if (onLoad) {
            onLoad(e);
        }
    };

    return (
        <img 
            src={currentSrc}
            alt={decorative ? '' : (alt || '')}
            aria-hidden={decorative ? 'true' : undefined}
            role={decorative ? 'presentation' : undefined}
            onError={handleError}
            onLoad={handleLoad}
            className={className}
            style={style}
            {...props}
        />
    );
};

export default AccessibleImage;

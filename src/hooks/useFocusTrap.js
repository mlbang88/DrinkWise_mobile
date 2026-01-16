import { useEffect, useRef } from 'react';

/**
 * Hook pour capturer le focus dans un élément (modal, dropdown, etc.)
 * Améliore l'accessibilité en empêchant la navigation Tab de sortir du conteneur
 * 
 * @param {boolean} isActive - Si le focus trap est actif
 * @returns {React.RefObject} Ref à attacher au conteneur
 * 
 * @example
 * const modalRef = useFocusTrap(isOpen);
 * return <div ref={modalRef} role="dialog">...</div>
 */
export const useFocusTrap = (isActive = true) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus sur le premier élément au montage
        firstElement.focus();

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                // Déclencher un événement personnalisé pour fermer la modal
                container.dispatchEvent(new CustomEvent('requestClose', { bubbles: true }));
            }
        };

        container.addEventListener('keydown', handleTabKey);
        container.addEventListener('keydown', handleEscKey);

        return () => {
            container.removeEventListener('keydown', handleTabKey);
            container.removeEventListener('keydown', handleEscKey);
        };
    }, [isActive]);

    return containerRef;
};

/**
 * Hook pour restaurer le focus après fermeture d'une modal
 * 
 * @param {boolean} isOpen - Si la modal est ouverte
 * 
 * @example
 * const restoreFocus = useRestoreFocus(isOpen);
 */
export const useRestoreFocus = (isOpen) => {
    const previousActiveElement = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Sauvegarder l'élément actuellement focusé
            previousActiveElement.current = document.activeElement;
        } else {
            // Restaurer le focus quand la modal se ferme
            if (previousActiveElement.current && previousActiveElement.current.focus) {
                previousActiveElement.current.focus();
            }
        }
    }, [isOpen]);
};

import React from 'react';
import { X } from 'lucide-react';
import { useFocusTrap, useRestoreFocus } from '../hooks/useFocusTrap';

/**
 * Modal accessible avec focus trap et gestion du clavier
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si la modal est ouverte
 * @param {Function} props.onClose - Callback de fermeture
 * @param {string} props.title - Titre de la modal
 * @param {React.ReactNode} props.children - Contenu de la modal
 * @param {string} props.size - Taille: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} props.showCloseButton - Afficher le bouton X
 * @param {string} props.ariaLabel - Label pour lecteur d'écran
 * @param {string} props.className - Classes CSS additionnelles
 * 
 * @example
 * <AccessibleModal 
 *   isOpen={showModal} 
 *   onClose={() => setShowModal(false)}
 *   title="Confirmer l'action"
 *   size="md"
 * >
 *   <p>Êtes-vous sûr ?</p>
 * </AccessibleModal>
 */
const AccessibleModal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    ariaLabel,
    className = ''
}) => {
    const modalRef = useFocusTrap(isOpen);
    useRestoreFocus(isOpen);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4'
    };

    const handleRequestClose = (e) => {
        if (e.type === 'requestClose') {
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={handleBackdropClick}
            role="presentation"
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-label={ariaLabel || title}
                className={`
                    relative w-full ${sizeClasses[size]}
                    bg-gray-900 border border-gray-700 
                    rounded-2xl shadow-2xl
                    max-h-[90vh] overflow-y-auto
                    ${className}
                `}
                onRequestClose={handleRequestClose}
            >
                {/* Header avec titre et bouton fermer */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900 border-b border-gray-700">
                    {title && (
                        <h2 id="modal-title" className="text-2xl font-bold text-white">
                            {title}
                        </h2>
                    )}
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="
                                p-2 ml-auto text-gray-400 
                                hover:text-white hover:bg-gray-800 
                                rounded-lg transition-colors
                                focus:outline-none focus:ring-2 focus:ring-violet-500
                            "
                            aria-label="Fermer la modal"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Contenu */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AccessibleModal;

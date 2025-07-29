import React, { useState } from 'react';

const QuickEventButton = ({ icon, label, count, onIncrement }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = (e) => {
        e.preventDefault(); // Empêcher le comportement par défaut
        e.stopPropagation(); // Empêcher la propagation de l'événement
        
        // Empêcher le focus automatique qui peut causer le scroll
        if (e.target && e.target.blur) {
            e.target.blur();
        }
        
        // Sauvegarder la position de scroll
        const scrollPosition = window.pageYOffset;
        
        setIsPressed(true);
        onIncrement();
        setTimeout(() => setIsPressed(false), 150);
        
        // Restaurer la position après un court délai
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 50);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            style={{
                backgroundColor: isPressed ? '#7c3aed' : 'rgba(139, 69, 255, 0.2)',
                border: '2px solid #8b45ff',
                borderRadius: '16px',
                padding: '16px',
                minWidth: '120px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                if (!isPressed) {
                    e.target.style.backgroundColor = 'rgba(139, 69, 255, 0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isPressed) {
                    e.target.style.backgroundColor = 'rgba(139, 69, 255, 0.2)';
                    e.target.style.transform = 'translateY(0px)';
                }
            }}
        >
            {/* Badge du compteur */}
            {count > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: '2px solid white'
                }}>
                    {count}
                </div>
            )}

            {/* Icône */}
            <div style={{
                fontSize: '32px',
                marginBottom: '8px'
            }}>
                {icon}
            </div>

            {/* Label */}
            <div style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
            }}>
                {label}
            </div>
        </button>
    );
};

export default QuickEventButton;

import React, { useState } from 'react';

const DrinkCounter = ({ type, count, onIncrement, onDecrement, icon }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleIncrement = () => {
        // Sauvegarder la position de scroll avant l'action
        const scrollPosition = window.pageYOffset;
        
        setIsAnimating(true);
        onIncrement();
        setTimeout(() => setIsAnimating(false), 200);
        
        // Restaurer la position après un court délai
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 50);
    };

    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '2px solid rgba(139, 69, 255, 0.3)',
            textAlign: 'center'
        }}>
            {/* Type de boisson */}
            <div style={{
                fontSize: '24px',
                marginBottom: '8px'
            }}>
                {icon}
            </div>
            <h3 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 16px 0'
            }}>
                {type}
            </h3>

            {/* Compteur avec boutons */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px'
            }}>
                {/* Bouton - */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.target && e.target.blur) e.target.blur();
                        
                        // Sauvegarder et restaurer la position de scroll
                        const scrollPosition = window.pageYOffset;
                        onDecrement();
                        setTimeout(() => {
                            window.scrollTo(0, scrollPosition);
                        }, 50);
                    }}
                    disabled={count <= 0}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: count <= 0 ? '#374151' : '#ef4444',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        cursor: count <= 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: count <= 0 ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (count > 0) {
                            e.target.style.transform = 'scale(1.1)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    −
                </button>

                {/* Affichage du compteur */}
                <div style={{
                    minWidth: '80px',
                    padding: '12px',
                    backgroundColor: 'rgba(139, 69, 255, 0.2)',
                    borderRadius: '12px',
                    border: '2px solid #8b45ff',
                    transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.2s ease'
                }}>
                    <span style={{
                        color: 'white',
                        fontSize: '28px',
                        fontWeight: 'bold'
                    }}>
                        {count}
                    </span>
                </div>

                {/* Bouton + */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.target && e.target.blur) e.target.blur();
                        handleIncrement();
                    }}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.backgroundColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.backgroundColor = '#10b981';
                    }}
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default DrinkCounter;

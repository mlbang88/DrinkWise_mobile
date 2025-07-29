import React, { useContext } from 'react';
import { FirebaseContext } from '../../contexts/FirebaseContext.jsx';

const PartyModeToggle = () => {
    const { partyMode, activeDraft, startPartyMode, endPartyMode } = useContext(FirebaseContext);

    const handleToggle = () => {
        if (partyMode) {
            endPartyMode();
        } else {
            startPartyMode();
        }
    };

    return (
        <div style={{
            margin: '20px 0',
            textAlign: 'center'
        }}>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle();
                }}
                style={{
                    background: partyMode 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : 'linear-gradient(135deg, #8b45ff 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '200px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                }}
            >
                {partyMode ? '🔥 Arrêter Mode Soirée' : '🎉 Mode Soirée'}
            </button>
            
            {activeDraft && !partyMode && (
                <div style={{
                    marginTop: '10px',
                    color: '#fbbf24',
                    fontSize: '14px',
                    fontStyle: 'italic'
                }}>
                    💾 Brouillon de soirée en attente
                </div>
            )}
        </div>
    );
};

export default PartyModeToggle;

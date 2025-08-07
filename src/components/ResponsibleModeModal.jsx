import React, { useState, useContext } from 'react';
import { AlertTriangle, Phone, MapPin, Users } from 'lucide-react';

const ResponsibleModeModal = ({ isOpen, onClose, userProfile }) => {
    const [emergencyMode, setEmergencyMode] = useState(false);
    
    if (!isOpen) return null;

    const emergencyNumbers = [
        { name: "SAMU", number: "15", description: "Urgences médicales" },
        { name: "Police", number: "17", description: "Urgences sécurité" },
        { name: "Pompiers", number: "18", description: "Urgences feu/accidents" },
        { name: "SOS Amitié", number: "09 72 39 40 50", description: "Écoute et soutien" }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1a1a2e',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                border: '2px solid #ff6b6b'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '25px'
                }}>
                    <AlertTriangle size={32} color="#ff6b6b" />
                    <h2 style={{
                        color: '#ff6b6b',
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: 0
                    }}>
                        Mode Sécurisé
                    </h2>
                </div>

                <div style={{
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '15px' }}>
                        ⚠️ Consommation Responsable
                    </h3>
                    <ul style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                        <li>Buvez avec modération</li>
                        <li>Ne conduisez jamais après avoir bu</li>
                        <li>Hydratez-vous régulièrement</li>
                        <li>Mangez avant et pendant la consommation</li>
                        <li>Entourez-vous de personnes de confiance</li>
                    </ul>
                </div>

                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '15px' }}>
                        🚨 Numéros d'Urgence
                    </h3>
                    {emergencyNumbers.map(num => (
                        <div key={num.number} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: '600' }}>{num.name}</div>
                                <div style={{ color: '#ccc', fontSize: '12px' }}>{num.description}</div>
                            </div>
                            <a href={`tel:${num.number}`} style={{
                                backgroundColor: '#ff6b6b',
                                color: 'white',
                                padding: '8px 15px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                {num.number}
                            </a>
                        </div>
                    ))}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginTop: '25px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '15px',
                            backgroundColor: '#4caf50',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        J'ai compris
                    </button>
                    
                    <button
                        onClick={() => setEmergencyMode(true)}
                        style={{
                            flex: 1,
                            padding: '15px',
                            backgroundColor: '#ff6b6b',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        🚨 Aide d'urgence
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResponsibleModeModal;

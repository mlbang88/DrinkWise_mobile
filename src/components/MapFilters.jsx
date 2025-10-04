import React, { useState } from 'react';
import { Filter, MapPin, Users, Target, Zap } from 'lucide-react';

/**
 * Composant de filtres pour la carte territoriale
 * Permet de filtrer par distance et type de marqueurs
 */
const MapFilters = ({ onFilterChange, currentFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [distance, setDistance] = useState(currentFilter?.distance || 10000);
    const [showUserVenues, setShowUserVenues] = useState(currentFilter?.showUserVenues ?? true);
    const [showRivalVenues, setShowRivalVenues] = useState(currentFilter?.showRivalVenues ?? true);

    const distanceOptions = [
        { value: 5000, label: '5 km', icon: '🎯' },
        { value: 10000, label: '10 km', icon: '📍' },
        { value: 50000, label: '50 km', icon: '🗺️' },
        { value: 100000, label: '100 km', icon: '🌍' }
    ];

    const handleDistanceChange = (newDistance) => {
        setDistance(newDistance);
        applyFilters(newDistance, showUserVenues, showRivalVenues);
    };

    const handleToggleUserVenues = () => {
        const newValue = !showUserVenues;
        setShowUserVenues(newValue);
        applyFilters(distance, newValue, showRivalVenues);
    };

    const handleToggleRivalVenues = () => {
        const newValue = !showRivalVenues;
        setShowRivalVenues(newValue);
        applyFilters(distance, showUserVenues, newValue);
    };

    const applyFilters = (dist, userVenues, rivalVenues) => {
        onFilterChange({
            distance: dist,
            showUserVenues: userVenues,
            showRivalVenues: rivalVenues
        });
    };

    return (
        <div style={{
            position: 'absolute',
            top: '80px',
            right: '16px',
            zIndex: 40,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Bouton principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    transform: isOpen ? 'scale(0.95)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                    e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.transform = isOpen ? 'scale(0.95)' : 'scale(1)';
                }}
            >
                <Filter size={18} />
                <span>Filtres</span>
            </button>

            {/* Panneau de filtres */}
            {isOpen && (
                <div style={{
                    marginTop: '12px',
                    backgroundColor: '#1f2937',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    minWidth: '280px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                    animation: 'slideDown 0.3s ease'
                }}>
                    {/* Distance */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            color: '#9ca3af',
                            fontSize: '13px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            <Target size={16} />
                            <span>Distance</span>
                        </div>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '8px'
                        }}>
                            {distanceOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleDistanceChange(option.value)}
                                    style={{
                                        padding: '10px',
                                        backgroundColor: distance === option.value ? '#8b5cf6' : '#374151',
                                        color: distance === option.value ? 'white' : '#9ca3af',
                                        border: distance === option.value ? '2px solid #a78bfa' : '2px solid transparent',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (distance !== option.value) {
                                            e.currentTarget.style.backgroundColor = '#4b5563';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (distance !== option.value) {
                                            e.currentTarget.style.backgroundColor = '#374151';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    <span>{option.icon}</span>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{
                        height: '1px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        margin: '16px 0'
                    }} />

                    {/* Affichage */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            color: '#9ca3af',
                            fontSize: '13px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            <MapPin size={16} />
                            <span>Affichage</span>
                        </div>

                        {/* Toggle Mes lieux */}
                        <div
                            onClick={handleToggleUserVenues}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px',
                                backgroundColor: showUserVenues ? 'rgba(34, 197, 94, 0.1)' : '#374151',
                                border: showUserVenues ? '2px solid #22c55e' : '2px solid transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: '#22c55e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Zap size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Mes lieux
                                    </div>
                                    <div style={{
                                        color: '#9ca3af',
                                        fontSize: '12px'
                                    }}>
                                        Marqueurs verts
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                width: '44px',
                                height: '24px',
                                backgroundColor: showUserVenues ? '#22c55e' : '#6b7280',
                                borderRadius: '12px',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: showUserVenues ? '23px' : '3px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                }} />
                            </div>
                        </div>

                        {/* Toggle Lieux rivaux */}
                        <div
                            onClick={handleToggleRivalVenues}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px',
                                backgroundColor: showRivalVenues ? 'rgba(239, 68, 68, 0.1)' : '#374151',
                                border: showRivalVenues ? '2px solid #ef4444' : '2px solid transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Users size={18} color="white" />
                                </div>
                                <div>
                                    <div style={{
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Lieux rivaux
                                    </div>
                                    <div style={{
                                        color: '#9ca3af',
                                        fontSize: '12px'
                                    }}>
                                        Marqueurs rouges
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                width: '44px',
                                height: '24px',
                                backgroundColor: showRivalVenues ? '#ef4444' : '#6b7280',
                                borderRadius: '12px',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: showRivalVenues ? '23px' : '3px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation CSS */}
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default MapFilters;

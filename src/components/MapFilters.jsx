import React, { useState } from 'react';
import { MapPin, Users, Target } from 'lucide-react';

/**
 * Composant de filtres pour la carte territoriale
 * Permet de filtrer par distance et type de marqueurs
 */
const MapFilters = ({ onFilterChange, currentFilter }) => {
    const [distance, setDistance] = useState(currentFilter?.distance || 10000);
    const [showUserVenues, setShowUserVenues] = useState(currentFilter?.showUserVenues ?? true);
    const [showRivalVenues, setShowRivalVenues] = useState(currentFilter?.showRivalVenues ?? true);

    const distanceOptions = [
        { value: 500, label: '500 m', icon: '🎯' },
        { value: 1000, label: '1 km', icon: '📍' },
        { value: 5000, label: '5 km', icon: '🗺️' },
        { value: 10000, label: '10 km', icon: '🌍' }
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
            position: 'fixed',
            top: '100px',
            right: '16px',
            zIndex: 1000,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Panneau de filtres */}
            <div style={{
                backgroundColor: '#1f2937',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                minWidth: '280px',
                maxWidth: '320px',
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
                        color: '#a78bfa',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        <Target size={16} />
                        <span>Distance maximale</span>
                    </div>
                    
                    {/* Options de distance */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px'
                    }}>
                        {distanceOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleDistanceChange(option.value)}
                                style={{
                                    padding: '10px',
                                    backgroundColor: distance === option.value ? '#8b5cf6' : 'rgba(139, 92, 246, 0.1)',
                                    color: distance === option.value ? 'white' : '#a78bfa',
                                    border: distance === option.value ? '2px solid #8b5cf6' : '2px solid transparent',
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
                            >
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Mes lieux */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '10px',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#22c55e',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            <MapPin size={16} />
                            <span>Mes lieux</span>
                        </div>
                        <div
                            onClick={handleToggleUserVenues}
                            style={{
                                position: 'relative',
                                width: '46px',
                                height: '24px',
                                backgroundColor: showUserVenues ? '#22c55e' : 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                width: '18px',
                                height: '18px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                top: '3px',
                                left: showUserVenues ? '25px' : '3px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }} />
                        </div>
                    </div>

                    {/* Lieux rivaux */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#ef4444',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            <Users size={16} />
                            <span>Lieux rivaux</span>
                        </div>
                        <div
                            onClick={handleToggleRivalVenues}
                            style={{
                                position: 'relative',
                                width: '46px',
                                height: '24px',
                                backgroundColor: showRivalVenues ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                width: '18px',
                                height: '18px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                top: '3px',
                                left: showRivalVenues ? '25px' : '3px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }} />
                        </div>
                    </div>
                </div>
            </div>

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

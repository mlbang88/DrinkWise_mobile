// Composant de suggestions contextuelles pour les modales de soirée
import React, { useEffect, useState } from 'react';

/**
 * Affiche des suggestions contextuelles basées sur les données de la soirée
 * @param {Object} partyData - Données actuelles de la soirée
 * @param {Object} userProfile - Profil de l'utilisateur
 * @returns {JSX.Element|null} - Suggestions ou null
 */
const PartySuggestions = ({ partyData, userProfile }) => {
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const newSuggestions = [];
        
        // Suggestion: Ajouter un lieu
        if (partyData.drinks?.length >= 3 && !partyData.venue) {
            newSuggestions.push({
                id: 'add-venue',
                icon: '📍',
                message: 'Ajoute un lieu pour gagner +50 pts territoriaux !',
                type: 'info',
                action: 'venue'
            });
        }

        // Suggestion: Inviter des amis
        if (partyData.drinks?.length >= 5 && (!partyData.companions?.selectedIds || partyData.companions.selectedIds.length === 0)) {
            newSuggestions.push({
                id: 'add-friends',
                icon: '👥',
                message: 'Invite des amis pour un bonus XP x1.2 !',
                type: 'info',
                action: 'companions'
            });
        }

        // Suggestion: Modération
        if (partyData.drinks?.length >= 6) {
            newSuggestions.push({
                id: 'moderation',
                icon: '💧',
                message: 'Pense à boire de l\'eau entre deux verres !',
                type: 'warning',
                action: null
            });
        }

        // Suggestion: Mode explorateur
        if (partyData.battleMode === 'explorer' && !partyData.venue) {
            newSuggestions.push({
                id: 'explorer-venue',
                icon: '✨',
                message: 'Mode Explorateur actif : Découvre un nouveau lieu pour bonus !',
                type: 'success',
                action: 'venue'
            });
        }

        // Suggestion: Mode social
        if (partyData.battleMode === 'social' && (!partyData.companions?.selectedIds || partyData.companions.selectedIds.length === 0)) {
            newSuggestions.push({
                id: 'social-companions',
                icon: '❤️',
                message: 'Mode Social : Chaque ami ajouté = +5 pts bonus !',
                type: 'success',
                action: 'companions'
            });
        }

        // Suggestion: Streak en danger
        if (userProfile?.currentStreak >= 3 && userProfile?.lastStreakDate) {
            const lastDate = new Date(userProfile.lastStreakDate);
            const today = new Date();
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                newSuggestions.push({
                    id: 'streak-danger',
                    icon: '🔥',
                    message: `Série de ${userProfile.currentStreak} jours ! Continue pour ne pas la perdre !`,
                    type: 'warning',
                    action: null
                });
            }
        }

        setSuggestions(newSuggestions.slice(0, 2)); // Max 2 suggestions à la fois
    }, [partyData, userProfile]);

    if (suggestions.length === 0) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px'
        }}>
            {suggestions.map(suggestion => (
                <div
                    key={suggestion.id}
                    role="status"
                    aria-live="polite"
                    style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: suggestion.type === 'warning' 
                            ? 'rgba(245, 158, 11, 0.1)' 
                            : suggestion.type === 'success'
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${
                            suggestion.type === 'warning' 
                            ? 'rgba(245, 158, 11, 0.3)' 
                            : suggestion.type === 'success'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : 'rgba(59, 130, 246, 0.3)'
                        }`,
                        color: 'white'
                    }}
                >
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>
                        {suggestion.icon}
                    </span>
                    <span style={{ flex: 1 }}>
                        {suggestion.message}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default PartySuggestions;

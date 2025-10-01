// src/hooks/useBattleRoyale.js
import { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import BattleRoyaleService from '../services/battleRoyaleService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useBattleRoyale = () => {
    const { db, user, appId, setMessageBox } = useContext(FirebaseContext);
    const [activeTournaments, setActiveTournaments] = useState([]);
    const [userTournaments, setUserTournaments] = useState([]);
    const [battleService] = useState(() => new BattleRoyaleService(db, appId));

    // Écouter les tournois actifs
    useEffect(() => {
        if (!user) return;

        const tournamentsRef = collection(db, `artifacts/${appId}/tournaments`);
        const activeQuery = query(
            tournamentsRef,
            where('status', '==', 'active'),
            where('endTime', '>', new Date())
        );

        const unsubscribe = onSnapshot(activeQuery, (snapshot) => {
            const tournaments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setActiveTournaments(tournaments);
            
            // Filtrer les tournois où l'utilisateur participe
            const userTourneys = tournaments.filter(t => 
                t.participants && t.participants.includes(user.uid)
            );
            setUserTournaments(userTourneys);
        });

        return unsubscribe;
    }, [user, db, appId]);

    // Calculer et attribuer automatiquement les points d'une soirée
    const processPartyForTournaments = async (partyData, selectedMode = 'balanced', additionalData = {}) => {
        if (userTournaments.length === 0) return null;

        const results = [];

        for (const tournament of userTournaments) {
            // Vérifier si le mode choisi est autorisé dans ce tournoi
            if (!tournament.modes.includes(selectedMode)) {
                continue;
            }

            try {
                // Calculer les points selon le mode
                const modePoints = await battleService.calculateModePoints(
                    user.uid,
                    selectedMode,
                    partyData,
                    additionalData
                );

                // Mettre à jour le score du tournoi
                await battleService.updateTournamentScore(
                    tournament.id,
                    user.uid,
                    modePoints,
                    selectedMode
                );

                results.push({
                    tournamentId: tournament.id,
                    tournamentName: tournament.name,
                    pointsEarned: modePoints.total,
                    breakdown: modePoints.breakdown,
                    mode: selectedMode
                });

                // Notification à l'utilisateur
                setMessageBox({
                    message: `🏆 +${modePoints.total} points dans ${tournament.name} (${selectedMode})!`,
                    type: 'success'
                });

            } catch (error) {
                console.error('Erreur traitement tournoi:', error);
            }
        }

        return results;
    };

    // Rejoindre un tournoi
    const joinTournament = async (tournamentId) => {
        try {
            const result = await battleService.joinTournament(tournamentId, user.uid);
            setMessageBox({ 
                message: result.success ? '🎉 Tournoi rejoint avec succès !' : result.message, 
                type: result.success ? 'success' : 'error' 
            });
            return result.success;
        } catch (error) {
            setMessageBox({ message: 'Erreur lors de la participation', type: 'error' });
            return false;
        }
    };

    // Obtenir le classement d'un tournoi
    const getTournamentLeaderboard = async (tournamentId) => {
        return await battleService.getTournamentLeaderboard(tournamentId);
    };

    // Créer un défi flash
    const createFlashChallenge = async (challengeData) => {
        try {
            const challengeId = await battleService.createFlashChallenge({
                ...challengeData,
                createdBy: user.uid
            });
            
            setMessageBox({ message: '⚡ Défi flash créé !', type: 'success' });
            return challengeId;
        } catch (error) {
            setMessageBox({ message: 'Erreur création défi', type: 'error' });
            return null;
        }
    };

    return {
        activeTournaments,
        userTournaments,
        processPartyForTournaments,
        joinTournament,
        getTournamentLeaderboard,
        createFlashChallenge,
        battleService
    };
};

export default useBattleRoyale;
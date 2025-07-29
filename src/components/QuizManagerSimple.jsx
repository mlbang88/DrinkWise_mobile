import React, { useState, useContext } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import QuizModal from './QuizModalSimple';

const QuizManagerSimple = ({ partyData, partyId, onQuizComplete }) => {
    const [showQuiz, setShowQuiz] = useState(true);
    const { db, user, appId, setMessageBox, userProfile } = useContext(FirebaseContext);

    console.log("🎯 QuizManagerSimple - Quiz simple démarré pour la soirée:", partyId);

    // Fonction pour finaliser le quiz et attribuer les récompenses
    const handleQuizComplete = async (responses) => {
        if (!partyData || !partyId || !user) {
            console.error("❌ Données manquantes pour finaliser le quiz");
            return;
        }

        console.log("🎯 Finalisation du quiz avec les réponses:", responses);

        try {
            // 1. Sauvegarder la soirée avec les réponses du quiz
            const partyDoc = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, partyId);
            const finalPartyData = {
                ...partyData,
                completedAt: new Date(),
                quizResponses: responses,
                status: 'completed'
            };

            await updateDoc(partyDoc, finalPartyData);
            console.log("✅ Soirée sauvegardée avec les réponses du quiz");

            // 2. Calculer et attribuer les récompenses
            const xpGained = gameplayConfig.xp.partyCompleted + (responses.length * gameplayConfig.xp.questionAnswered);
            
            if (userProfile) {
                const newXp = (userProfile.xp || 0) + xpGained;
                const newLevel = Math.floor(newXp / gameplayConfig.xp.levelThreshold) + 1;
                const newTotalParties = (userProfile.totalParties || 0) + 1;

                // Mettre à jour le profil utilisateur
                const userDoc = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
                await updateDoc(userDoc, {
                    xp: newXp,
                    level: newLevel,
                    totalParties: newTotalParties
                });

                // Vérifier les nouveaux badges
                const newBadges = badgeService.checkAllBadges(finalPartyData, userProfile);
                if (newBadges.length > 0) {
                    const updatedBadges = [...(userProfile.unlockedBadges || []), ...newBadges.map(b => b.id)];
                    await updateDoc(userDoc, {
                        unlockedBadges: updatedBadges
                    });
                    console.log("🏆 Nouveaux badges débloqués:", newBadges);
                }

                // Déclencher la notification de récompenses
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('showRewardNotification', {
                        detail: { xpGained, newBadges }
                    }));
                }, 500);

                console.log("🎉 Récompenses attribuées:", { xpGained, newBadges });
            }

            // 3. Fermer le quiz et signaler la completion
            setShowQuiz(false);
            onQuizComplete?.();

            setMessageBox?.({ 
                message: "Quiz terminé ! Récompenses attribuées !", 
                type: 'success' 
            });

        } catch (error) {
            console.error("❌ Erreur lors de la finalisation:", error);
            setMessageBox?.({ 
                message: "Erreur lors de la sauvegarde du quiz", 
                type: 'error' 
            });
        }
    };

    // Fonction pour fermer le quiz sans le compléter
    const handleQuizClose = () => {
        console.log("❌ Quiz fermé sans être complété");
        setShowQuiz(false);
        onQuizComplete?.();
    };

    // Ne pas afficher si le quiz est fermé
    if (!showQuiz) {
        return null;
    }

    return (
        <QuizModal
            partyData={partyData}
            partyId={partyId}
            onQuizComplete={handleQuizComplete}
            onClose={handleQuizClose}
        />
    );
};

export default QuizManagerSimple;

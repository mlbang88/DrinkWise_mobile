import React, { useState, useContext } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import QuizModal from './QuizModalSimple';

const QuizManagerSimple = ({ partyData, partyId, onQuizComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false); // Protection contre les doubles soumissions
    const { db, user, appId, setMessageBox, userProfile } = useContext(FirebaseContext);

    console.log("🎯 QuizManagerSimple - Quiz simple démarré pour la soirée:", partyId);
    console.log("📊 Données reçues:", { partyData, partyId });

    // Fonction pour finaliser le quiz et attribuer les récompenses
    const handleQuizComplete = async (responses) => {
        if (!partyData || !partyId || !user || isProcessing) {
            console.error("❌ Données manquantes pour finaliser le quiz ou traitement en cours");
            return;
        }

        setIsProcessing(true); // Bloquer les nouvelles exécutions
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
            const xpGained = gameplayConfig.xpPerParty + (responses.length * 10); // 10 XP par question
            
            if (userProfile) {
                const newXp = (userProfile.xp || 0) + xpGained;
                const newLevel = Math.floor(newXp / 500) + 1; // 500 XP par niveau
                const newTotalParties = (userProfile.totalParties || 0) + 1;

                // Mettre à jour le profil utilisateur
                const userDoc = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
                await updateDoc(userDoc, {
                    xp: newXp,
                    level: newLevel,
                    totalParties: newTotalParties
                });

                // Vérifier et attribuer les nouveaux badges automatiquement
                await badgeService.checkAndAwardBadges(db, user, userProfile, appId, finalPartyData, setMessageBox);
                
                console.log("� Récompenses et badges traités automatiquement");
            }

            // 3. Fermer le quiz et signaler la completion
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
        } finally {
            setIsProcessing(false); // Débloquer
        }
    };

    // Fonction pour fermer le quiz sans le compléter
    const handleQuizClose = () => {
        console.log("❌ Quiz fermé sans être complété");
        onQuizComplete?.();
    };

    console.log("✅ QuizManagerSimple - Affichage du quiz en cours...");

    return (
        <QuizModal
            onQuizComplete={handleQuizComplete}
            onClose={handleQuizClose}
        />
    );
};

export default QuizManagerSimple;

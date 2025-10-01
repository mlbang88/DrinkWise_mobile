import React, { useState, useContext } from 'react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import { challengeService } from '../services/challengeService';
import { levelUtils } from '../utils/levelUtils';
import QuizModal from './QuizModalSimple';

const QuizManagerSimple = ({ partyData, partyId, onQuizComplete, uploadingPhotos = false, photosCount = 0 }) => {
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

            console.log("💾 Données de la soirée à sauvegarder:", finalPartyData);
            await updateDoc(partyDoc, finalPartyData);
            console.log("✅ Soirée sauvegardée avec les réponses du quiz");

            // Petite pause pour s'assurer que la sauvegarde est complète
            await new Promise(resolve => setTimeout(resolve, 100));

            // 2. Calculer et attribuer les récompenses
            const oldXp = userProfile.xp || 0;
            const oldLevel = ExperienceService.calculateLevel(oldXp);
            
            if (userProfile) {
                // XP de base pour la soirée
                let xpGained = gameplayConfig.xpPerParty + (responses.length * gameplayConfig.xpPerQuizQuestion);
                
                // Récupérer toutes les soirées pour vérifier les challenges
                const userPartiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
                const partiesSnapshot = await getDocs(userPartiesRef);
                const allParties = partiesSnapshot.docs.map(doc => doc.data());
                
                // Ajouter la nouvelle soirée à la liste pour la vérification des challenges
                const allPartiesWithNew = [...allParties, finalPartyData];
                
                // Vérifier et attribuer les nouveaux badges automatiquement
                const { newBadgesCount, newBadges } = await badgeService.checkAndAwardBadges(db, user, userProfile, appId, finalPartyData, setMessageBox);
                
                // XP pour les badges débloqués
                if (newBadges && newBadges.length > 0) {
                    xpGained += newBadges.length * gameplayConfig.xpPerBadge;
                }
                
                // Vérifier les challenges
                const completedChallenges = userProfile.completedChallenges || {};
                console.log("🎯 Vérification des challenges:", {
                    allPartiesCount: allPartiesWithNew.length,
                    completedChallenges,
                    newPartyData: finalPartyData
                });
                
                const newChallenges = challengeService.checkCompletedChallenges(allPartiesWithNew, completedChallenges);
                console.log("✅ Challenges détectés:", newChallenges);
                
                // XP pour les challenges complétés
                if (newChallenges.length > 0) {
                    xpGained += newChallenges.length * gameplayConfig.xpPerChallenge;
                    console.log("🎖️ XP pour challenges:", newChallenges.length * gameplayConfig.xpPerChallenge);
                }
                
                // Calculer le nouveau niveau
                const newXp = oldXp + xpGained;
                const newLevel = ExperienceService.calculateLevel(newXp);
                const levelUpData = levelUtils.detectLevelUp(oldXp, newXp);
                
                const newTotalParties = (userProfile.totalParties || 0) + 1;

                // Mettre à jour le profil utilisateur
                const userDoc = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
                const updateData = {
                    xp: newXp,
                    level: newLevel,
                    totalParties: newTotalParties
                };
                
                // Ajouter les nouveaux challenges complétés
                if (newChallenges.length > 0) {
                    const updatedCompletedChallenges = { ...completedChallenges };
                    newChallenges.forEach(challengeId => {
                        updatedCompletedChallenges[challengeId] = true;
                    });
                    updateData.completedChallenges = updatedCompletedChallenges;
                }
                
                await updateDoc(userDoc, updateData);
                
                // Préparer les données à sauvegarder dans la soirée pour le feed
                const feedData = {};
                
                // Si des badges ont été débloqués, les ajouter à la soirée pour le feed
                if (newBadges && newBadges.length > 0) {
                    feedData.unlockedBadges = newBadges;
                    console.log("🏆 Badges ajoutés à la soirée:", newBadges);
                }
                
                // Si des challenges ont été complétés, les ajouter à la soirée pour le feed
                if (newChallenges.length > 0) {
                    feedData.completedChallenges = newChallenges;
                    console.log("🎯 Challenges complétés:", newChallenges);
                }
                
                // Si montée de niveau, l'ajouter à la soirée pour le feed
                if (levelUpData.leveledUp) {
                    feedData.levelUp = {
                        oldLevel: levelUpData.oldLevel,
                        newLevel: levelUpData.newLevel,
                        newLevelName: levelUpData.newLevelInfo.name,
                        levelsGained: levelUpData.levelsGained || 1
                    };
                    console.log("⬆️ MONTÉE DE NIVEAU DÉTECTÉE:", {
                        oldLevel: levelUpData.oldLevel,
                        newLevel: levelUpData.newLevel,
                        levelsGained: levelUpData.levelsGained,
                        oldXp,
                        newXp,
                        levelUpData
                    });
                } else {
                    console.log("🔍 Pas de montée de niveau:", {
                        oldLevel,
                        newLevel,
                        oldXp,
                        newXp,
                        levelUpData
                    });
                }
                
                // XP gagné pour affichage
                feedData.xpGained = xpGained;
                
                // Sauvegarder les événements dans la soirée
                if (Object.keys(feedData).length > 0) {
                    await updateDoc(partyDoc, feedData);
                }
                
                console.log("🎖️ Récompenses et badges traités automatiquement");
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
            uploadingPhotos={uploadingPhotos}
            photosCount={photosCount}
        />
    );
};

export default QuizManagerSimple;

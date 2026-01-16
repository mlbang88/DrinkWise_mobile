import React, { useState, useContext } from 'react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import { challengeService } from '../services/challengeService';
import { ExperienceService } from '../services/experienceService';
import { logger } from '../utils/logger';
import QuizModal from './QuizModalSimple';

const QuizManagerSimple = ({ partyData, partyId, onQuizComplete, uploadingPhotos = false, photosCount = 0 }) => {
    const [isProcessing, setIsProcessing] = useState(false); // Protection contre les doubles soumissions
    const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
    const { db, user, appId, setMessageBox, userProfile } = useContext(FirebaseContext);

    logger.info('QuizManagerSimple: Quiz simple démarré', { partyId, hasPartyData: !!partyData });

    // Fonction pour finaliser le quiz et attribuer les récompenses
    const handleQuizComplete = async (responses) => {
        if (!partyData || !partyId || !user || isProcessing) {
            logger.error('QuizManagerSimple: Données manquantes', { hasDb: !!db, hasUser: !!user, hasUserProfile: !!userProfile, isProcessing });
            return;
        }

        // Vérification du userProfile dès le début
        if (!userProfile) {
            logger.error('QuizManagerSimple: userProfile undefined dans handleQuizComplete');
            setMessageBox?.({ 
                message: "Erreur: profil utilisateur non chargé", 
                type: 'error' 
            });
            return;
        }

        // Vérification et validation des réponses
        if (!responses || !Array.isArray(responses)) {
            logger.error('QuizManagerSimple: responses invalid', { responses });
            setMessageBox?.({ 
                message: "Erreur: réponses du quiz invalides", 
                type: 'error' 
            });
            return;
        }

        setIsProcessing(true); // Bloquer les nouvelles exécutions
        logger.info('QuizManagerSimple: Finalisation du quiz', { responsesCount: Object.keys(responses).length });

        try {
            // 1. Sauvegarder la soirée avec les réponses du quiz
            const partyDoc = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, partyId);
            const finalPartyData = {
                ...partyData,
                completedAt: new Date(),
                quizResponses: responses,
                status: 'completed'
            };

            logger.info('QuizManagerSimple: Sauvegarde party data', { partyId, hasQuizResponses: !!responses });
            await updateDoc(partyDoc, finalPartyData);
            logger.info('QuizManagerSimple: Party data sauvegardée avec succès');

            // Petite pause pour s'assurer que la sauvegarde est complète
            await new Promise(resolve => setTimeout(resolve, 100));

            // 2. Calculer et attribuer les récompenses
            // Calculer l'XP depuis publicStats (source unique)
            const stats = {
                totalParties: userProfile.publicStats?.totalParties || 0,
                totalDrinks: userProfile.publicStats?.totalDrinks || 0,
                totalChallenges: userProfile.publicStats?.challengesCompleted || 0,
                totalBadges: userProfile.publicStats?.unlockedBadges?.length || 0,
                totalQuizQuestions: userProfile.publicStats?.totalQuizQuestions || 0
            };
            const oldXp = ExperienceService?.calculateTotalXP ? ExperienceService.calculateTotalXP(stats) : 0;
            const oldLevel = ExperienceService?.calculateLevel ? ExperienceService.calculateLevel(oldXp) : 1;
            
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
                logger.debug('QuizManagerSimple: Vérification challenges', {
                    allPartiesCount: allPartiesWithNew.length,
                    completedChallengesCount: Object.keys(completedChallenges).length
                });
                
                const newChallenges = challengeService.checkCompletedChallenges(allPartiesWithNew, completedChallenges);
                logger.info('QuizManagerSimple: Challenges détectés', { newChallengesCount: newChallenges.length });
                
                // XP pour les challenges complétés
                if (newChallenges.length > 0) {
                    xpGained += newChallenges.length * gameplayConfig.xpPerChallenge;
                    logger.info('QuizManagerSimple: XP pour challenges', { xpAmount: newChallenges.length * gameplayConfig.xpPerChallenge });
                }
                
                // Calculer le nouveau niveau
                const newXp = oldXp + xpGained;
                const newLevel = ExperienceService?.calculateLevel ? ExperienceService.calculateLevel(newXp) : 1;
                const leveledUp = newLevel > oldLevel;
                const newLevelName = ExperienceService?.getLevelName
                    ? ExperienceService.getLevelName(newLevel)
                    : `Niveau ${newLevel}`;
                const levelUpData = {
                    leveledUp,
                    oldLevel,
                    newLevel,
                    levelsGained: Math.max(0, newLevel - oldLevel),
                    newLevelInfo: {
                        level: newLevel,
                        name: newLevelName
                    }
                };
                
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
                    logger.info('QuizManagerSimple: Badges ajoutés', { badgesCount: newBadges.length });
                }
                
                // Si des challenges ont été complétés, les ajouter à la soirée pour le feed
                if (newChallenges.length > 0) {
                    feedData.completedChallenges = newChallenges;
                    logger.info('QuizManagerSimple: Challenges complétés', { challengesCount: newChallenges.length });
                }
                
                // Si montée de niveau, l'ajouter à la soirée pour le feed
                if (levelUpData.leveledUp) {
                    feedData.levelUp = {
                        oldLevel: levelUpData.oldLevel,
                        newLevel: levelUpData.newLevel,
                        newLevelName: levelUpData.newLevelInfo.name,
                        levelsGained: levelUpData.levelsGained || 1
                    };
                    logger.info('QuizManagerSimple: MONTÉE DE NIVEAU', {
                        oldLevel: levelUpData.oldLevel,
                        newLevel: levelUpData.newLevel,
                        levelsGained: levelUpData.levelsGained || 1
                    });
                } else {
                    logger.debug('QuizManagerSimple: Pas de montée de niveau', { oldLevel, newLevel });
                }
                
                // XP gagné pour affichage
                feedData.xpGained = xpGained;
                
                // Sauvegarder les événements dans la soirée
                if (Object.keys(feedData).length > 0) {
                    await updateDoc(partyDoc, feedData);
                }
                
                logger.info('QuizManagerSimple: Récompenses et badges traités automatiquement');
            }

            // 3. Fermer le quiz et signaler la completion avec les données de la soirée (incluant l'ID)
            const completePartyData = { ...finalPartyData, partyId };
            logger.info('QuizManagerSimple: Envoi données complètes', { partyId });
            setHasCompletedQuiz(true);
            onQuizComplete?.(completePartyData);

            setMessageBox?.({ 
                message: "Quiz terminé ! Récompenses attribuées !", 
                type: 'success' 
            });

        } catch (error) {
            logger.error('QuizManagerSimple: Erreur finalisation', { error: error.message });
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
        if (hasCompletedQuiz) {
            logger.info('QuizManagerSimple: Fermeture du quiz après complétion');
            setHasCompletedQuiz(false);
            return;
        }

        logger.info('QuizManagerSimple: Quiz fermé sans être complété');
        // Ne pas appeler onQuizComplete si le quiz n'est pas terminé
        // Cela évite de déclencher la génération de résumé sans données
        logger.info('QuizManagerSimple: Quiz annulé - pas de génération de résumé');
    };

    logger.debug('QuizManagerSimple: Affichage du quiz en cours');

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

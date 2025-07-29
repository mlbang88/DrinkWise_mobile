import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import QuizModal from './QuizModalSimple';

const QuizManager = () => {

    // Flag local pour bloquer toute réactivation pendant le nettoyage
    const isCleaningUpRef = React.useRef(false);

    // État persistant dans localStorage pour éviter la perte lors des re-rendus
    const [showQuiz, setShowQuiz] = useState(() => {
        try {
            return localStorage.getItem('drinkwise_quiz_active') === 'true';
        } catch {
            return false;
        }
    });

    const [partyData, setPartyData] = useState(() => {
        try {
            const data = localStorage.getItem('drinkwise_quiz_data');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    });

    const [partyId, setPartyId] = useState(() => {
        try {
            return localStorage.getItem('drinkwise_quiz_id') || null;
        } catch {
            return null;
        }
    });

    // Effet de sécurité : force la fermeture du quiz si le nettoyage est en cours
    useEffect(() => {
        if (isCleaningUpRef.current && showQuiz) {
            console.warn("🛡️ QuizManager - Nettoyage en cours, fermeture forcée du quiz (effet de sécurité)");
            setShowQuiz(false);
            setPartyData(null);
            setPartyId(null);
        }
    }, [showQuiz]);

    const { db, user, appId, setMessageBox, functions, userProfile } = useContext(FirebaseContext);

    console.log("🎯 QuizManager - MONTÉ/RE-MONTÉ");  // Logs réduits

    useEffect(() => {
        console.log("🎯 QuizManager - Initialisation du système de détection de quiz OPTIMISÉ");
        
        // Fonction pour détecter si un quiz doit être affiché
        const detectQuizToShow = () => {
            // Bloquer toute détection si nettoyage en cours
            if (isCleaningUpRef.current) {
                console.warn("⏳ QuizManager - Nettoyage en cours, détection quiz bloquée");
                return false;
            }
            try {
                const quizActive = localStorage.getItem('drinkwise_quiz_active') === 'true';
                const quizData = localStorage.getItem('drinkwise_quiz_data');
                const quizId = localStorage.getItem('drinkwise_quiz_id');

                console.log("🔍 QuizManager - Vérification localStorage:", { 
                    quizActive, 
                    hasQuizData: !!quizData, 
                    hasQuizId: !!quizId, 
                    currentShowQuiz: showQuiz 
                });

                // Si le quiz est actif et qu'on a des données, mais que showQuiz est false, l'activer
                if (quizActive && quizData && quizId && !showQuiz) {
                    console.log("🔍 Quiz détecté dans localStorage, activation...");

                    const parsedData = JSON.parse(quizData);
                    setPartyData(parsedData);
                    setPartyId(quizId);
                    setShowQuiz(true);

                    console.log("✅ Quiz activé avec les données:", { parsedData, quizId });

                    return true;
                } else if (quizActive && quizData && quizId && showQuiz) {
                    console.log("ℹ️ Quiz déjà affiché, pas de changement nécessaire");
                } else {
                    console.log("ℹ️ Conditions non remplies pour afficher le quiz:", {
                        quizActive,
                        hasData: !!quizData,
                        hasId: !!quizId,
                        showQuiz
                    });
                }

                return false;
            } catch (error) {
                console.error("❌ Erreur lors de la détection du quiz:", error);
                return false;
            }
        };

        // Détection initiale
        detectQuizToShow();

        // Écouter les changements dans le localStorage depuis d'autres composants
        const handleStorageChange = (e) => {
            // Bloquer si nettoyage en cours
            if (isCleaningUpRef.current) {
                console.warn("⏳ QuizManager - Nettoyage en cours, événement storage ignoré");
                return;
            }

            console.log("💾 QuizManager - Changement localStorage détecté:", e.key);
            
            // Re-détecter uniquement si c'est lié au quiz
            if (e.key === 'drinkwise_quiz_active' || 
                e.key === 'drinkwise_quiz_data' || 
                e.key === 'drinkwise_quiz_id' || 
                e.key === 'drinkwise_quiz_trigger') {
                
                setTimeout(detectQuizToShow, 100); // Petit délai pour laisser les autres valeurs se stabiliser
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [showQuiz]); // Dépendance sur showQuiz pour éviter les boucles

    // Fonction pour nettoyer complètement le localStorage du quiz
    const cleanupQuizStorage = useCallback(() => {
        try {
            // Marquer le nettoyage comme en cours
            isCleaningUpRef.current = true;
            
            console.log("🧹 QuizManager - Nettoyage localStorage quiz en cours...");
            
            // Nettoyer toutes les clés liées au quiz
            const quizKeys = [
                'drinkwise_quiz_active',
                'drinkwise_quiz_data', 
                'drinkwise_quiz_id',
                'drinkwise_quiz_from_party',
                'drinkwise_quiz_trigger',
                'drinkwise_quiz_party_state_before',
                'currentQuiz' // Ancienne clé, au cas où
            ];
            
            quizKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log("🧹 QuizManager - localStorage nettoyé, clés supprimées:", quizKeys);
            
            // Réinitialiser les états locaux
            setShowQuiz(false);
            setPartyData(null);
            setPartyId(null);
            
            console.log("✅ QuizManager - Nettoyage terminé");
            
            // Débloquer après un délai
            setTimeout(() => {
                isCleaningUpRef.current = false;
                console.log("🔓 QuizManager - Nettoyage débloqué");
            }, 1000);
            
        } catch (error) {
            console.error("❌ Erreur lors du nettoyage:", error);
            isCleaningUpRef.current = false;
        }
    }, []);

    // Fonction pour finaliser un quiz et déclencher les récompenses
    const finalizeQuizAndRewards = useCallback(async (responses) => {
        if (!partyData || !partyId || !user) {
            console.error("❌ Données manquantes pour finaliser le quiz");
            return;
        }

        console.log("🎯 Finalisation du quiz avec les réponses:", responses);
        console.log("📊 Données de la soirée:", partyData);

        try {
            // 1. Sauvegarder la soirée dans Firestore
            const partyDoc = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, partyId);
            const finalPartyData = {
                ...partyData,
                completedAt: new Date(),
                quizResponses: responses,
                status: 'completed'
            };

            await updateDoc(partyDoc, finalPartyData);
            console.log("✅ Soirée sauvegardée dans Firestore");

            // 2. Calculer et attribuer les récompenses XP et badges
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

            // 3. Nettoyer et fermer le quiz
            cleanupQuizStorage();

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
    }, [partyData, partyId, db, user, userProfile, appId, cleanupQuizStorage, setMessageBox]);

    // Fonction pour fermer le quiz manuellement
    const closeQuizManually = useCallback(() => {
        console.log("❌ Quiz fermé manuellement par l'utilisateur");
        
        // Marquer le nettoyage comme en cours pour éviter la réactivation
        isCleaningUpRef.current = true;
        
        cleanupQuizStorage();
        
        setTimeout(() => {
            isCleaningUpRef.current = false;
        }, 1000);
    }, [cleanupQuizStorage]);

    // Fonction pour fermer le quiz automatiquement après completion
    const closeQuizAfterCompletion = useCallback(() => {
        console.log("✅ Quiz fermé automatiquement après completion");
        
        // Marquer le nettoyage comme en cours
        isCleaningUpRef.current = true;
        
        cleanupQuizStorage();
        
        setTimeout(() => {
            isCleaningUpRef.current = false;
        }, 1000);
    }, [cleanupQuizStorage]);

    // Ne pas afficher le quiz si on n'a pas les données nécessaires
    if (!showQuiz || !partyData || !partyId) {
        return null;
    }

    return createPortal(
        <QuizModal
            partyData={partyData}
            partyId={partyId}
            onQuizComplete={finalizeQuizAndRewards}
            onClose={closeQuizManually}
        />,
        document.body
    );
};

export default QuizManager;

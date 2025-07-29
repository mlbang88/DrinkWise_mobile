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
            setFromPartyMode(false);
        }
    }, [showQuiz]);

    const { db, user, appId, setMessageBox, functions, userProfile, completeQuiz } = useContext(FirebaseContext);

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
                const quizFromParty = localStorage.getItem('drinkwise_quiz_from_party') === 'true';
                const quizTrigger = localStorage.getItem('drinkwise_quiz_trigger');

                // Log réduit - seulement si détection importante
                if (quizActive && quizData && quizId) {
                    console.log("🔍 QuizManager - Quiz disponible dans localStorage:", { 
                        quizActive, 
                        hasQuizData: !!quizData, 
                        hasQuizId: !!quizId, 
                        quizFromParty, 
                        currentShowQuiz: showQuiz 
                    });
                }

                // Si le quiz est actif et qu'on a des données, mais que showQuiz est false, l'activer
                if (quizActive && quizData && quizId && !showQuiz) {
                    console.log("🔍 Quiz détecté dans localStorage, activation...");

                    const parsedData = JSON.parse(quizData);
                    setPartyData(parsedData);
                    setPartyId(quizId);
                    setFromPartyMode(quizFromParty);
                    setShowQuiz(true);

                    console.log("✅ Quiz activé avec les données:", { parsedData, quizId, quizFromParty });

                    return true;
                }

                return false;
            } catch (error) {
                console.error("❌ Erreur détection quiz:", error);
                return false;
            }
        };
        
        // Vérifier immédiatement SEULEMENT si pas déjà ouvert
        if (!showQuiz) {
            console.log("🎯 QuizManager - Vérification immédiate (quiz fermé)...");
            detectQuizToShow();
        } else {
            console.log("🎯 QuizManager - Quiz déjà ouvert, pas de vérification");
        }
        
        // Polling MOINS fréquent et intelligent
        const pollInterval = setInterval(() => {
            // Seulement si le quiz n'est pas déjà ouvert
            if (!showQuiz) {
                const quizActive = localStorage.getItem('drinkwise_quiz_active') === 'true';
                const quizData = localStorage.getItem('drinkwise_quiz_data');
                const quizId = localStorage.getItem('drinkwise_quiz_id');
                
                if (quizActive && quizData && quizId) {
                    console.log("🔍 Quiz détecté via polling, activation...");
                    detectQuizToShow();
                }
            }
        }, 1000); // Polling encore moins fréquent pour éviter la boucle
        
        // Event listener pour les événements storage - PLUS intelligent
        const handleStorageChange = (event) => {
            // Seulement si le quiz n'est pas déjà ouvert ET si c'est un événement quiz
            if (!showQuiz && event.key && event.key.includes('drinkwise_quiz')) {
                console.log("📦 QuizManager - Changement localStorage quiz détecté");
                detectQuizToShow();
            }
        };
        
        // Event listener pour l'événement personnalisé quizTrigger - PLUS intelligent
        const handleQuizTrigger = (event) => {
            // Seulement si le quiz n'est pas déjà ouvert
            if (!showQuiz) {
                console.log("🎯 QuizManager - Événement quizTrigger reçu:", event.detail);
                detectQuizToShow();
            } else {
                console.log("🎯 QuizManager - QuizTrigger ignoré (quiz déjà ouvert)");
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('quizTrigger', handleQuizTrigger);
        
        console.log("✅ QuizManager - Système de détection OPTIMISÉ activé:", {
            polling: "1000ms",
            storageListener: true,
            quizTriggerListener: true,
            currentShowQuiz: showQuiz
        });
        
        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('quizTrigger', handleQuizTrigger);
            console.log("🚫 QuizManager - DÉMONTAGE - Système de détection désactivé");
        };
    }, [showQuiz]);  // Garder showQuiz pour la logique conditionnelle mais éviter les boucles

    // Effet pour surveiller la fermeture du quiz et forcer le nettoyage
    useEffect(() => {
        if (!showQuiz && (partyData || partyId)) {
            console.log("🧹 QuizManager - Détection d'état incohérent, nettoyage forcé");
            setPartyData(null);
            setPartyId(null);
            setFromPartyMode(false);
            try {
                localStorage.removeItem('drinkwise_quiz_data');
                localStorage.removeItem('drinkwise_quiz_id');
                localStorage.removeItem('drinkwise_quiz_active');
                localStorage.removeItem('drinkwise_quiz_from_party');
                localStorage.removeItem('drinkwise_quiz_trigger');
                localStorage.removeItem('drinkwise_quiz_party_state_before');
                localStorage.removeItem('currentQuiz');
            } catch (error) {
                console.error("❌ Erreur nettoyage forcé:", error);
            }
        }
    }, [showQuiz, partyData, partyId]);

    const handleQuizComplete = useCallback(async (result) => {
        console.log("🎯 QuizManager - Quiz terminé, calcul des récompenses...");
        
        // Calculer l'XP de base
        const xpGained = gameplayConfig.xpPerParty;
        let newBadges = [];
        try {
            // Essayer de générer le résumé avec IA (fonction Cloud avec CORS corrigé)
            try {
                const generateSummary = httpsCallable(functions, 'generateSummary');
                const summaryResult = await generateSummary({
                    partyData: partyData,
                    drunkLevel: result,
                    appId: appId
                });
                if (summaryResult.data?.success) {
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, {
                        [`parties.${partyId}.summary`]: summaryResult.data.summary
                    });
                    console.log("✅ Résumé généré avec IA:", summaryResult.data.summary.substring(0, 50) + "...");
                } else {
                    console.log("⚠️ Échec génération résumé:", summaryResult.data?.error);
                }
            } catch (summaryError) {
                console.log("⚠️ Erreur résumé ignorée:", summaryError.message);
            }
            // Essayer de vérifier les badges (optionnel)
            try {
                console.log("🎖️ Vérification des badges...");
                const badgeResult = await badgeService.checkAndAwardBadges(db, user, userProfile, appId, partyData);
                newBadges = badgeResult?.newBadges || [];
                console.log("✅ Badges vérifiés");
            } catch (badgeError) {
                console.log("⚠️ Erreur badges ignorée:", badgeError.message);
            }
            // Mettre à jour le profil utilisateur avec l'XP (critique)
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const updateData = {
                    [`appProfiles.${appId}.xp`]: (userProfile.xp || 0) + xpGained,
                    [`appProfiles.${appId}.lastActivity`]: new Date().toISOString()
                };
                await updateDoc(userDocRef, updateData);
                console.log("✅ Profil mis à jour avec +", xpGained, "XP");
            } catch (xpError) {
                console.log("⚠️ Erreur XP ignorée:", xpError.message);
                // En cas d'erreur, on garde quand même l'XP localement pour l'affichage
            }
        } catch (error) {
            console.error("❌ Erreur générale:", error);
        }
        
        // Nettoyer localStorage IMMÉDIATEMENT
        try {
            localStorage.removeItem('drinkwise_quiz_data');
            localStorage.removeItem('drinkwise_quiz_id');
            localStorage.removeItem('drinkwise_quiz_active');
            localStorage.removeItem('drinkwise_quiz_from_party');
            localStorage.removeItem('drinkwise_quiz_trigger');
            localStorage.removeItem('drinkwise_quiz_party_state_before');
            localStorage.removeItem('currentQuiz');
            console.log("🧹 localStorage nettoyé");
        } catch (error) {
            console.error("❌ Erreur nettoyage localStorage:", error);
        }
        
        // Fermer l'état React IMMÉDIATEMENT
        setShowQuiz(false);
        setPartyData(null);
        setPartyId(null);
        setFromPartyMode(false);
        console.log("🔒 États React fermés");

        // Boucle de sécurité pour forcer le nettoyage tant que le quiz reste actif

        // IMPORTANT : TOUS les quiz ferment le mode soirée, peu importe leur origine
        const partyStateBefore = localStorage.getItem('drinkwise_quiz_party_state_before');
        let partyStateBeforeData = null;
        try {
            partyStateBeforeData = partyStateBefore ? JSON.parse(partyStateBefore) : null;
        } catch (e) {
            console.warn("⚠️ Erreur parsing état avant quiz:", e);
        }
        
        console.log("🎯 Fermeture automatique du mode soirée après tout quiz");
        console.log("📊 Origine quiz:", fromPartyMode ? "mode soirée" : "formulaire normal");
        console.log("📊 État avant quiz:", partyStateBeforeData);
        
        if (typeof completeQuiz === 'function') {
            // Appeler TOUJOURS la fonction, même si le mode soirée semble fermé
            // (au cas où il y aurait un désalignement d'état)
            completeQuiz();
            console.log("✅ Mode soirée fermé automatiquement via completeQuiz (origine:", fromPartyMode ? "mode soirée" : "formulaire normal", ")");
            
            // Attendre que React mette à jour l'état avant de déclencher l'événement
            setTimeout(() => {
                const partyCompletedEvent = new CustomEvent('partyCompleted', {
                    detail: { partyData, partyId }
                });
                window.dispatchEvent(partyCompletedEvent);
                console.log("📤 Événement partyCompleted envoyé depuis quiz terminé (origine:", fromPartyMode ? "mode soirée" : "formulaire normal", ")");
            }, 100); // Délai réduit mais suffisant pour React
        } else {
            console.error("❌ completeQuiz n'est pas disponible");
        }

        // Déclencher un événement global pour la notification
        const notificationEvent = new CustomEvent('showRewardNotification', {
            detail: { xpGained, newBadges }
        });
        window.dispatchEvent(notificationEvent);
        console.log("✅ Événement notification envoyé:", { xpGained, newBadges });
    }, [partyData, partyId, db, user, userProfile, appId, functions, completeQuiz]);

    const handleQuizClose = useCallback(() => {
        console.log("🎯 QuizManager - Fermeture du quiz demandée");
        
        // Nettoyer localStorage IMMÉDIATEMENT
        try {
            localStorage.removeItem('drinkwise_quiz_data');
            localStorage.removeItem('drinkwise_quiz_id');
            localStorage.removeItem('drinkwise_quiz_active');
            localStorage.removeItem('drinkwise_quiz_from_party');
            localStorage.removeItem('drinkwise_quiz_trigger');
            localStorage.removeItem('drinkwise_quiz_party_state_before');
            localStorage.removeItem('currentQuiz');
            console.log("🧹 localStorage nettoyé lors de la fermeture");
        } catch (error) {
            console.error("❌ Erreur nettoyage localStorage:", error);
        }
        
        // Fermer l'état React IMMÉDIATEMENT
        setShowQuiz(false);
        setPartyData(null);
        setPartyId(null);
        setFromPartyMode(false);
        console.log("🔒 États React fermés lors de la fermeture");
        
        // Forcer un re-render immédiat avec un timeout de sécurité
        setTimeout(() => {
            console.log("🛡️ Vérification sécurité - forcer fermeture manuelle si encore ouvert");
            setShowQuiz(false);
            setPartyData(null);
            setPartyId(null);
            setFromPartyMode(false);
        }, 100);
        
        // IMPORTANT : TOUS les quiz ferment le mode soirée, peu importe leur origine
        const partyStateBefore = localStorage.getItem('drinkwise_quiz_party_state_before');
        let partyStateBeforeData = null;
        try {
            partyStateBeforeData = partyStateBefore ? JSON.parse(partyStateBefore) : null;
        } catch (e) {
            console.warn("⚠️ Erreur parsing état avant quiz:", e);
        }
        
        console.log("🎯 Fermeture manuelle du mode soirée après fermeture quiz");
        console.log("📊 Origine quiz:", fromPartyMode ? "mode soirée" : "formulaire normal");
        console.log("📊 État avant quiz:", partyStateBeforeData);
        
        if (typeof completeQuiz === 'function') {
            completeQuiz();
            console.log("✅ Mode soirée fermé manuellement via completeQuiz (origine:", fromPartyMode ? "mode soirée" : "formulaire normal", ")");
            // Attendre que React mette à jour l'état avant de déclencher l'événement
            setTimeout(() => {
                const event = new CustomEvent('partyCompleted', {
                    detail: { partyData, partyId }
                });
                window.dispatchEvent(event);
                console.log("📤 Quiz fermé manuellement (origine:", fromPartyMode ? "mode soirée" : "formulaire normal", ")");
            }, 200); // Délai augmenté pour garantir la synchro React
        } else {
            console.error("❌ completeQuiz n'est pas disponible lors de la fermeture manuelle");
        }
    }, [partyData, partyId, fromPartyMode, completeQuiz]);

    // Mémoriser le quiz pour éviter les re-renders inutiles
    const quizModal = useMemo(() => {
        // Vérification TRÈS stricte : si showQuiz est false, JAMAIS afficher le quiz
        if (!showQuiz) {
            return null;
        }
        
        if (!partyData) {
            console.log("🚫 QuizManager - Pas de données de soirée");
            // Si showQuiz est true mais pas de données, forcer la fermeture
            setShowQuiz(false);
            return null;
        }

        console.log("✅ QuizManager - Rendu du QuizModal");
        return (
            <QuizModal 
                onQuizComplete={handleQuizComplete}
                onClose={handleQuizClose}
            />
        );
    }, [showQuiz, partyData, handleQuizComplete, handleQuizClose]);

    // Debug - logs très réduits, seulement pour les changements importants
    const shouldLog = showQuiz; // Log seulement quand le quiz est ouvert
    
    if (shouldLog) {
        let localStorageQuizActive;
        try {
            localStorageQuizActive = localStorage.getItem('drinkwise_quiz_active');
        } catch {
            localStorageQuizActive = null;
        }
        
        console.log("🎯 QuizManager - États (quiz ouvert):", { 
            showQuiz, 
            hasPartyData: !!partyData, 
            localStorageActive: localStorageQuizActive 
        });
    }

    // VÉRIFICATION FINALE : Si showQuiz est false, retourner ABSOLUMENT null
    if (!showQuiz) {
        return null;
    }

    return quizModal ? createPortal(quizModal, document.body) : null;
};

export default QuizManager;

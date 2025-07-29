import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import QuizModal from './QuizModalSimple';
import RewardNotification from './RewardNotification';

const QuizManager = () => {
    const { db, user, appId, setMessageBox, functions, userProfile } = useContext(FirebaseContext);
    const [showQuiz, setShowQuiz] = useState(false);
    const [partyData, setPartyData] = useState(null);
    const [partyId, setPartyId] = useState(null);
    const [showRewardNotification, setShowRewardNotification] = useState(false);
    const [rewardData, setRewardData] = useState({ xpGained: 0, newBadges: [] });

    useEffect(() => {
        // Écouter l'événement personnalisé pour afficher le quiz
        const handleShowQuiz = (event) => {
            console.log("🎯 QuizManager - Événement reçu:", event.detail);
            setPartyData(event.detail.partyData);
            setPartyId(event.detail.partyId);
            setShowQuiz(true);
        };

        window.addEventListener('showQuiz', handleShowQuiz);

        // Vérifier localStorage au montage
        const shouldShowQuiz = localStorage.getItem('showQuiz') === 'true';
        
        if (shouldShowQuiz) {
            const storedPartyData = localStorage.getItem('lastPartyData');
            const storedPartyId = localStorage.getItem('lastPartyId');
            if (storedPartyData && storedPartyId) {
                console.log("🔄 QuizManager - Restauration depuis localStorage");
                setPartyData(JSON.parse(storedPartyData));
                setPartyId(storedPartyId);
                setShowQuiz(true);
            }
        }

        return () => {
            window.removeEventListener('showQuiz', handleShowQuiz);
        };
    }, []);

    const generatePartySummary = async (partyDetails, docId) => {
        if (!functions) {
            console.log("⚠️ Cloud Functions non disponibles");
            return;
        }

        const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');
        const prompt = `Génère un résumé de soirée amusant et mémorable (max 3 phrases) basé sur: ${JSON.stringify(partyDetails)}. Sois créatif et humoristique.`;
        
        try {
            const result = await callGeminiAPI({ prompt });
            if (result.data.text) {
                const summary = result.data.text;
                const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);
                await updateDoc(partyRef, { summary });
                console.log("✅ Résumé sauvegardé:", summary);
            }
        } catch (error) { 
            console.error("❌ Erreur génération résumé via Cloud Function:", error); 
        }
    };

    const handleQuizComplete = async (result) => {
        console.log("🎯 QuizManager - Quiz terminé, calcul des récompenses...");
        
        try {
            // Générer le résumé avec IA
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
                console.log("✅ Résumé généré");
            }

            // Vérifier les badges
            console.log("🎖️ Vérification des badges...");
            const newBadges = await badgeService.checkAndAwardBadges(user, userProfile, appId, partyData);
            console.log("✅ Badges vérifiés, nouveaux badges:", newBadges.length, newBadges);

            // Calculer l'XP
            const xpGained = gameplayConfig.xpPerParty;
            console.log("💰 XP gagnés:", xpGained);

            // Mettre à jour le profil utilisateur avec l'XP
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                [`appProfiles.${appId}.xp`]: userProfile.xp + xpGained
            });
            console.log("✅ Profil mis à jour");

            // Afficher la notification de récompense
            setRewardData({ xpGained, newBadges });
            setShowRewardNotification(true);

            // Fermer le quiz
            setShowQuiz(false);
            setPartyData(null);
            setPartyId(null);
            localStorage.removeItem('currentQuiz');

        } catch (error) {
            console.error("❌ Erreur lors du traitement des récompenses:", error);
            setMessageBox({ 
                message: "Erreur lors du calcul des récompenses", 
                type: "error" 
            });
        }
    };

    const handleQuizClose = () => {
        console.log("🎯 QuizManager - Fermeture du quiz");
        
        // Nettoyer localStorage
        localStorage.removeItem('showQuiz');
        localStorage.removeItem('lastPartyData');
        localStorage.removeItem('lastPartyId');
        
        setShowQuiz(false);
        setPartyData(null);
        setPartyId(null);
        
        // Émettre un événement pour informer que le quiz est terminé
        window.dispatchEvent(new CustomEvent('quizCompleted', { 
            detail: { partyData, partyId } 
        }));
    };

    const handleResultsClose = () => {
        console.log("🎯 QuizManager - Fermeture des résultats");
        setShowResults(false);
        setPartyResults({ quizTitle: '', xpGained: 0, newBadges: [] });
        
        // Émettre un événement pour informer que tout est terminé
        window.dispatchEvent(new CustomEvent('quizCompleted'));
    };

    // Debug des états au rendu
    console.log("🎯 QuizManager - États actuels:", { showQuiz });

    // Affichage du quiz
    if (!showQuiz) {
        console.log("🚫 QuizManager - Pas de quiz à afficher");
        return null;
    }

    console.log("✅ QuizManager - Rendu du QuizModal");
    return (
        <>
            {createPortal(
                <QuizModal 
                    onQuizComplete={handleQuizComplete}
                    onClose={handleQuizClose}
                />,
                document.body
            )}
            
            {showRewardNotification && (
                <RewardNotification
                    xpGained={rewardData.xpGained}
                    newBadges={rewardData.newBadges}
                    onClose={() => setShowRewardNotification(false)}
                />
            )}
        </>
    );
};

export default QuizManager;

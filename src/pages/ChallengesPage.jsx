import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import LoadingSpinner from '../components/LoadingSpinner';

const ChallengesPage = () => {
    const { db, user, appId, userProfile } = useContext(FirebaseContext);
    const [loading, setLoading] = useState(true);
    const [parties, setParties] = useState([]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const partiesData = snapshot.docs.map(doc => doc.data());
            setParties(partiesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching parties for challenges:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, user, appId]);

    // Fonction pour sauvegarder les défis complétés
    const saveCompletedChallenges = async (challenges) => {
        if (!user || !userProfile) return;

        const completedChallenges = {};
        challenges.forEach(challenge => {
            if (challenge.completed) {
                completedChallenges[challenge.id] = true;
            }
        });

        // Fusionner avec les défis déjà complétés
        const updatedCompletedChallenges = {
            ...(userProfile.completedChallenges || {}),
            ...completedChallenges
        };

        try {
            const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            await updateDoc(userProfileRef, {
                completedChallenges: updatedCompletedChallenges
            });
            console.log("✅ Défis complétés sauvegardés:", updatedCompletedChallenges);
        } catch (error) {
            console.error("❌ Erreur sauvegarde défis:", error);
        }
    };

    const now = new Date();
    
    // Calcul correct du début de semaine (lundi)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si dimanche, reculer de 6 jours, sinon reculer de (jour - 1)
    startOfWeek.setDate(now.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calcul correct du début du mois (1er du mois)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    console.log("📅 Période semaine:", startOfWeek.toLocaleDateString(), "à", now.toLocaleDateString());
    console.log("📅 Période mois:", startOfMonth.toLocaleDateString(), "à", now.toLocaleDateString());

    const weeklyParties = parties.filter(p => {
        const partyDate = p.timestamp.toDate();
        return partyDate >= startOfWeek && partyDate <= now;
    });
    
    const monthlyParties = parties.filter(p => {
        const partyDate = p.timestamp.toDate();
        return partyDate >= startOfMonth && partyDate <= now;
    });

    console.log("📊 Soirées cette semaine:", weeklyParties.length);
    console.log("📊 Soirées ce mois:", monthlyParties.length);

    const weeklyStats = badgeService.calculateGlobalStats(weeklyParties);
    const monthlyStats = badgeService.calculateGlobalStats(monthlyParties);

    // Défis de la semaine avec données actuelles
    const weeklyChallenges = [
        {
            id: 'tour_de_chauffe',
            title: 'Tour de chauffe',
            description: 'Boire 10 verres cette semaine',
            target: 10,
            current: Math.min(weeklyStats.totalDrinks || 0, 10),
            xp: 50,
            icon: '🍺',
            completed: (weeklyStats.totalDrinks || 0) >= 10
        },
        {
            id: 'le_social',
            title: 'Le Social',
            description: 'Participer à 2 soirées cette semaine',
            target: 2,
            current: Math.min(weeklyParties.length || 0, 2),
            xp: 75,
            icon: '👥',
            completed: (weeklyParties.length || 0) >= 2
        },
        {
            id: 'le_sage',
            title: 'Le Sage',
            description: 'Passer une semaine sans vomir',
            target: 0,
            current: weeklyStats.vomitCount || 0,
            xp: 100,
            icon: '🛡️',
            completed: (weeklyStats.vomitCount || 0) === 0,
            reverse: true // Pour ce défi, on veut 0 vomissement
        }
    ];

    // Défis du mois - 3 défis au total
    const monthlyChallenges = [
        {
            id: 'marathonien_du_mois',
            title: 'Marathonien du mois',
            description: 'Participer à 8 soirées ce mois-ci',
            target: 8,
            current: Math.min(monthlyParties.length || 0, 8),
            xp: 200,
            icon: '🏃',
            completed: (monthlyParties.length || 0) >= 8
        },
        {
            id: 'expert_cocktail',
            title: 'Expert Cocktail',
            description: 'Boire 5 cocktails différents ce mois',
            target: 5,
            current: Math.min(Object.keys(monthlyStats.drinkTypes || {}).length || 0, 5),
            xp: 150,
            icon: '🍸',
            completed: (Object.keys(monthlyStats.drinkTypes || {}).length || 0) >= 5
        },
        {
            id: 'moderation_master',
            title: 'Maître de la Modération',
            description: 'Maintenir une moyenne de moins de 3 verres par soirée',
            target: 3,
            current: monthlyParties.length > 0 ? Math.round(((monthlyStats.totalDrinks || 0) / monthlyParties.length) * 10) / 10 : 0,
            xp: 250,
            icon: '⚖️',
            completed: monthlyParties.length > 0 ? (monthlyStats.totalDrinks || 0) / monthlyParties.length < 3 : false,
            reverse: true // Pour ce défi, on veut moins que la target
        }
    ];

    // Sauvegarder automatiquement les défis complétés
    useEffect(() => {
        if (!user || !userProfile || parties.length === 0) return;
        
        const allChallenges = [...weeklyChallenges, ...monthlyChallenges];
        saveCompletedChallenges(allChallenges);
    }, [parties, user, userProfile]);

    const ChallengeItem = ({ challenge }) => {
        let progress, displayCurrent, displayTarget;
        
        if (challenge.reverse) {
            if (challenge.id === 'le_sage') {
                // Pour "Le Sage", 0 vomissement = 100% de réussite
                progress = challenge.current === 0 ? 100 : 0;
                displayCurrent = challenge.current;
                displayTarget = challenge.target;
            } else if (challenge.id === 'moderation_master') {
                // Pour "Maître de la Modération", moins de 3 verres par soirée
                progress = challenge.completed ? 100 : (challenge.current / challenge.target) * 100;
                displayCurrent = challenge.current;
                displayTarget = `< ${challenge.target}`;
            }
        } else {
            progress = Math.min((challenge.current / challenge.target) * 100, 100);
            displayCurrent = challenge.current;
            displayTarget = challenge.target;
        }

        return (
            <div className={`mobile-card mb-4 relative ${
                challenge.completed ? 'border-green-500' : 'border-purple-600'
            }`}
                style={{
                    borderLeft: challenge.completed ? '4px solid #10b981' : '4px solid #8b45ff',
                    border: challenge.completed ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.1)'
                }}>
                <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className={`text-4xl flex items-center justify-center w-12 h-12 rounded-xl ${
                        challenge.completed ? 'bg-green-500 bg-opacity-20' : 'bg-purple-600 bg-opacity-20'
                    }`}>
                        {challenge.icon}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1">
                        <h3 className="text-white text-lg font-semibold mb-2">
                            {challenge.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            {challenge.description}
                        </p>

                        {/* Barre de progression */}
                        <div className="bg-gray-700 rounded-lg h-2 w-full overflow-hidden mb-2">
                            <div 
                                className={`h-full rounded-lg transition-all duration-300 ${
                                    challenge.completed ? 'bg-green-500' : 'bg-purple-600'
                                }`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        {/* Progression numérique et XP */}
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">
                                {displayCurrent} / {displayTarget}
                            </span>
                            <span className="text-yellow-400 text-sm font-semibold">
                                +{challenge.xp} XP
                            </span>
                        </div>
                    </div>

                    {/* Statut de complétion */}
                    {challenge.completed && (
                        <div className="text-green-500 text-2xl">
                            ✓
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="mobile-container">
            {/* Header mobile */}
            <div className="mobile-header">
                <h2 className="mobile-title">
                    Défis & Challenges
                </h2>
            </div>

            <div className="mobile-main">
                {/* Défis de la Semaine */}
                <div className="mb-10">
                    <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-3">
                        📅 Défis de la Semaine
                    </h2>
                    {weeklyChallenges.map(challenge => (
                        <ChallengeItem key={challenge.id} challenge={challenge} isWeekly={true} />
                    ))}
                </div>

                {/* Défis du Mois */}
                <div>
                    <h2 className="text-white text-2xl font-semibold mb-6 flex items-center gap-3">
                        ⭐ Défis du Mois
                    </h2>
                    {monthlyChallenges.map(challenge => (
                        <ChallengeItem key={challenge.id} challenge={challenge} isWeekly={false} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChallengesPage;
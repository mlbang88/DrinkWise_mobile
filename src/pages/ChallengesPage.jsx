import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, increment, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import { ExperienceService } from '../services/experienceService';
import { getWeekId, getMonthId } from '../utils/helpers';
import { challengeList } from '../utils/data';
import LoadingSpinner from '../components/LoadingSpinner';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';
import { logger } from '../utils/logger.js';

const ChallengesPage = () => {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    const [loading, setLoading] = useState(true);
    const [parties, setParties] = useState([]);

    useEffect(() => {
        if (!user || !db) return;
        
        let unsubscribe = null;
        
        // Petit délai pour éviter les conflits de listeners
        const timeoutId = setTimeout(() => {
            const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const partiesData = snapshot.docs.map(doc => doc.data());
                setParties(partiesData);
                setLoading(false);
            }, (error) => {
                logger.error("Error fetching parties for challenges", { error: error.message });
                setLoading(false);
            });
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) {
                try {
                    unsubscribe();
                } catch (error) {
                    console.warn('⚠️ Erreur nettoyage listener challenges:', error);
                }
            }
        };
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
            logger.info("Défis complétés sauvegardés", { challengesCount: updatedCompletedChallenges.length });
        } catch (error) {
            logger.error("Erreur sauvegarde défis", { error: error.message });
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

    logger.debug("Période semaine", { startOfWeek: startOfWeek.toLocaleDateString(), now: now.toLocaleDateString() });
    logger.debug("Période mois", { startOfMonth: startOfMonth.toLocaleDateString(), now: now.toLocaleDateString() });

    const weeklyParties = parties.filter(p => {
        const partyDate = p.timestamp.toDate();
        return partyDate >= startOfWeek && partyDate <= now;
    });
    
    const monthlyParties = parties.filter(p => {
        const partyDate = p.timestamp.toDate();
        return partyDate >= startOfMonth && partyDate <= now;
    });

    logger.debug("Soirées cette semaine", { weeklyPartiesCount: weeklyParties.length });
    logger.debug("Soirées ce mois", { monthlyPartiesCount: monthlyParties.length });

    const weeklyStats = ExperienceService.calculateRealStats(weeklyParties, userProfile);
    const monthlyStats = ExperienceService.calculateRealStats(monthlyParties, userProfile);

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

    const ChallengeItem = ({ challenge, isWeekly = true }) => {
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
            <div style={{
                background: challenge.completed 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(139, 69, 255, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                backdropFilter: 'blur(10px)',
                border: challenge.completed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(139, 69, 255, 0.4)',
                borderLeft: challenge.completed ? '4px solid #10b981' : '4px solid #8b45ff',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '20px',
                position: 'relative',
                boxShadow: challenge.completed 
                    ? '0 8px 32px rgba(16, 185, 129, 0.1)'
                    : '0 8px 32px rgba(139, 69, 255, 0.1)',
                transition: 'all 0.3s ease'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                }}>
                    {/* Icône */}
                    <div style={{
                        fontSize: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '60px',
                        height: '60px',
                        background: challenge.completed 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                            : 'linear-gradient(135deg, rgba(139, 69, 255, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                        backdropFilter: 'blur(8px)',
                        border: challenge.completed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(139, 69, 255, 0.4)',
                        borderRadius: '16px',
                        boxShadow: challenge.completed 
                            ? '0 4px 16px rgba(16, 185, 129, 0.2)'
                            : '0 4px 16px rgba(139, 69, 255, 0.2)'
                    }}>
                        {challenge.icon}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            background: challenge.completed 
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: '18px',
                            fontWeight: '700',
                            margin: '0 0 8px 0',
                            letterSpacing: '-0.01em'
                        }}>
                            {challenge.title}
                        </h3>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px',
                            margin: '0 0 16px 0',
                            lineHeight: '1.5',
                            fontWeight: '500'
                        }}>
                            {challenge.description}
                        </p>

                        {/* Barre de progression */}
                        <div style={{
                            background: 'rgba(55, 65, 81, 0.6)',
                            borderRadius: '12px',
                            height: '12px',
                            width: '100%',
                            overflow: 'hidden',
                            marginBottom: '12px',
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{
                                background: challenge.completed 
                                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                    : 'linear-gradient(90deg, #8b45ff 0%, #7c3aed 100%)',
                                height: '100%',
                                width: `${progress}%`,
                                borderRadius: '12px',
                                transition: 'width 0.5s ease',
                                boxShadow: challenge.completed 
                                    ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                                    : '0 2px 8px rgba(139, 69, 255, 0.4)'
                            }}></div>
                        </div>

                        {/* Progression numérique */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(8px)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <span style={{
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}>
                                    {displayCurrent} / {displayTarget}
                                </span>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
                                backdropFilter: 'blur(8px)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}>
                                <span style={{
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontSize: '13px',
                                    fontWeight: '700'
                                }}>
                                    ✨ +{challenge.xp} XP
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Statut de complétion */}
                    {challenge.completed && (
                        <div style={{
                            color: '#10b981',
                            fontSize: '24px'
                        }}>
                            ✓
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <LoadingSpinner />;

    const backgroundStyle = {
        minHeight: '100vh',
        background: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1543007629-5c4e8a83ba4c") center/cover',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        color: 'white'
    };

    return (
        <div style={backgroundStyle}>
            {/* Défis de la Semaine */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.008) 100%)',
                backdropFilter: 'blur(4px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '28px',
                marginBottom: '32px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
            }}>
                <h2 style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(22px, 6vw, 28px)',
                    fontWeight: '800',
                    margin: '0 0 28px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                    justifyContent: 'center'
                }}>
                    📅 Défis de la Semaine
                </h2>
                {weeklyChallenges.map(challenge => (
                    <ChallengeItem key={challenge.id} challenge={challenge} isWeekly={true} />
                ))}
            </div>

            {/* Défis du Mois */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.008) 100%)',
                backdropFilter: 'blur(4px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '28px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
            }}>
                <h2 style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(22px, 6vw, 28px)',
                    fontWeight: '800',
                    margin: '0 0 28px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                    justifyContent: 'center'
                }}>
                    ⭐ Défis du Mois
                </h2>
                {monthlyChallenges.map(challenge => (
                    <ChallengeItem key={challenge.id} challenge={challenge} isWeekly={false} />
                ))}
            </div>
        </div>
    );
};

export default ChallengesPage;
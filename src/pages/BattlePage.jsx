import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Flame, TrendingUp, Clock, Target } from 'lucide-react';
import { auth, appId, db } from '../firebase';
import { getActiveBattle, getUserBattleStats } from '../services/battleService';
import BattleLeaderboard from '../components/BattleLeaderboard';
import BattleArena from '../components/BattleArena';
import { motion } from 'framer-motion';
import { logger } from '../utils/logger';
import FloatingParticles from '../components/FloatingParticles';

/**
 * BattlePage - Page principale des batailles
 * Affiche les stats, le leaderboard et permet de rejoindre/créer des batailles
 */
const BattlePage = ({ setCurrentPage }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [activeBattle, setActiveBattle] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (user) {
                loadUserData(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const loadUserData = async (userId) => {
        try {
            setLoading(true);

            const [stats, battle] = await Promise.all([
                getUserBattleStats(db, appId, userId),
                getActiveBattle(db, appId, userId)
            ]);

            setUserStats(stats);
            setActiveBattle(battle);

        } catch (error) {
            logger.error('BattlePage: Load battle data error', { error: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/60">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
                <div className="text-center">
                    <Swords className="mx-auto mb-4 text-white/20" size={64} />
                    <h2 className="text-2xl font-bold text-white mb-2">Connexion requise</h2>
                    <p className="text-white/60 mb-6">Connectez-vous pour accéder aux batailles</p>
                    <button
                        onClick={() => setCurrentPage('auth')}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Swords className="text-white" size={32} />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Batailles</h1>
                        <p className="text-white/80 text-sm">Affrontez vos rivaux</p>
                    </div>
                </div>

                {/* Stats rapides */}
                {userStats && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-4 gap-3"
                        role="region"
                        aria-label="Statistiques de bataille"
                    >
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center" role="article" aria-label="Total de batailles">
                            <p className="text-2xl font-bold text-white">{userStats.totalBattles}</p>
                            <p className="text-white/60 text-xs">Batailles</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center" role="article" aria-label={`${userStats.wins} victoires`}>
                            <p className="text-2xl font-bold text-green-400">{userStats.wins}</p>
                            <p className="text-white/60 text-xs">Victoires</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center" role="article" aria-label={`Taux de victoire: ${userStats.winRate.toFixed(0)}%`}>
                            <p className="text-2xl font-bold text-orange-400">
                                {userStats.winRate.toFixed(0)}%
                            </p>
                            <p className="text-white/60 text-xs">Taux</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center" role="article" aria-label={`Série actuelle: ${userStats.currentStreak}`}>
                            <p className="text-2xl font-bold text-yellow-400">
                                {userStats.currentStreak}
                                {userStats.currentStreak >= 3 && '🔥'}
                            </p>
                            <p className="text-white/60 text-xs">Série</p>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* Bataille active */}
                {activeBattle && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 border-2 border-orange-500"
                        role="region"
                        aria-labelledby="active-battle-heading"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Flame className="text-white" size={28} aria-hidden="true" />
                            <div>
                                <h3 id="active-battle-heading" className="text-xl font-bold text-white">Bataille en cours</h3>
                                <p className="text-white/80 text-sm">{activeBattle.venueName}</p>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-white/60 text-xs mb-1">Participants</p>
                                    <p className="text-2xl font-bold text-white">
                                        {activeBattle.participants?.length || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-xs mb-1">Votre score</p>
                                    <p className="text-2xl font-bold text-white">
                                        {activeBattle.scores?.[currentUser.uid]?.score || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-xs mb-1">Durée</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Math.floor((Date.now() - activeBattle.startedAt?.getTime()) / 60000)}m
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentPage('map')}
                            className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl font-bold transition-all"
                        >
                            Retourner à la bataille
                        </button>
                    </motion.div>
                )}

                {/* Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(239, 68, 68, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentPage('map')}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3"
                        aria-label="Aller sur la carte pour trouver une bataille"
                    >
                        <Target size={24} aria-hidden="true" />
                        <span>Trouver une bataille</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowLeaderboard(true)}
                        className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-white/20"
                        aria-label="Voir le classement des batailles"
                    >
                        <Trophy size={24} aria-hidden="true" />
                        <span>Classement des batailles</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(251, 191, 36, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentPage('challenges')}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-amber-400/30"
                        aria-label="Voir les défis à relever"
                    >
                        <Target size={24} aria-hidden="true" />
                        <span>🎯 Défis & Challenges</span>
                    </motion.button>
                </motion.div>

                {/* Statistiques détaillées */}
                {userStats && (
                    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="text-green-400" size={20} />
                            Statistiques détaillées
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-white/60">Total de batailles</span>
                                <span className="text-white font-bold">{userStats.totalBattles}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-white/60">Victoires / Défaites</span>
                                <span className="text-white font-bold">
                                    {userStats.wins} / {userStats.losses}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-white/60">Taux de victoire</span>
                                <span className="text-green-400 font-bold">
                                    {userStats.winRate.toFixed(1)}%
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-white/60">Série actuelle</span>
                                <span className="text-orange-400 font-bold flex items-center gap-1">
                                    {userStats.currentStreak}
                                    {userStats.currentStreak >= 3 && <Flame size={16} />}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-white/60">Meilleure série</span>
                                <span className="text-yellow-400 font-bold">
                                    {userStats.longestWinStreak}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-white/60">Points de bataille totaux</span>
                                <span className="text-purple-400 font-bold">
                                    {userStats.totalBattlePoints}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Guide */}
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur rounded-2xl p-6 border border-blue-500/30">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        💡 Comment participer
                    </h3>
                    <ul className="space-y-2 text-white/80 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">1.</span>
                            <span>Rendez-vous dans un bar avec d'autres utilisateurs</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">2.</span>
                            <span>Cliquez sur le marqueur du lieu sur la carte</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">3.</span>
                            <span>Lancez une bataille si des rivaux sont détectés</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">4.</span>
                            <span>Enregistrez vos drinks pour gagner des points</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">5.</span>
                            <span>Le joueur avec le plus de points gagne !</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Modals */}
            {showLeaderboard && (
                <BattleLeaderboard
                    db={db}
                    appId={appId}
                    currentUserId={currentUser?.uid}
                    onClose={() => setShowLeaderboard(false)}
                />
            )}
        </div>
    );
};

export default BattlePage;

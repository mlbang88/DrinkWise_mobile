import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, TrendingUp, Award, Swords } from 'lucide-react';
import { getBattleLeaderboard, getUserBattleStats } from '../services/battleService';
import { logger } from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BattleLeaderboard - Classement des batailles avec statistiques
 */
const BattleLeaderboard = ({ db, appId, currentUserId, onClose }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [db, appId, currentUserId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Charger le leaderboard et les stats utilisateur en parallèle
            const [leaderboardData, statsData] = await Promise.all([
                getBattleLeaderboard(db, appId, 50),
                currentUserId ? getUserBattleStats(db, appId, currentUserId) : null
            ]);

            // Enrichir le leaderboard avec les données utilisateur
            const enrichedLeaderboard = await Promise.all(
                leaderboardData.map(async (entry) => {
                    try {
                        const { getDoc, doc } = await import('firebase/firestore');
                        const userDoc = await getDoc(doc(db, 'users', entry.userId));
                        const userData = userDoc.data();

                        return {
                            ...entry,
                            username: userData?.displayName || userData?.username || 'Anonyme',
                            avatar: userData?.photoURL || null
                        };
                    } catch (err) {
                        logger.error('Erreur enrichissement utilisateur', err);
                        return {
                            ...entry,
                            username: 'Anonyme',
                            avatar: null
                        };
                    }
                })
            );

            setLeaderboard(enrichedLeaderboard);
            setUserStats(statsData);

        } catch (err) {
            logger.error('Erreur chargement battle leaderboard', err);
            setError('Impossible de charger le classement');
        } finally {
            setLoading(false);
        }
    };

    const getStreakEmoji = (streak) => {
        if (streak >= 10) return '🔥🔥🔥';
        if (streak >= 5) return '🔥🔥';
        if (streak >= 3) return '🔥';
        return '';
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <Swords className="text-white" size={32} />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Classement des Batailles</h2>
                            <p className="text-white/80 text-sm">Hall of Fame des combattants</p>
                        </div>
                    </div>

                    {/* Stats utilisateur */}
                    {userStats && (
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                            <p className="text-white/60 text-xs mb-2">Vos statistiques</p>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{userStats.wins}</p>
                                    <p className="text-white/60 text-xs">Victoires</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{userStats.losses}</p>
                                    <p className="text-white/60 text-xs">Défaites</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-400">
                                        {userStats.winRate.toFixed(0)}%
                                    </p>
                                    <p className="text-white/60 text-xs">Victoires</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-400">
                                        {userStats.currentStreak}
                                        {getStreakEmoji(userStats.currentStreak)}
                                    </p>
                                    <p className="text-white/60 text-xs">Série</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-white/60">Chargement du classement...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Leaderboard */}
                    {!loading && !error && (
                        <div className="space-y-2">
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-12">
                                    <Swords className="mx-auto mb-4 text-white/20" size={48} />
                                    <p className="text-white/60">Aucune bataille enregistrée</p>
                                </div>
                            ) : (
                                leaderboard.map((entry, index) => {
                                    const isCurrentUser = entry.userId === currentUserId;
                                    const rankColors = {
                                        1: 'from-yellow-500 to-orange-500',
                                        2: 'from-gray-300 to-gray-400',
                                        3: 'from-orange-600 to-orange-700'
                                    };

                                    return (
                                        <motion.div
                                            key={entry.userId}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-center gap-4 p-4 rounded-xl ${
                                                isCurrentUser
                                                    ? 'bg-red-600/30 border-2 border-red-500'
                                                    : 'bg-white/5 border border-white/10'
                                            }`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                                                rankColors[entry.rank]
                                                    ? `bg-gradient-to-br ${rankColors[entry.rank]} text-white shadow-lg`
                                                    : 'bg-gray-700 text-white/60'
                                            }`}>
                                                {entry.rank === 1 && '👑'}
                                                {entry.rank === 2 && '🥈'}
                                                {entry.rank === 3 && '🥉'}
                                                {entry.rank > 3 && `#${entry.rank}`}
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {entry.avatar ? (
                                                    <img
                                                        src={entry.avatar}
                                                        alt={entry.username}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    entry.username?.charAt(0) || '?'
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className={`font-bold truncate ${
                                                        isCurrentUser ? 'text-white' : 'text-white/90'
                                                    }`}>
                                                        {entry.username || 'Anonyme'}
                                                    </p>
                                                    {isCurrentUser && (
                                                        <span className="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs font-bold rounded">
                                                            VOUS
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-white/60">
                                                    <span className="flex items-center gap-1">
                                                        <Trophy size={12} className="text-green-400" />
                                                        {entry.wins}V
                                                    </span>
                                                    <span>{entry.losses}D</span>
                                                    <span className="text-green-400 font-medium">
                                                        {entry.winRate.toFixed(0)}%
                                                    </span>
                                                    {entry.currentStreak > 0 && (
                                                        <span className="flex items-center gap-1 text-orange-400">
                                                            <Flame size={12} />
                                                            {entry.currentStreak}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-2xl font-bold text-white">
                                                    {entry.totalBattlePoints}
                                                </p>
                                                <p className="text-xs text-white/40">points</p>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/30 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                    >
                        Fermer
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BattleLeaderboard;

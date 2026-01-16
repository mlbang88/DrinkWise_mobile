import React, { useState, useEffect, useCallback } from 'react';
import { X, Swords, Trophy, Flame, Zap, Target, Crown, TrendingUp } from 'lucide-react';
import {
    detectRivalsAtVenue,
    startBattle,
    updateBattleScore,
    endBattle,
    subscribeToBattle,
    BATTLE_CONFIG
} from '../services/battleService';
import { logger } from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import BattleToast from './BattleToast';

const BattleArena = ({
    db,
    appId,
    currentUser,
    placeId,
    venueName,
    onClose
}) => {
    const [phase, setPhase] = useState('detection'); // detection, waiting, active, finished
    const [rivals, setRivals] = useState([]);
    const [battle, setBattle] = useState(null);
    const [scores, setScores] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [unsubscribe, setUnsubscribe] = useState(null);
    const [toast, setToast] = useState(null);
    const [previousLeader, setPreviousLeader] = useState(null);

    // Détection des rivaux
    useEffect(() => {
        if (phase === 'detection') {
            detectRivals();
        }
    }, [phase, placeId, currentUser]);

    // Subscription temps réel
    useEffect(() => {
        if (battle?.id && phase === 'active') {
            const unsub = subscribeToBattle(db, appId, battle.id, (updatedBattle) => {
                if (updatedBattle) {
                    setBattle(updatedBattle);
                    setScores(updatedBattle.scores || {});

                    // Détecter changement de leader
                    const currentLeader = getCurrentLeader(updatedBattle.scores);
                    if (previousLeader && currentLeader && previousLeader !== currentLeader && currentLeader !== currentUser.uid) {
                        const leaderName = updatedBattle.participants.find(p => p.userId === currentLeader)?.username || 'Un rival';
                        const leaderScore = updatedBattle.scores[currentLeader]?.score || 0;
                        showToast(`👑 ${leaderName} prend la tête avec ${leaderScore} points !`, 'leader');
                    }
                    setPreviousLeader(currentLeader);

                    if (updatedBattle.status === 'completed') {
                        setPhase('finished');
                        
                        // Afficher toast de victoire/défaite
                        const isWinner = updatedBattle.winner === currentUser?.uid;
                        if (isWinner) {
                            showToast('🏆 Victoire ! Vous avez remporté la bataille !', 'victory');
                        } else {
                            const winnerName = updatedBattle.participants.find(p => p.userId === updatedBattle.winner)?.username || 'Un rival';
                            showToast(`${winnerName} a remporté la bataille`, 'defeat');
                        }
                    }
                } else {
                    setError('Bataille introuvable');
                }
            });

            setUnsubscribe(() => unsub);

            return () => {
                if (unsub) unsub();
            };
        }
    }, [battle?.id, phase, db, appId]);

    // Nettoyage
    useEffect(() => {
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [unsubscribe]);

    const detectRivals = async () => {
        try {
            setLoading(true);
            setError(null);

            const detected = await detectRivalsAtVenue(db, appId, placeId, currentUser.uid);
            setRivals(detected);

            if (detected.length === 0) {
                setError('Aucun rival détecté. Attendez que d\'autres joueurs arrivent...');
                setPhase('waiting');
            } else {
                setPhase('waiting');
            }
        } catch (err) {
            logger.error('Erreur détection rivaux', err);
            setError('Impossible de détecter les rivaux');
        } finally {
            setLoading(false);
        }
    };

    const handleStartBattle = async () => {
        try {
            setLoading(true);
            setError(null);

            // Préparer les participants
            const participants = [
                {
                    userId: currentUser.uid,
                    username: currentUser.displayName || 'Vous',
                    avatar: currentUser.photoURL
                },
                ...rivals.map(r => ({
                    userId: r.userId,
                    username: r.username || 'Anonyme',
                    avatar: r.avatar || null
                }))
            ];

            // Vérifier nombre minimum
            if (participants.length < BATTLE_CONFIG.MIN_PARTICIPANTS) {
                setError(`Minimum ${BATTLE_CONFIG.MIN_PARTICIPANTS} participants requis`);
                return;
            }

            // Démarrer la bataille
            const battleId = await startBattle(db, appId, placeId, venueName, participants);
            
            // Compte à rebours
            setCountdown(3);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setPhase('active');
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            setBattle({ id: battleId });

        } catch (err) {
            logger.error('Erreur démarrage bataille', err);
            setError('Impossible de démarrer la bataille');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const getCurrentLeader = (scoresObj) => {
        if (!scoresObj) return null;
        const entries = Object.entries(scoresObj);
        if (entries.length === 0) return null;
        return entries.reduce((max, curr) => curr[1].score > max[1].score ? curr : max)[0];
    };

    const handleRecordDrink = async () => {
        if (!battle?.id || phase !== 'active') return;

        try {
            const result = await updateBattleScore(db, appId, battle.id, currentUser.uid, {
                type: 'drink',
                value: 1
            });

            // Afficher toast pour combo
            if (result.combo > 1) {
                showToast(`🔥 Combo x${result.combo} ! +${result.pointsGained} points`, 'combo');
            }
        } catch (err) {
            logger.error('Erreur enregistrement drink', err);
        }
    };

    const handleEndBattle = async () => {
        if (!battle?.id) return;

        try {
            setLoading(true);
            const results = await endBattle(db, appId, battle.id);
            setBattle(results);
            setPhase('finished');
        } catch (err) {
            logger.error('Erreur fin de bataille', err);
            setError('Impossible de terminer la bataille');
        } finally {
            setLoading(false);
        }
    };

    const getParticipantsList = () => {
        if (!battle?.participants) return [];
        
        return battle.participants
            .map(p => ({
                ...p,
                score: scores[p.userId]?.score || 0,
                drinks: scores[p.userId]?.drinks || 0,
                combo: scores[p.userId]?.combo || 0
            }))
            .sort((a, b) => b.score - a.score);
    };

    const currentUserScore = scores[currentUser?.uid] || { score: 0, drinks: 0, combo: 0 };
    const participants = getParticipantsList();
    const winner = battle?.winner;
    const isWinner = winner === currentUser?.uid;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3">
                        <Swords className="text-white" size={32} />
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {phase === 'detection' && 'Détection des rivaux'}
                                {phase === 'waiting' && 'Prêt pour la bataille'}
                                {phase === 'active' && 'Bataille en cours'}
                                {phase === 'finished' && 'Bataille terminée'}
                            </h2>
                            <p className="text-white/80 text-sm">{venueName}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {/* Erreur */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Phase: Détection */}
                    {phase === 'detection' && (
                        <div className="text-center py-12">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                className="inline-block mb-4"
                            >
                                <Target className="text-purple-400" size={48} />
                            </motion.div>
                            <p className="text-white/60">Recherche de rivaux...</p>
                        </div>
                    )}

                    {/* Phase: Attente */}
                    {phase === 'waiting' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Flame className="text-orange-400" size={20} />
                                    Rivaux détectés ({rivals.length})
                                </h3>

                                {rivals.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-white/60 mb-4">
                                            Aucun rival à proximité pour le moment
                                        </p>
                                        <button
                                            onClick={detectRivals}
                                            disabled={loading}
                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            Réessayer
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {rivals.map((rival, index) => (
                                            <motion.div
                                                key={rival.id}
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                    {rival.username?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{rival.username || 'Anonyme'}</p>
                                                    <p className="text-white/40 text-xs">
                                                        Actif il y a {Math.floor((Date.now() - rival.timestamp) / 60000)} min
                                                    </p>
                                                </div>
                                                <Swords className="text-orange-400" size={20} />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {rivals.length >= BATTLE_CONFIG.MIN_PARTICIPANTS - 1 && (
                                <button
                                    onClick={handleStartBattle}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Flame size={24} />
                                    Démarrer la bataille
                                </button>
                            )}
                        </div>
                    )}

                    {/* Compte à rebours */}
                    {countdown !== null && (
                        <div className="text-center py-12">
                            <motion.div
                                key={countdown}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 2, opacity: 0 }}
                                className="text-8xl font-bold text-white mb-4"
                            >
                                {countdown}
                            </motion.div>
                            <p className="text-white/60">La bataille commence...</p>
                        </div>
                    )}

                    {/* Phase: Active */}
                    {phase === 'active' && (
                        <div className="space-y-6">
                            {/* Votre score */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6">
                                <div className="text-center text-white">
                                    <p className="text-white/80 text-sm mb-1">Votre score</p>
                                    <p className="text-5xl font-bold mb-3">{currentUserScore.score}</p>
                                    <div className="flex items-center justify-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            🍺 {currentUserScore.drinks}
                                        </span>
                                        {currentUserScore.combo > 0 && (
                                            <span className="flex items-center gap-1 bg-orange-500/30 px-3 py-1 rounded-full">
                                                <Flame size={14} />
                                                Combo x{currentUserScore.combo}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Classement */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="text-green-400" size={20} />
                                    Classement en direct
                                </h3>

                                <div className="space-y-2">
                                    {participants.map((p, index) => {
                                        const isCurrentUser = p.userId === currentUser?.uid;
                                        const rankColors = [
                                            'from-yellow-500 to-orange-500',
                                            'from-gray-300 to-gray-400',
                                            'from-orange-600 to-orange-700'
                                        ];

                                        return (
                                            <motion.div
                                                key={p.userId}
                                                layout
                                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                                    isCurrentUser
                                                        ? 'bg-purple-600/30 border-2 border-purple-500'
                                                        : 'bg-white/5 border border-white/10'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                    index < 3
                                                        ? `bg-gradient-to-br ${rankColors[index]} text-white`
                                                        : 'bg-gray-700 text-white/60'
                                                }`}>
                                                    {index === 0 && <Crown size={16} />}
                                                    {index > 0 && `#${index + 1}`}
                                                </div>

                                                <div className="flex-1">
                                                    <p className={`font-medium ${isCurrentUser ? 'text-white' : 'text-white/80'}`}>
                                                        {p.username || 'Anonyme'}
                                                        {isCurrentUser && <span className="ml-2 text-purple-300 text-xs">VOUS</span>}
                                                    </p>
                                                    <p className="text-white/40 text-xs">
                                                        {p.drinks} drinks • Combo x{p.combo}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-white">{p.score}</p>
                                                    <p className="text-white/40 text-xs">points</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleRecordDrink}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap size={24} />
                                    Enregistrer un drink (+{BATTLE_CONFIG.POINTS.DRINK} pts)
                                </button>

                                <button
                                    onClick={handleEndBattle}
                                    disabled={loading}
                                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl font-medium transition-all disabled:opacity-50"
                                >
                                    Terminer la bataille
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Phase: Terminé */}
                    {phase === 'finished' && (
                        <div className="space-y-6">
                            {/* Résultat */}
                            <div className={`rounded-xl p-8 text-center ${
                                isWinner
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                    : 'bg-gradient-to-r from-gray-700 to-gray-800'
                            }`}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                >
                                    {isWinner ? (
                                        <>
                                            <Trophy className="mx-auto mb-4 text-white" size={64} />
                                            <h3 className="text-3xl font-bold text-white mb-2">Victoire !</h3>
                                            <p className="text-white/80">Vous avez remporté la bataille 🎉</p>
                                        </>
                                    ) : (
                                        <>
                                            <Swords className="mx-auto mb-4 text-white/60" size={64} />
                                            <h3 className="text-3xl font-bold text-white mb-2">Bataille terminée</h3>
                                            <p className="text-white/80">Meilleure chance la prochaine fois</p>
                                        </>
                                    )}
                                </motion.div>
                            </div>

                            {/* Classement final */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Classement final</h3>
                                
                                <div className="space-y-2">
                                    {participants.map((p, index) => (
                                        <div
                                            key={p.userId}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${
                                                p.userId === currentUser?.uid
                                                    ? 'bg-purple-600/30 border-2 border-purple-500'
                                                    : 'bg-white/5'
                                            }`}
                                        >
                                            <div className="text-2xl">
                                                {index === 0 && '👑'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && `#${index + 1}`}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">
                                                    {p.username || 'Anonyme'}
                                                </p>
                                                <p className="text-white/40 text-xs">{p.drinks} drinks</p>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{p.score}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Toast notifications */}
            {toast && (
                <BattleToast
                    message={toast.message}
                    type={toast.type}
                    duration={3000}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default BattleArena;

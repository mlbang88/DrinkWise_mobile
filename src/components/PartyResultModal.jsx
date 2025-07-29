import React from 'react';
import { XCircle, Trophy, Star, Award } from 'lucide-react';
import { badgeList } from '../utils/data';

const PartyResultModal = ({ 
    quizTitle, 
    xpGained, 
    newBadges = [], 
    onClose 
}) => {
    console.log("🎯 PartyResultModal monté avec:", { quizTitle, xpGained, newBadges });
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" 
            style={{ 
                zIndex: 999999,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
        >
            <div 
                className="relative p-6 rounded-xl shadow-2xl max-w-md w-full"
                style={{
                    backgroundColor: '#1f2937', // gray-800
                    color: 'white',
                    zIndex: 999999,
                    border: '2px solid #374151' // gray-700 pour plus de contraste
                }}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white"
                >
                    <XCircle size={24} />
                </button>

                <div className="text-center" style={{ color: 'white' }}>
                    {/* Titre du quiz */}
                    <div className="mb-6">
                        <Trophy className="mx-auto mb-3 text-yellow-400" size={48} />
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'white' }}>Soirée Terminée !</h2>
                        <div className="bg-gray-700 rounded-lg p-4 mb-4">
                            <h3 className="text-lg font-semibold text-purple-400 mb-2" style={{ color: '#c084fc' }}>Résultat du Quiz</h3>
                            <p className="text-xl font-bold text-yellow-300" style={{ color: '#fde047' }}>{quizTitle}</p>
                        </div>
                    </div>

                    {/* XP Gagnée */}
                    <div className="mb-6">
                        <div className="bg-blue-900/50 rounded-lg p-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.5)' }}>
                            <div className="flex items-center justify-center mb-2">
                                <Star className="text-blue-400 mr-2" size={24} style={{ color: '#60a5fa' }} />
                                <span className="text-lg font-semibold text-blue-300" style={{ color: '#93c5fd' }}>Expérience Gagnée</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-400" style={{ color: '#60a5fa' }}>+{xpGained} XP</p>
                        </div>
                    </div>

                    {/* Nouveaux Badges */}
                    {newBadges.length > 0 && (
                        <div className="mb-6">
                            <div className="bg-yellow-900/30 rounded-lg p-4" style={{ backgroundColor: 'rgba(146, 64, 14, 0.3)' }}>
                                <div className="flex items-center justify-center mb-3">
                                    <Award className="text-yellow-400 mr-2" size={24} style={{ color: '#facc15' }} />
                                    <span className="text-lg font-semibold text-yellow-300" style={{ color: '#fde047' }}>
                                        Nouveaux Badges Débloqués !
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {newBadges.map((badgeId) => {
                                        const badge = badgeList[badgeId];
                                        if (!badge) return null;
                                        
                                        return (
                                            <div 
                                                key={badgeId}
                                                className="flex items-center justify-center bg-yellow-600/20 rounded-lg p-3"
                                                style={{ backgroundColor: 'rgba(202, 138, 4, 0.2)' }}
                                            >
                                                <div className="mr-3">
                                                    {React.cloneElement(badge.icon, { 
                                                        size: 24, 
                                                        style: { color: '#facc15' }
                                                    })}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-yellow-300" style={{ color: '#fde047' }}>{badge.name}</p>
                                                    <p className="text-sm text-yellow-200 opacity-80" style={{ color: '#fef3c7' }}>{badge.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bouton de fermeture */}
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-white transition-colors"
                        style={{ 
                            backgroundColor: '#9333ea',
                            color: 'white',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartyResultModal;

import React, { useState } from 'react';
import { XCircle, Trophy, Star, Award } from 'lucide-react';
import { badgeList } from '../utils/data';

const QuizModal = ({ onQuizComplete, onClose }) => {
    console.log("🎯 QuizModal monté !");
    
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const quizQuestions = [
        { id: 'q1', question: "Quel était votre niveau de lucidité ?", options: ["Très lucide", "Un peu flou", "Perdu le fil", "Trou Noir Galactique"] },
        { id: 'q2', question: "Le souvenir le plus marquant ?", options: ["Un moment de joie", "Une conversation profonde", "Un incident embarrassant", "Aucun souvenir"] },
        { id: 'q3', question: "L'ambiance générale ?", options: ["Incroyable", "Bonne", "Moyenne", "Nulle"] },
    ];

    const handleAnswer = (questionId, answer) => setAnswers(prev => ({ ...prev, [questionId]: answer }));
    const nextQuestion = () => (questionIndex < quizQuestions.length - 1) ? setQuestionIndex(prev => prev + 1) : calculateResult();

    const calculateResult = () => {
        let score = 0;
        if (answers.q1 === "Très lucide") score += 4; else if (answers.q1 === "Un peu flou") score += 2; else if (answers.q1 === "Perdu le fil") score += 1;
        if (answers.q2 === "Un moment de joie") score += 3; else if (answers.q2 === "Une conversation profonde") score += 2; else if (answers.q2 === "Un incident embarrassant") score += 1;
        if (answers.q3 === "Incroyable") score += 3; else if (answers.q3 === "Bonne") score += 2;

        let title = "Soirée à Oublier";
        if (answers.q1 === "Trou Noir Galactique") title = "Trou Noir Galactique";
        else if (score >= 8) title = "Nuit Mémorable !";
        else if (score >= 5) title = "Bonne Soirée !";
        else if (score >= 3) title = "Soirée Correcte";
        setQuizResult(title);
    };

    const finishQuiz = async () => {
        console.log("🎯 Quiz terminé avec résultat:", quizResult);
        
        // Appeler onQuizComplete qui gérera les récompenses et fermera le modal
        if (onQuizComplete) {
            await onQuizComplete(quizResult);
        }
    };

    const closeModal = () => {
        console.log("🎯 Fermeture complète du quiz");
        onClose();
    };

    return (
        <div 
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 999999
            }}
        >
            <div 
                style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '24px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                    border: '1px solid #334155'
                }}
            >
                {/* Bouton de fermeture */}
                <button 
                    onClick={onClose} 
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: '#64748b',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px'
                    }}
                >
                    <XCircle size={20} />
                </button>

                {!quizResult ? (
                    <>
                        {/* Titre */}
                        <h2 style={{
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: '24px',
                            marginTop: '8px'
                        }}>
                            Quiz de Soirée !
                        </h2>

                        {/* Question */}
                        <p style={{
                            color: '#e2e8f0',
                            fontSize: '18px',
                            textAlign: 'center',
                            marginBottom: '32px',
                            lineHeight: '1.5'
                        }}>
                            {quizQuestions[questionIndex].question}
                        </p>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                            {quizQuestions[questionIndex].options.map(option => {
                                const isSelected = answers[quizQuestions[questionIndex].id] === option;
                                return (
                                    <button 
                                        key={option} 
                                        onClick={() => handleAnswer(quizQuestions[questionIndex].id, option)}
                                        style={{
                                            backgroundColor: isSelected ? '#4c1d95' : '#475569',
                                            color: 'white',
                                            border: isSelected ? '2px solid #7c3aed' : '2px solid transparent',
                                            borderRadius: '12px',
                                            padding: '16px 20px',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            textAlign: 'center',
                                            width: '100%'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.target.style.backgroundColor = '#64748b';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.target.style.backgroundColor = '#475569';
                                            }
                                        }}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bouton Suivant */}
                        <button 
                            onClick={nextQuestion} 
                            disabled={!answers[quizQuestions[questionIndex].id]}
                            style={{
                                backgroundColor: answers[quizQuestions[questionIndex].id] ? '#7c3aed' : '#64748b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: answers[quizQuestions[questionIndex].id] ? 'pointer' : 'not-allowed',
                                width: '100%',
                                transition: 'all 0.2s ease',
                                opacity: answers[quizQuestions[questionIndex].id] ? 1 : 0.6
                            }}
                            onMouseEnter={(e) => {
                                if (answers[quizQuestions[questionIndex].id]) {
                                    e.target.style.backgroundColor = '#6d28d9';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (answers[quizQuestions[questionIndex].id]) {
                                    e.target.style.backgroundColor = '#7c3aed';
                                }
                            }}
                        >
                            {questionIndex < quizQuestions.length - 1 ? "Suivant" : "Terminer"}
                        </button>
                    </>
                ) : !showResults ? (
                    /* Résultat du Quiz */
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <Trophy size={48} style={{ color: '#facc15', margin: '0 auto 16px' }} />
                        </div>
                        <h3 style={{
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '16px'
                        }}>
                            Résultat :
                        </h3>
                        <p style={{
                            color: '#a855f7',
                            fontSize: '32px',
                            fontWeight: 'bold',
                            marginBottom: '32px',
                            animation: 'pulse 2s infinite'
                        }}>
                            {quizResult}
                        </p>
                        <button 
                            onClick={finishQuiz}
                            style={{
                                backgroundColor: '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#6d28d9'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#7c3aed'}
                        >
                            Voir les récompenses
                        </button>
                    </div>
                ) : (
                    /* Résultats Complets avec XP et Badges */
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <Trophy size={48} style={{ color: '#facc15', margin: '0 auto 16px' }} />
                        </div>
                        <h2 style={{
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: 'bold',
                            marginBottom: '8px'
                        }}>
                            Soirée Terminée !
                        </h2>
                        
                        {/* Titre du Quiz */}
                        <div style={{
                            backgroundColor: '#374151',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{
                                color: '#c084fc',
                                fontSize: '16px',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Résultat du Quiz
                            </h3>
                            <p style={{
                                color: '#fde047',
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}>
                                {quizResult}
                            </p>
                        </div>

                        {/* XP Gagnée */}
                        <div style={{
                            backgroundColor: 'rgba(30, 58, 138, 0.5)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '8px'
                            }}>
                                <Star size={24} style={{ color: '#60a5fa', marginRight: '8px' }} />
                                <span style={{
                                    color: '#93c5fd',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}>
                                    Expérience Gagnée
                                </span>
                            </div>
                            <p style={{
                                color: '#60a5fa',
                                fontSize: '28px',
                                fontWeight: 'bold'
                            }}>
                                +{rewards.xpGained} XP
                            </p>
                        </div>

                        {/* Nouveaux Badges */}
                        {rewards.newBadges.length > 0 && (
                            <div style={{
                                backgroundColor: 'rgba(146, 64, 14, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <Award size={24} style={{ color: '#facc15', marginRight: '8px' }} />
                                    <span style={{
                                        color: '#fde047',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        Nouveaux Badges Débloqués !
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {rewards.newBadges.map((badgeId) => {
                                        const badge = badgeList[badgeId];
                                        if (!badge) return null;
                                        
                                        return (
                                            <div 
                                                key={badgeId}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'rgba(202, 138, 4, 0.2)',
                                                    borderRadius: '8px',
                                                    padding: '12px'
                                                }}
                                            >
                                                <div style={{ marginRight: '12px' }}>
                                                    {React.cloneElement(badge.icon, { 
                                                        size: 24, 
                                                        style: { color: '#facc15' }
                                                    })}
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <p style={{
                                                        color: '#fde047',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        margin: 0
                                                    }}>
                                                        {badge.name}
                                                    </p>
                                                    <p style={{
                                                        color: '#fef3c7',
                                                        fontSize: '12px',
                                                        margin: 0,
                                                        opacity: 0.8
                                                    }}>
                                                        {badge.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Bouton de fermeture */}
                        <button 
                            onClick={closeModal}
                            style={{
                                backgroundColor: '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#6d28d9'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#7c3aed'}
                        >
                            Continuer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizModal;
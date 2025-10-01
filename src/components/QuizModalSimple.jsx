import React, { useState } from 'react';
import { XCircle, Trophy } from 'lucide-react';

const QuizModal = ({ onQuizComplete, onClose, uploadingPhotos = false, photosCount = 0 }) => {
    console.log("🎯 QuizModal monté !");
    
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false); // Protection contre fermetures multiples

    const quizQuestions = [
        { id: 'q1', question: "Quel était votre niveau de lucidité ?", options: ["Très lucide", "Un peu flou", "Perdu le fil", "Trou Noir Galactique"] },
        { id: 'q2', question: "Le souvenir le plus marquant ?", options: ["Un moment de joie", "Une conversation profonde", "Un incident embarrassant", "Aucun souvenir"] },
        { id: 'q3', question: "Comment vous sentez-vous maintenant ?", options: ["En pleine forme", "Un peu fatigué", "Mal à la tête", "Zombie"] },
        { id: 'q4', question: "Votre comportement social ?", options: ["Charmant", "Bavard", "Bizarre", "Inexistant"] },
        { id: 'q5', question: "Niveau de contrôle ?", options: ["Parfait", "Acceptable", "Limite", "Zéro"] }
    ];

    const calculateQuizResult = () => {
        const answerValues = {
            "Très lucide": 4, "Un peu flou": 3, "Perdu le fil": 2, "Trou Noir Galactique": 1,
            "Un moment de joie": 4, "Une conversation profonde": 3, "Un incident embarrassant": 2, "Aucun souvenir": 1,
            "En pleine forme": 4, "Un peu fatigué": 3, "Mal à la tête": 2, "Zombie": 1,
            "Charmant": 4, "Bavard": 3, "Bizarre": 2, "Inexistant": 1,
            "Parfait": 4, "Acceptable": 3, "Limite": 2, "Zéro": 1
        };
        
        const score = Object.values(answers).reduce((sum, answer) => sum + (answerValues[answer] || 0), 0);
        
        let title;
        if (score >= 18) title = "Soirée Parfaite !";
        else if (score >= 15) title = "Excellente Soirée !";
        else if (score >= 12) title = "Bonne Soirée !";
        else if (score >= 8) title = "Soirée Correcte";
        else if (score >= 5) title = "Soirée Mouvementée";
        else title = "Trou Noir Galactique";
        
        setQuizResult(title);
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (questionIndex < quizQuestions.length - 1) {
            setQuestionIndex(questionIndex + 1);
        } else {
            calculateQuizResult();
        }
    };

    const finishQuiz = async () => {
        if (isProcessing) {
            console.log("⚠️ Quiz déjà en cours de traitement, ignoré");
            return;
        }
        
        setIsProcessing(true);
        console.log("🎯 Quiz terminé avec réponses:", Object.values(answers));
        
        try {
            // Appeler onQuizComplete avec les réponses (pas le résultat)
            if (onQuizComplete) {
                await onQuizComplete(Object.values(answers));
            }
        } catch (error) {
            console.error("❌ Erreur lors de la finalisation du quiz:", error);
        } finally {
            setIsProcessing(false);
            // Fermer le modal après traitement
            if (onClose) {
                onClose();
            }
        }
    };

    const modalStyles = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
    };

    const contentStyles = {
        backgroundColor: '#1a1a2e',
        borderRadius: '20px',
        padding: '32px 24px',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid rgba(139, 69, 255, 0.3)'
    };

    return (
        <div 
            style={modalStyles}
            onClick={(e) => {
                // Empêcher la fermeture accidentelle en cliquant sur le fond
                e.stopPropagation();
            }}
        >
            <div 
                style={contentStyles}
                onClick={(e) => {
                    // Empêcher la propagation pour éviter la fermeture
                    e.stopPropagation();
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: 0, textAlign: 'center', flex: 1 }}>
                        Quiz de Soirée
                    </h2>
                    <button 
                        onClick={() => {
                            if (isProcessing) {
                                console.log("⚠️ Quiz en cours de traitement, fermeture ignorée");
                                return;
                            }
                            console.log("🔴 Fermeture manuelle du quiz");
                            onClose();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Indicateur d'upload des photos */}
                {uploadingPhotos && photosCount > 0 && (
                    <div style={{
                        backgroundColor: 'rgba(139, 69, 255, 0.1)',
                        border: '1px solid rgba(139, 69, 255, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #8b45ff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <div style={{
                            color: '#c084fc',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            📸 Upload de {photosCount} photo(s) en cours...
                        </div>
                    </div>
                )}

                {/* Contenu */}
                {!quizResult ? (
                    /* Questions du Quiz */
                    <>
                        {/* Progress Bar */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{
                                backgroundColor: '#374151',
                                borderRadius: '8px',
                                padding: '4px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    backgroundColor: '#8b45ff',
                                    height: '8px',
                                    borderRadius: '4px',
                                    width: `${((questionIndex + 1) / quizQuestions.length) * 100}%`,
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                                Question {questionIndex + 1} sur {quizQuestions.length}
                            </p>
                        </div>

                        {/* Question Title */}
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: 0,
                                textAlign: 'left',
                                lineHeight: '1.4'
                            }}>
                                {quizQuestions[questionIndex].question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div style={{ marginBottom: '32px' }}>
                            {quizQuestions[questionIndex].options.map((option, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleAnswer(quizQuestions[questionIndex].id, option)}
                                    style={{
                                        backgroundColor: answers[quizQuestions[questionIndex].id] === option ? 'rgba(139, 69, 255, 0.2)' : '#2d3748',
                                        border: answers[quizQuestions[questionIndex].id] === option ? '2px solid #8b45ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '16px 20px',
                                        marginBottom: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (answers[quizQuestions[questionIndex].id] !== option) {
                                            e.target.style.backgroundColor = '#4a5568';
                                            e.target.style.borderColor = 'rgba(139, 69, 255, 0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (answers[quizQuestions[questionIndex].id] !== option) {
                                            e.target.style.backgroundColor = '#2d3748';
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: answers[quizQuestions[questionIndex].id] === option ? '#8b45ff' : '#9ca3af',
                                        backgroundColor: answers[quizQuestions[questionIndex].id] === option ? '#8b45ff' : 'transparent',
                                        marginRight: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {answers[quizQuestions[questionIndex].id] === option && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: 'white'
                                            }} />
                                        )}
                                    </div>
                                    <span style={{
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '500'
                                    }}>
                                        {option}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            disabled={!answers[quizQuestions[questionIndex].id]}
                            style={{
                                backgroundColor: answers[quizQuestions[questionIndex].id] ? '#8b45ff' : '#4a5568',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: answers[quizQuestions[questionIndex].id] ? 'pointer' : 'not-allowed',
                                width: '100%',
                                transition: 'all 0.2s ease',
                                opacity: answers[quizQuestions[questionIndex].id] ? 1 : 0.6
                            }}
                            onMouseEnter={(e) => {
                                if (answers[quizQuestions[questionIndex].id]) {
                                    e.target.style.backgroundColor = '#7c3aed';
                                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 255, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (answers[quizQuestions[questionIndex].id]) {
                                    e.target.style.backgroundColor = '#8b45ff';
                                    e.target.style.transform = 'translateY(0) scale(1)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 255, 0.3)';
                                }
                            }}
                        >
                            {questionIndex < quizQuestions.length - 1 ? "Suivant" : "Terminer"}
                        </button>
                    </>
                ) : (
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
                            disabled={isProcessing}
                            style={{
                                backgroundColor: isProcessing ? '#374151' : '#7c3aed',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px 32px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                width: '100%',
                                transition: 'all 0.2s ease',
                                opacity: isProcessing ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!isProcessing) {
                                    e.target.style.backgroundColor = '#6d28d9';
                                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isProcessing) {
                                    e.target.style.backgroundColor = '#7c3aed';
                                    e.target.style.transform = 'translateY(0) scale(1)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                                }
                            }}
                        >
                            {isProcessing ? 'Traitement...' : 'Terminer la soirée'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizModal;

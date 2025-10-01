import React, { useState, useEffect } from 'react';
import AnimatedList from '../components/AnimatedList';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedChart from '../components/AnimatedChart';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedInput from '../components/AnimatedInput';

const Phase2CDemo = () => {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState('success');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState('');
    const [listVisible, setListVisible] = useState(false);
    const [listAnimationTrigger, setListAnimationTrigger] = useState(0);

    // Données de test pour les animations
    const testItems = [
        { id: 1, name: 'Soirée Awesome', date: '2024-01-15', participants: 8 },
        { id: 2, name: 'After Work', date: '2024-01-12', participants: 5 },
        { id: 3, name: 'House Party', date: '2024-01-10', participants: 12 },
        { id: 4, name: 'Club Night', date: '2024-01-08', participants: 3 },
        { id: 5, name: 'Birthday Bash', date: '2024-01-05', participants: 15 }
    ];

    const chartData = [
        { label: 'Bière', value: 45 },
        { label: 'Vin', value: 25 },
        { label: 'Cocktails', value: 20 },
        { label: 'Whisky', value: 10 }
    ];

    const handleShowFeedback = (type) => {
        const messages = {
            success: '✅ Action réussie avec succès !',
            error: '❌ Une erreur est survenue !',
            warning: '⚠️ Attention, vérifiez vos données !',
            info: 'ℹ️ Information importante !',
            loading: '⏳ Chargement en cours...'
        };
        
        setFeedbackType(type);
        setFeedbackMessage(messages[type] || 'Notification');
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 3000);
    };

    // Animation des listes au scroll
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setListVisible(true);
        }, 1000); // Déclenchement après 1 seconde

        return () => clearTimeout(timer);
    }, []);

    const handleInputChange = (value) => {
        setInputValue(value);
        if (value.length < 3) {
            setInputError('Minimum 3 caractères requis');
        } else {
            setInputError('');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #581c87, #1e3a8a, #312e81)',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '48px'
            }}>
                
                {/* Header */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '48px 32px',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '16px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>
                        🎨 Phase 2C Demo
                    </h1>
                    <p style={{
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '500',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                        margin: 0
                    }}>
                        Démonstration des animations et micro-interactions
                    </p>
                </div>

                {/* Buttons Demo */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '16px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>🔘 Animated Buttons</h2>
                    <p style={{
                        color: 'white',
                        marginBottom: '24px',
                        fontSize: '14px',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                        ✨ <strong>Ce que vous devriez voir :</strong><br/>
                        • Effet hover : Les boutons s'élèvent et brillent<br/>
                        • Effet ripple : Cercles d'onde au clic<br/>
                        • Feedback visuel : Overlay de notification
                    </p>
                    {/* Bouton de test simple */}
                    <div style={{ marginBottom: '24px' }}>
                        <button 
                            style={{
                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '16px',
                                color: 'white',
                                padding: '14px 24px',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                                marginRight: '16px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                                e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0) scale(1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                            }}
                            onClick={() => alert('Test bouton fonctionne !')}
                        >
                            🧪 Test Button (Simple)
                        </button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '16px'
                    }}>
                        {[
                            { name: 'Success', color: '#10b981', type: 'success' },
                            { name: 'Error', color: '#ef4444', type: 'error' },
                            { name: 'Warning', color: '#f59e0b', type: 'warning' },
                            { name: 'Info', color: '#3b82f6', type: 'info' },
                            { name: 'Loading', color: '#6b7280', type: 'loading' }
                        ].map((btn, index) => (
                            <button 
                                key={index}
                                style={{
                                    background: `linear-gradient(135deg, ${btn.color}, ${btn.color}dd)`,
                                    border: `1px solid ${btn.color}44`,
                                    borderRadius: '16px',
                                    color: 'white',
                                    padding: '14px 20px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: `0 4px 12px ${btn.color}33`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.target.style.boxShadow = `0 8px 25px ${btn.color}44`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0) scale(1)';
                                    e.target.style.boxShadow = `0 4px 12px ${btn.color}33`;
                                }}
                                onClick={(e) => {
                                    // Effet ripple
                                    const rect = e.target.getBoundingClientRect();
                                    const size = Math.max(rect.width, rect.height);
                                    const x = e.clientX - rect.left - size / 2;
                                    const y = e.clientY - rect.top - size / 2;
                                    
                                    const ripple = document.createElement('span');
                                    ripple.style.cssText = `
                                        position: absolute;
                                        width: ${size}px;
                                        height: ${size}px;
                                        left: ${x}px;
                                        top: ${y}px;
                                        background: rgba(255, 255, 255, 0.4);
                                        border-radius: 50%;
                                        transform: scale(0);
                                        animation: ripple 0.6s ease-out;
                                        pointer-events: none;
                                    `;
                                    
                                    e.target.appendChild(ripple);
                                    setTimeout(() => {
                                        if (e.target.contains(ripple)) {
                                            e.target.removeChild(ripple);
                                        }
                                    }, 600);
                                    
                                    handleShowFeedback(btn.type);
                                }}
                            >
                                {btn.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inputs Demo */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '16px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>📝 Inputs Animés</h2>
                    <p style={{
                        color: 'white',
                        marginBottom: '24px',
                        fontSize: '14px',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                        ✨ <strong>Ce que vous devriez voir :</strong><br/>
                        • Labels flottants qui montent au focus<br/>
                        • Bordures qui changent de couleur<br/>
                        • Effets de flou (backdrop-filter)<br/>
                        • Animations de validation d'erreur
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Nom de la soirée"
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(10px)',
                                    border: inputError ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.border = '2px solid #8b5cf6';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.border = inputError ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.2)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            {inputError && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    marginTop: '8px',
                                    fontWeight: '500'
                                }}>
                                    ⚠️ {inputError}
                                </p>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Lieu de la soirée"
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(10px)',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '500',
                                transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.border = '2px solid #8b5cf6';
                                e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Cards Demo */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '16px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>🎴 Cartes Animées</h2>
                    <p style={{
                        color: 'white',
                        marginBottom: '24px',
                        fontSize: '14px',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                        ✨ <strong>Ce que vous devriez voir :</strong><br/>
                        • Cartes qui s'élèvent au survol<br/>
                        • Effets de lueur et d'ombre<br/>
                        • Rotations et agrandissements<br/>
                        • Transitions fluides
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '24px'
                    }}>
                        {[
                            { title: '🎭 Glass Effect', color: 'rgba(139, 92, 246, 0.2)', effect: 'lift' },
                            { title: '🌈 Gradient', color: 'rgba(236, 72, 153, 0.2)', effect: 'scale' },
                            { title: '✨ Glow', color: 'rgba(59, 130, 246, 0.2)', effect: 'glow' },
                            { title: '🎪 Rotate', color: 'rgba(16, 185, 129, 0.2)', effect: 'rotate' }
                        ].map((card, index) => (
                            <div
                                key={index}
                                style={{
                                    background: `linear-gradient(135deg, ${card.color}, rgba(255, 255, 255, 0.05))`,
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    padding: '24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                    transformOrigin: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    const element = e.currentTarget;
                                    
                                    switch (card.effect) {
                                        case 'lift':
                                            element.style.transform = 'translateY(-12px) scale(1.02)';
                                            element.style.boxShadow = '0 25px 50px rgba(139, 92, 246, 0.25)';
                                            break;
                                        case 'scale':
                                            // Animation scale très visible
                                            element.style.transform = 'scale(1.2)';
                                            element.style.boxShadow = '0 25px 50px rgba(236, 72, 153, 0.5)';
                                            element.style.background = `linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(255, 255, 255, 0.15))`;
                                            element.style.zIndex = '10';
                                            break;
                                        case 'glow':
                                            element.style.transform = 'scale(1.02)';
                                            element.style.boxShadow = '0 0 40px rgba(59, 130, 246, 0.4)';
                                            element.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                                            break;
                                        case 'rotate':
                                            element.style.transform = 'rotate(3deg) scale(1.05)';
                                            element.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.25)';
                                            break;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const element = e.currentTarget;
                                    // Reset complet avec transition fluide
                                    element.style.transform = 'translateY(0) scale(1) rotate(0deg)';
                                    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                    element.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    element.style.zIndex = 'auto';
                                    // Restaurer le background original selon l'effet
                                    const cardEffect = card.effect;
                                    const originalColor = cardEffect === 'lift' ? 'rgba(139, 92, 246, 0.2)' :
                                                         cardEffect === 'scale' ? 'rgba(236, 72, 153, 0.2)' :
                                                         cardEffect === 'glow' ? 'rgba(59, 130, 246, 0.2)' :
                                                         'rgba(16, 185, 129, 0.2)';
                                    element.style.background = `linear-gradient(135deg, ${originalColor}, rgba(255, 255, 255, 0.05))`;
                                }}
                            >
                                <div style={{
                                    fontSize: '32px',
                                    marginBottom: '12px'
                                }}>
                                    {card.title.split(' ')[0]}
                                </div>
                                <h3 style={{
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    margin: 0,
                                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                                }}>
                                    {card.title.substring(2)}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lists Demo */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '16px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>📋 Listes Animées</h2>
                    <p style={{
                        color: 'white',
                        marginBottom: '16px',
                        fontSize: '14px',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                        ✨ <strong>Ce que vous devriez voir :</strong><br/>
                        • Items qui apparaissent un par un<br/>
                        • Effets de glissement depuis le bas<br/>
                        • Animations décalées (stagger)<br/>
                        • Hover effects sur chaque item
                    </p>
                    <div style={{ marginBottom: '24px' }}>
                        <button
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginRight: '12px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }}
                            onClick={() => {
                                setListVisible(false);
                                setListAnimationTrigger(prev => prev + 1);
                                setTimeout(() => setListVisible(true), 100);
                            }}
                        >
                            🚀 Lancer animations
                        </button>
                        <button
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                            }}
                            onClick={() => {
                                setListVisible(false);
                                setTimeout(() => {
                                    setListAnimationTrigger(prev => prev + 1);
                                    setListVisible(true);
                                }, 200);
                            }}
                        >
                            🔄 Reset
                        </button>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '32px'
                    }}>
                        <div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginBottom: '16px',
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                            }}>Animation Slide</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {testItems.map((item, index) => (
                                    <div
                                        key={`${item.id}-${listAnimationTrigger}`}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.15)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            padding: '16px',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer',
                                            opacity: listVisible ? 1 : 0,
                                            transform: listVisible ? 'translateY(0px)' : 'translateY(30px)',
                                            animation: listVisible ? `slideIn 0.6s ease-out ${index * 0.15}s both` : 'none',
                                            willChange: 'transform, opacity'
                                        }}
                                        onMouseEnter={(e) => {
                                            const element = e.currentTarget;
                                            element.style.transform = 'translateY(-4px) scale(1.02)';
                                            element.style.boxShadow = '0 12px 30px rgba(255, 255, 255, 0.1)';
                                            element.style.background = 'rgba(255, 255, 255, 0.25)';
                                        }}
                                        onMouseLeave={(e) => {
                                            const element = e.currentTarget;
                                            element.style.transform = 'translateY(0) scale(1)';
                                            element.style.boxShadow = 'none';
                                            element.style.background = 'rgba(255, 255, 255, 0.15)';
                                        }}
                                    >
                                        <h4 style={{
                                            color: 'white',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            margin: '0 0 6px 0',
                                            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                                        }}>
                                            {item.name}
                                        </h4>
                                        <p style={{
                                            color: 'white',
                                            fontSize: '13px',
                                            margin: 0,
                                            opacity: 0.9
                                        }}>
                                            {item.date} • {item.participants} participants
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h3 style={{
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginBottom: '16px',
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                            }}>Animation Scale</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {testItems.map((item, index) => (
                                    <div
                                        key={`scale-${item.id}`}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            padding: '16px',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            transform: 'scale(0.8)',
                                            animation: `scaleIn 0.6s ease-out ${index * 0.15}s forwards`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.15)';
                                            e.target.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.4)';
                                            e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4))';
                                            e.target.style.zIndex = '10';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.boxShadow = 'none';
                                            e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))';
                                            e.target.style.zIndex = 'auto';
                                        }}
                                    >
                                        <h4 style={{
                                            color: 'white',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            margin: '0 0 6px 0',
                                            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                                        }}>
                                            {item.name}
                                        </h4>
                                        <p style={{
                                            color: 'white',
                                            fontSize: '13px',
                                            margin: 0,
                                            opacity: 0.9
                                        }}>
                                            {item.date} • {item.participants} participants
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Notification Simple */}
            {showFeedback && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    background: feedbackType === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                               feedbackType === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                               feedbackType === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                               feedbackType === 'info' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                               'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                    animation: 'slideInRight 0.4s ease-out',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    maxWidth: '300px'
                }}
                onClick={() => setShowFeedback(false)}
                >
                    <div style={{
                        fontWeight: '600',
                        marginBottom: feedbackType === 'loading' ? '8px' : '0'
                    }}>
                        {feedbackMessage}
                    </div>
                    {feedbackType === 'loading' && (
                        <div style={{
                            width: '100%',
                            height: '4px',
                            background: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '65%',
                                height: '100%',
                                background: 'white',
                                borderRadius: '2px',
                                animation: 'progressFill 2s ease-in-out infinite'
                            }} />
                        </div>
                    )}
                </div>
            )}

            {/* Animations CSS */}
            <style>
                {`
                    @keyframes ripple {
                        to {
                            transform: scale(2);
                            opacity: 0;
                        }
                    }
                    
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes scaleIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default Phase2CDemo;
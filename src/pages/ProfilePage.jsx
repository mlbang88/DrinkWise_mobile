import React, { useState, useContext, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import { ExperienceService } from '../services/experienceService';
import { gameplayConfig } from '../utils/data';
import { validateUsername, isUsernameAvailable } from '../utils/usernameUtils';
import LoadingIcon from '../components/LoadingIcon';
import ProfilePhotoManager from '../components/ProfilePhotoManager';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';
import { logger } from '../utils/logger.js';

const ProfilePage = () => {
    const { auth, user, userProfile, db, appId, setMessageBox } = useContext(FirebaseContext);
    
    // États du composant
    const [newUsername, setNewUsername] = useState(userProfile?.username || '');
    const [loading, setLoading] = useState(false);
    const [usernameValidation, setUsernameValidation] = useState({ isValid: true, error: null });
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState(userProfile?.profilePhoto || null);



    // Calcul des stats depuis publicStats (source unique de vérité)
    const stats = useMemo(() => {
        const publicStats = userProfile?.publicStats || {};
        return {
            totalParties: publicStats.totalParties || 0,
            totalDrinks: publicStats.totalDrinks || 0,
            totalChallenges: publicStats.challengesCompleted || 0,
            totalBadges: publicStats.unlockedBadges?.length || 0,
            totalQuizQuestions: publicStats.totalQuizQuestions || 0
        };
    }, [userProfile?.publicStats]);

    // Calcul XP et niveau
    const currentXp = ExperienceService?.calculateTotalXP ? ExperienceService.calculateTotalXP(stats) : 0;
    const currentLevel = ExperienceService?.calculateLevel ? ExperienceService.calculateLevel(currentXp) : 1;
    const currentLevelName = ExperienceService?.getLevelName ? ExperienceService.getLevelName(currentLevel) : "Novice";
    
    const xpForCurrentLevel = ExperienceService?.getXpForLevel ? ExperienceService.getXpForLevel(currentLevel) : 0;
    const xpForNextLevel = ExperienceService?.getXpForLevel ? ExperienceService.getXpForLevel(currentLevel + 1) : 100;
    const progress = xpForNextLevel > xpForCurrentLevel ? ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100 : 0;

    // Validation en temps réel du username
    const handleUsernameChange = async (value) => {
        setNewUsername(value);
        
        // Si c'est le même username qu'actuellement, pas besoin de vérifier
        if (value === userProfile?.username) {
            setUsernameValidation({ isValid: true, error: null });
            return;
        }
        
        // Validation du format
        const formatValidation = validateUsername(value);
        if (!formatValidation.isValid) {
            setUsernameValidation(formatValidation);
            return;
        }
        
        // Vérification de disponibilité avec debounce
        setCheckingUsername(true);
        setTimeout(async () => {
            try {
                const isAvailable = await isUsernameAvailable(db, appId, value, user.uid);
                if (!isAvailable) {
                    setUsernameValidation({ isValid: false, error: "Ce nom d'utilisateur est déjà pris." });
                } else {
                    setUsernameValidation({ isValid: true, error: null });
                }
            } catch (error) {
                logger.error("Erreur vérification username", { error: error.message });
            } finally {
                setCheckingUsername(false);
            }
        }, 500); // Debounce de 500ms
    };

    const handleSaveProfile = async () => {
        if (!newUsername.trim()) {
            return setMessageBox({ message: "Le nom ne peut pas être vide.", type: "error" });
        }
        
        // Validation du format du username
        const validation = validateUsername(newUsername);
        if (!validation.isValid) {
            return setMessageBox({ message: validation.error, type: "error" });
        }
        
        setLoading(true);
        
        try {
            // Vérifier si le username est disponible (en excluant l'utilisateur actuel)
            const isAvailable = await isUsernameAvailable(db, appId, newUsername, user.uid);
            if (!isAvailable) {
                setMessageBox({ message: "Ce nom d'utilisateur est déjà pris.", type: "error" });
                setLoading(false);
                return;
            }
            
            // Sauvegarder le nouveau username
            const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            const publicProfileRef = doc(db, `artifacts/${appId}/profiles`, user.uid);
            
            await updateDoc(userProfileRef, {
                username: newUsername,
                username_lowercase: newUsername.toLowerCase()
            });
            
            // Mettre à jour aussi dans la collection publique
            await setDoc(publicProfileRef, {
                username: newUsername,
                username_lowercase: newUsername.toLowerCase(),
                isPublic: userProfile?.isPublic || false
            }, { merge: true });
            
            setMessageBox({ message: "Profil mis à jour !", type: "success" });
        } catch (error) {
            logger.error("Erreur mise à jour profil", { error: error.message });
            setMessageBox({ message: "Erreur mise à jour profil.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublic = async (isPublic) => {
        setLoading(true);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        try {
            await updateDoc(userProfileRef, { isPublic });
            // Les stats publiques seront mises à jour automatiquement par badgeService
            setMessageBox({ message: `Profil rendu ${isPublic ? 'public' : 'privé'}`, type: "success" });
        } catch (error) {
            setMessageBox({ message: "Erreur mise à jour statut.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpdate = (photoData) => {
        setCurrentProfilePhoto(photoData);
    };

    const handleSignOut = () => signOut(auth).catch(e => setMessageBox({ message: "Erreur déconnexion.", type: "error" }));

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url("https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '28px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '36px',
                maxWidth: '440px',
                margin: '20px auto',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
            }}>
                <h1 style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(26px, 7vw, 32px)',
                    fontWeight: '800',
                    textAlign: 'center',
                    marginBottom: '36px',
                    margin: '0 0 36px 0',
                    letterSpacing: '-0.03em',
                    filter: 'drop-shadow(0 2px 4px rgba(168, 85, 247, 0.3))'
                }}>
                    📱 Mon Profil
                </h1>

                {/* Photo de profil */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginBottom: '30px' 
                }}>
                    <ProfilePhotoManager
                        currentPhoto={currentProfilePhoto}
                        onPhotoUpdate={handlePhotoUpdate}
                    />
                </div>

                {/* Section XP et niveau */}
                {userProfile && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        padding: '24px',
                        marginBottom: '32px',
                        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <span style={{
                                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: '18px',
                                fontWeight: '700',
                                letterSpacing: '-0.01em'
                            }}>
                                {currentLevelName}
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(8px)',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                fontSize: '14px',
                                color: 'white',
                                fontWeight: '600'
                            }}>
                                {currentXp} XP
                            </span>
                        </div>
                        {/* Affichage du niveau */}
                        <div style={{
                            fontSize: '20px',
                            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontWeight: '800',
                            marginBottom: '16px',
                            textAlign: 'center',
                            letterSpacing: '-0.02em'
                        }}>
                            ✨ Niveau {currentLevel} - {currentLevelName}
                        </div>
                        
                        {/* Barre de progression */}
                        <div style={{
                            width: '100%',
                            height: '12px',
                            backgroundColor: 'rgba(55, 65, 81, 0.6)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '12px',
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)',
                                borderRadius: '12px',
                                transition: 'width 0.5s ease',
                                boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)'
                            }}></div>
                        </div>
                        
                        {currentLevel && xpForNextLevel > currentXp && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                textAlign: 'center'
                            }}>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    margin: 0,
                                    fontWeight: '500'
                                }}>
                                    🎯 {xpForNextLevel - currentXp} XP pour le prochain niveau
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Nom d'utilisateur */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '24px',
                    marginBottom: '32px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}>
                    <label style={{
                        display: 'block',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: 'white',
                        letterSpacing: '-0.01em'
                    }}>
                        📝 Nom d'utilisateur
                    </label>
                    <input 
                        type="text"
                        value={newUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(8px)',
                            border: `1px solid ${!usernameValidation.isValid ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '16px',
                            boxSizing: 'border-box',
                            transition: 'all 0.3s ease',
                            outline: 'none'
                        }}
                        placeholder="Votre nom d'utilisateur..."
                    />
                    
                    {/* Messages de validation */}
                    <div style={{ marginTop: '12px', minHeight: '24px' }}>
                        {checkingUsername && (
                            <div style={{
                                fontSize: '13px',
                                color: '#fbbf24',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(251, 191, 36, 0.1)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}>
                                <LoadingIcon />
                                Vérification de disponibilité...
                            </div>
                        )}
                        
                        {!checkingUsername && !usernameValidation.isValid && usernameValidation.error && (
                            <div style={{
                                fontSize: '13px',
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontWeight: '500'
                            }}>
                                ❌ {usernameValidation.error}
                            </div>
                        )}
                        
                        {!checkingUsername && usernameValidation.isValid && newUsername !== userProfile?.username && newUsername.trim() && (
                            <div style={{
                                fontSize: '13px',
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontWeight: '500'
                            }}>
                                ✅ Nom d'utilisateur disponible
                            </div>
                        )}
                        
                        {!newUsername.trim() && (
                            <div style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.6)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontStyle: 'italic'
                            }}>
                                📝 2-20 caractères, lettres, chiffres, _ et - uniquement
                            </div>
                        )}
                    </div>
                </div>

                {/* Profil Public */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '20px 24px',
                    marginBottom: '32px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            letterSpacing: '-0.01em'
                        }}>
                            🌍 Profil Public
                        </span>
                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '50px',
                        height: '24px'
                    }}>
                        <input
                            type="checkbox"
                            checked={userProfile?.isPublic || false}
                            onChange={(e) => handleTogglePublic(e.target.checked)}
                            style={{
                                opacity: 0,
                                width: 0,
                                height: 0
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: userProfile?.isPublic ? '#3b82f6' : '#4b5563',
                            borderRadius: '24px',
                            transition: '0.4s',
                            '&:before': {
                                content: '""',
                                position: 'absolute',
                                height: '18px',
                                width: '18px',
                                left: userProfile?.isPublic ? '29px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: '0.4s'
                            }
                        }}>
                            <div style={{
                                position: 'absolute',
                                height: '18px',
                                width: '18px',
                                left: userProfile?.isPublic ? '29px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: '0.4s'
                            }}></div>
                            {userProfile?.isPublic && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '8px',
                                    transform: 'translateY(-50%)',
                                    color: 'white',
                                    fontSize: '12px'
                                }}>
                                    ✓
                                </div>
                            )}
                        </span>
                    </label>
                    </div>

                    {/* Texte d'info */}
                    <p style={{
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginTop: '16px',
                        margin: '16px 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontWeight: '500'
                    }}>
                        <span style={{ fontSize: '16px' }}>ℹ️</span>
                        Rendre public permet aux amis de voir vos stats agrégées.
                    </p>
                </div>

                {/* Bouton Sauvegarder */}
                <button
                    onClick={handleSaveProfile}
                    disabled={loading || checkingUsername || !usernameValidation.isValid || newUsername === userProfile?.username}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: loading || checkingUsername || !usernameValidation.isValid || newUsername === userProfile?.username 
                            ? 'rgba(107, 114, 128, 0.7)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '700',
                        border: loading || checkingUsername || !usernameValidation.isValid || newUsername === userProfile?.username 
                            ? '1px solid rgba(107, 114, 128, 0.3)'
                            : '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '16px',
                        cursor: loading || checkingUsername || !usernameValidation.isValid || newUsername === userProfile?.username 
                            ? 'not-allowed' 
                            : 'pointer',
                        marginBottom: '20px',
                        opacity: loading || checkingUsername || !usernameValidation.isValid || newUsername === userProfile?.username 
                            ? 0.7 
                            : 1,
                        boxShadow: loading || checkingUsername || !usernameValidation.isValid || newUsername === userProfile?.username 
                            ? 'none'
                            : '0 4px 16px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.3s ease',
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                    aria-label="Sauvegarder le profil"
                >
                    {loading ? <LoadingIcon /> : "💾 Sauvegarder"}
                </button>

                {/* Bouton Déconnexion */}
                <button
                    onClick={handleSignOut}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '700',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
                        transition: 'all 0.3s ease',
                        letterSpacing: '-0.01em'
                    }}
                    aria-label="Se déconnecter de l'application"
                >
                    <span>🚀</span>
                    Déconnexion
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
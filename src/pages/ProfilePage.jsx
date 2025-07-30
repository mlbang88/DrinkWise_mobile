import React, { useState, useContext } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { gameplayConfig } from '../utils/data';
import LoadingIcon from '../components/LoadingIcon';

const ProfilePage = () => {
    const { auth, user, userProfile, db, appId, setMessageBox } = useContext(FirebaseContext);
    const [newUsername, setNewUsername] = useState(userProfile?.username || '');
    const [loading, setLoading] = useState(false);

    const currentXp = userProfile?.xp || 0;
    const currentLevel = gameplayConfig.levels.slice().reverse().find(level => currentXp >= level.xp) || gameplayConfig.levels[0];
    const currentLevelIndex = gameplayConfig.levels.findIndex(level => level.name === currentLevel.name);
    const nextLevel = gameplayConfig.levels[currentLevelIndex + 1];

    const xpForCurrentLevel = currentLevel.xp;
    const xpForNextLevel = nextLevel ? nextLevel.xp : currentXp;
    const progress = nextLevel ? ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100 : 100;

    const handleSaveProfile = async () => {
        if (!newUsername.trim()) return setMessageBox({ message: "Le nom ne peut pas être vide.", type: "error" });
        setLoading(true);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        try {
            await updateDoc(userProfileRef, {
                username: newUsername,
                username_lowercase: newUsername.toLowerCase()
            });
            // Les stats publiques seront mises à jour automatiquement par badgeService
            setMessageBox({ message: "Profil mis à jour !", type: "success" });
        } catch (error) {
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
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                margin: '20px auto'
            }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '30px',
                    margin: '0 0 30px 0'
                }}>
                    Mon Profil
                </h1>

                {/* Section XP et niveau */}
                {userProfile && (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px'
                        }}>
                            <span style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#a855f7'
                            }}>
                                Pote de Soirée
                            </span>
                            <span style={{
                                fontSize: '14px',
                                color: '#ccc'
                            }}>
                                {currentXp} XP
                            </span>
                        </div>
                        
                        {/* Barre de progression */}
                        <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#374151',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: '#8b5cf6',
                                borderRadius: '4px'
                            }}></div>
                        </div>
                        
                        {nextLevel && (
                            <p style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                textAlign: 'right',
                                margin: 0
                            }}>
                                {xpForNextLevel - currentXp} XP pour le prochain niveau
                            </p>
                        )}
                    </div>
                )}

                {/* Nom d'utilisateur */}
                <div style={{ marginBottom: '25px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px'
                    }}>
                        Nom d'utilisateur
                    </label>
                    <input 
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'rgba(55, 65, 81, 0.8)',
                            border: '1px solid #4b5563',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Profil Public */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px'
                }}>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '500'
                    }}>
                        Profil Public
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
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    <span style={{ fontSize: '14px' }}>ℹ️</span>
                    Rendre public permet aux amis de voir vos stats agrégées.
                </p>

                {/* Bouton Sauvegarder */}
                <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginBottom: '15px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? <LoadingIcon /> : "Sauvegarder"}
                </button>

                {/* Bouton Déconnexion */}
                <button
                    onClick={handleSignOut}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>↗</span>
                    Déconnexion
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
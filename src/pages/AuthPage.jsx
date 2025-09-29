import React, { useState, useContext } from 'react';
import ThemedText from '../styles/ThemedText.jsx';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import LoadingIcon from '../components/LoadingIcon';
import { validateEmail, validatePassword, getFirebaseErrorMessage, formatEmailForDisplay } from '../utils/authUtils';
import SocialLoginBenefits from '../components/SocialLoginBenefits';

function AuthPage() {
    const { auth, setMessageBox } = useContext(FirebaseContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [socialLoading, setSocialLoading] = useState('');
    const [showSocialHelp, setShowSocialHelp] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        
        // Validation côté client
        if (!validateEmail(email)) {
            setMessageBox({ message: "Veuillez saisir une adresse email valide.", type: 'error' });
            return;
        }
        
        if (!validatePassword(password)) {
            setMessageBox({ message: "Le mot de passe doit contenir au moins 6 caractères.", type: 'error' });
            return;
        }
        
        if (!isLogin && !username.trim()) {
            setMessageBox({ message: "Veuillez saisir un nom d'utilisateur.", type: 'error' });
            return;
        }
        
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setMessageBox({ message: "Connexion réussie ! 🎉", type: 'success' });
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                // Note: The username from the form is not directly used here.
                // The onAuthStateChanged listener in App.jsx will create the profile.
                // For a better UX, one would update the profile immediately after creation.
                setMessageBox({ message: "Compte créé avec succès ! Vous êtes maintenant connecté. 🎉", type: 'success' });
            }
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error.code);
            setMessageBox({ message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        // Validation côté client
        if (!email) {
            setMessageBox({ message: "Veuillez saisir votre adresse email.", type: 'error' });
            return;
        }
        
        if (!validateEmail(email)) {
            setMessageBox({ message: "Veuillez saisir une adresse email valide.", type: 'error' });
            return;
        }
        
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetEmailSent(true);
            setMessageBox({ 
                message: `📧 Email de réinitialisation envoyé à ${formatEmailForDisplay(email)} ! Vérifiez votre boîte mail (et vos spams).`, 
                type: 'success' 
            });
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error.code);
            setMessageBox({ message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setShowForgotPassword(false);
        setResetEmailSent(false);
        setEmail('');
        setPassword('');
        setUsername('');
    };

    const handleSocialAuth = async (provider) => {
        const providerName = provider === 'google' ? 'Google' : 'Facebook';
        setSocialLoading(provider);
        
        try {
            let authProvider;
            if (provider === 'google') {
                authProvider = new GoogleAuthProvider();
                authProvider.addScope('profile');
                authProvider.addScope('email');
            } else if (provider === 'facebook') {
                authProvider = new FacebookAuthProvider();
                authProvider.addScope('email');
                authProvider.addScope('public_profile');
            }

            const result = await signInWithPopup(auth, authProvider);
            const user = result.user;
            
            // Récupérer les informations du profil
            const displayName = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
            const photoURL = user.photoURL;
            
            setMessageBox({ 
                message: `🎉 Connexion réussie avec ${providerName} ! Bienvenue ${displayName}`, 
                type: 'success' 
            });

            // Note: Le profil utilisateur sera créé automatiquement par le listener dans App.jsx
            
        } catch (error) {
            console.error(`Erreur ${providerName}:`, error);
            
            let errorMessage = `Erreur lors de la connexion avec ${providerName}.`;
            
            if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'Un compte existe déjà avec cette adresse email mais avec un autre mode de connexion.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Connexion annulée par l\'utilisateur.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup bloqué par le navigateur. Veuillez autoriser les popups pour ce site.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Connexion annulée.';
            }
            
            setMessageBox({ message: errorMessage, type: 'error' });
        } finally {
            setSocialLoading('');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '32px'
            }}>
                {/* Titre */}
                <h1 style={{
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: '600',
                    margin: 0,
                    textAlign: 'center',
                    marginBottom: '64px'
                }}>
                    {showForgotPassword ? "Mot de passe oublié" : (isLogin ? "Connexion" : "Inscription")}
                </h1>

                {/* Formulaire */}
                <form onSubmit={showForgotPassword ? handleForgotPassword : handleAuth} style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px'
                }}>
                    {!isLogin && (
                        <div style={{ width: '100%' }}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Nom d'utilisateur
                            </label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '20px 24px',
                                    backgroundColor: '#1e293b',
                                    border: '2px solid #334155',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#334155';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.backgroundColor = '#1e293b';
                                }}
                            />
                        </div>
                    )}

                    <div style={{ width: '100%' }}>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '12px'
                        }}>
                            Email
                        </label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError(e.target.value && !validateEmail(e.target.value));
                            }} 
                            required
                            style={{
                                width: '100%',
                                padding: '20px 24px',
                                backgroundColor: '#1e293b',
                                border: `2px solid ${emailError ? '#ef4444' : '#334155'}`,
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#8b45ff';
                                e.target.style.backgroundColor = '#334155';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#334155';
                                e.target.style.backgroundColor = '#1e293b';
                            }}
                        />
                        {emailError && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '14px',
                                margin: '8px 0 0 0'
                            }}>
                                Format d'email invalide
                            </p>
                        )}
                    </div>

                    {!showForgotPassword && (
                        <div style={{ width: '100%' }}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Mot de passe
                            </label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError(e.target.value && !validatePassword(e.target.value));
                                }} 
                                required
                                style={{
                                    width: '100%',
                                    padding: '20px 24px',
                                    backgroundColor: '#1e293b',
                                    border: `2px solid ${passwordError ? '#ef4444' : '#334155'}`,
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#334155';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.backgroundColor = '#1e293b';
                                }}
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || (showForgotPassword && resetEmailSent)}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            backgroundColor: loading || (showForgotPassword && resetEmailSent) ? '#6b7280' : 
                                            showForgotPassword ? '#f59e0b' : '#8b45ff',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            cursor: loading || (showForgotPassword && resetEmailSent) ? 'not-allowed' : 'pointer',
                            marginTop: '16px',
                            transition: 'all 0.2s ease',
                            opacity: loading || (showForgotPassword && resetEmailSent) ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && !(showForgotPassword && resetEmailSent)) {
                                if (showForgotPassword) {
                                    e.target.style.backgroundColor = '#d97706';
                                } else {
                                    e.target.style.backgroundColor = '#7c3aed';
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && !(showForgotPassword && resetEmailSent)) {
                                if (showForgotPassword) {
                                    e.target.style.backgroundColor = '#f59e0b';
                                } else {
                                    e.target.style.backgroundColor = '#8b45ff';
                                }
                            }
                        }}
                    >
                        {loading ? <LoadingIcon /> : 
                         showForgotPassword ? 
                            (resetEmailSent ? "✅ Email envoyé" : "Envoyer l'email") :
                            (isLogin ? "Se connecter" : "Créer un compte")
                        }
                    </button>
                </form>

                {/* Connexion sociale - seulement en mode connexion/inscription */}
                {!showForgotPassword && (
                    <>
                        {/* Séparateur */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '32px 0',
                            width: '100%'
                        }}>
                            <div style={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: '#334155'
                            }}></div>
                            <span style={{
                                color: '#9ca3af',
                                padding: '0 16px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                ou continuez avec
                                <button
                                    type="button"
                                    onClick={() => setShowSocialHelp(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#8b45ff',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: 0
                                    }}
                                >
                                    ?
                                </button>
                            </span>
                            <div style={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: '#334155'
                            }}></div>
                        </div>

                        {/* Boutons de connexion sociale */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            width: '100%'
                        }}>
                            {/* Bouton Google */}
                            <button
                                type="button"
                                onClick={() => handleSocialAuth('google')}
                                disabled={loading || socialLoading !== ''}
                                style={{
                                    flex: 1,
                                    padding: '16px 20px',
                                    backgroundColor: socialLoading === 'google' ? '#6b7280' : '#ffffff',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    color: socialLoading === 'google' ? '#ffffff' : '#374151',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading || socialLoading !== '' ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    opacity: loading || socialLoading !== '' ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading && socialLoading === '') {
                                        e.target.style.backgroundColor = '#f9fafb';
                                        e.target.style.borderColor = '#d1d5db';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading && socialLoading === '') {
                                        e.target.style.backgroundColor = '#ffffff';
                                        e.target.style.borderColor = '#e5e7eb';
                                    }
                                }}
                            >
                                {socialLoading === 'google' ? (
                                    <LoadingIcon />
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Google
                                    </>
                                )}
                            </button>

                            {/* Bouton Facebook */}
                            <button
                                type="button"
                                onClick={() => handleSocialAuth('facebook')}
                                disabled={loading || socialLoading !== ''}
                                style={{
                                    flex: 1,
                                    padding: '16px 20px',
                                    backgroundColor: socialLoading === 'facebook' ? '#6b7280' : '#1877f2',
                                    border: '2px solid #1877f2',
                                    borderRadius: '12px',
                                    color: '#ffffff',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading || socialLoading !== '' ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    opacity: loading || socialLoading !== '' ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading && socialLoading === '') {
                                        e.target.style.backgroundColor = '#166fe5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading && socialLoading === '') {
                                        e.target.style.backgroundColor = '#1877f2';
                                    }
                                }}
                            >
                                {socialLoading === 'facebook' ? (
                                    <LoadingIcon />
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        Facebook
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Navigation entre les modes */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {showForgotPassword ? (
                        // Mode réinitialisation de mot de passe
                        <>
                            {!resetEmailSent && (
                                <p style={{
                                    color: '#9ca3af',
                                    fontSize: '14px',
                                    margin: 0,
                                    lineHeight: '1.5'
                                }}>
                                    Saisissez votre adresse email pour recevoir un lien de réinitialisation de votre mot de passe.
                                </p>
                            )}
                            <button 
                                onClick={resetForm}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#8b45ff',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#7c3aed';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#8b45ff';
                                }}
                            >
                                ← Retour à la connexion
                            </button>
                        </>
                    ) : (
                        // Mode connexion/inscription
                        <>
                            <div>
                                <span style={{
                                    color: '#9ca3af',
                                    fontSize: '16px'
                                }}>
                                    {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                                </span>
                                <button 
                                    onClick={() => setIsLogin(!isLogin)}
                                    style={{
                                        marginLeft: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#8b45ff',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '#7c3aed';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = '#8b45ff';
                                    }}
                                >
                                    {isLogin ? "S'inscrire" : "Se connecter"}
                                </button>
                            </div>
                            
                            {isLogin && (
                                <button 
                                    onClick={() => setShowForgotPassword(true)}
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#f59e0b',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '#d97706';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = '#f59e0b';
                                    }}
                                >
                                    Mot de passe oublié ?
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal d'aide pour la connexion sociale */}
            {showSocialHelp && (
                <SocialLoginBenefits onClose={() => setShowSocialHelp(false)} />
            )}
        </div>
    );
}

export default AuthPage;

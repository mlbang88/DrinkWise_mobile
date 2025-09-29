import React, { useState, useContext } from 'react';
import ThemedText from '../styles/ThemedText.jsx';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import LoadingIcon from '../components/LoadingIcon';
import { validateEmail, validatePassword, getFirebaseErrorMessage, formatEmailForDisplay } from '../utils/authUtils';

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
        </div>
    );
}

export default AuthPage;

import { useState, useContext } from 'react';
import ThemedText from '../styles/ThemedText.jsx';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { localImageData } from '../utils/data';
import LoadingIcon from '../components/LoadingIcon';

const mainBgStyle = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    transition: 'background-image 0.5s ease-in-out',
};
const App = () => (
  <ThemedText style={{ fontSize: 18 }}>
    Ceci est du texte qui s’adapte au thème !
  </ThemedText>
);

function AuthPage() {
    const { auth, setMessageBox } = useContext(FirebaseContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setMessageBox({ message: "Connexion réussie !", type: 'success' });
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                // Note: The username from the form is not directly used here.
                // The onAuthStateChanged listener in App.jsx will create the profile.
                // For a better UX, one would update the profile immediately after creation.
                setMessageBox({ message: "Compte créé avec succès ! Vous êtes maintenant connecté.", type: 'success' });
            }
        } catch (error) {
            setMessageBox({ message: `Erreur : ${error.code}`, type: 'error' });
        } finally {
            setLoading(false);
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
                    {isLogin ? "Connexion" : "Inscription"}
                </h1>

                {/* Formulaire */}
                <form onSubmit={handleAuth} style={{
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
                            onChange={(e) => setEmail(e.target.value)} 
                            required
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
                            onChange={(e) => setPassword(e.target.value)} 
                            required
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

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            backgroundColor: loading ? '#6b7280' : '#8b45ff',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '16px',
                            transition: 'all 0.2s ease',
                            opacity: loading ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#7c3aed';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#8b45ff';
                            }
                        }}
                    >
                        {loading ? <LoadingIcon /> : (isLogin ? "Se connecter" : "Créer un compte")}
                    </button>
                </form>

                {/* Lien pour changer de mode */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '32px'
                }}>
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
            </div>
        </div>
    );
}

export default AuthPage;
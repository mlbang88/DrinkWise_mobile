import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner';

const FriendStatsPage = ({ friendId, setCurrentPage }) => {
    const { db, appId, setMessageBox, userProfile } = useContext(FirebaseContext);
    const [friendStats, setFriendStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
        const unsub = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setFriendStats(doc.data());
            } else {
                setMessageBox({ message: "Le profil de cet ami est privé ou n'existe pas.", type: "info" });
            }
            setLoading(false);
        }, (error) => {
            console.error("Erreur chargement stats ami:", error);
            setLoading(false);
        });
        return () => unsub();
    }, [db, appId, friendId, setMessageBox]);

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url("https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            padding: '20px'
        }}>
            {/* Header avec bouton retour */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <button 
                    onClick={() => setCurrentPage('friends')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '28px',
                        cursor: 'pointer',
                        marginRight: '15px'
                    }}
                >
                    ←
                </button>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0,
                    textAlign: 'center',
                    flex: 1
                }}>
                    Stats de {friendStats?.username || '...'}
                </h1>
            </div>

            {friendStats ? (
                <div>
                    {/* Stats personnelles */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '20px',
                        padding: '25px',
                        marginBottom: '25px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            marginBottom: '25px'
                        }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Soirées:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalParties || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Boissons:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalDrinks || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Bagarres:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalFights || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Vomis:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalVomi || 0}</div>
                            </div>
                        </div>

                        {/* Boisson préférée */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ fontSize: '24px' }}>🏆</div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                                    Boisson Préférée
                                </div>
                                <div style={{ fontSize: '14px', color: '#f59e0b' }}>
                                    {friendStats.mostConsumedDrink?.type || 'Aucune'} ({friendStats.mostConsumedDrink?.quantity || 0} verres)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Battle de Stats */}
                    {userProfile?.publicStats && (
                        <div style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '20px',
                            padding: '25px',
                            border: '2px solid #8b5cf6'
                        }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                marginBottom: '20px',
                                margin: '0 0 20px 0'
                            }}>
                                ⚔️ Battle de Stats ⚔️
                            </h3>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '10px',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                <div style={{ color: '#ccc' }}>Vous</div>
                                <div style={{ color: '#ccc' }}>Stat</div>
                                <div style={{ color: '#ccc' }}>{friendStats.username}</div>
                                
                                {[
                                    { key: 'totalDrinks', label: 'Boissons' },
                                    { key: 'totalFights', label: 'Bagarres' },
                                    { key: 'totalVomi', label: 'Vomis' },
                                    { key: 'totalParties', label: 'Soirées' }
                                ].map(({ key, label }) => {
                                    const userVal = userProfile.publicStats[key] || 0;
                                    const friendVal = friendStats[key] || 0;
                                    const userColor = userVal >= friendVal ? '#10b981' : '#ef4444';
                                    const friendColor = friendVal >= userVal ? '#10b981' : '#ef4444';
                                    
                                    return (
                                        <React.Fragment key={key}>
                                            <div style={{ 
                                                color: userColor,
                                                fontSize: '16px',
                                                padding: '8px 0'
                                            }}>
                                                {userVal}
                                            </div>
                                            <div style={{ 
                                                color: 'white',
                                                fontSize: '14px',
                                                padding: '8px 0'
                                            }}>
                                                {label}
                                            </div>
                                            <div style={{ 
                                                color: friendColor,
                                                fontSize: '16px',
                                                padding: '8px 0'
                                            }}>
                                                {friendVal}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '20px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#ccc'
                }}>
                    Statistiques non disponibles.
                </div>
            )}
        </div>
    );
};

export default FriendStatsPage;
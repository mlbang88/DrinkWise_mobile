import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { BarChart, Trophy, Sparkles, Lightbulb } from 'lucide-react';

const StatsPage = () => {
    const { db, user, appId, setMessageBox, functions } = useContext(FirebaseContext);
    const { theme } = useTheme();
    const [myParties, setMyParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month', 'year'
    const [filteredParties, setFilteredParties] = useState([]);
    const [displayStats, setDisplayStats] = useState(null);

    useEffect(() => {
        if (!user || !db) { setLoading(false); return; }
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
        const unsubscribe = onSnapshot(q, (snap) => {
            const partiesData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            const sortedParties = partiesData.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setMyParties(sortedParties);
            setLoading(false);
        }, (error) => {
            console.error("Erreur lecture soirées:", error);
            setMessageBox({ message: "Erreur chargement de vos soirées.", type: "error" });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, user, appId, setMessageBox]);

    useEffect(() => {
        if (!myParties) return;
        const now = new Date();
        let filtered = myParties;
        if (timeFilter === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            filtered = myParties.filter(p => p.timestamp.toDate() >= oneWeekAgo);
        } else if (timeFilter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = myParties.filter(p => p.timestamp.toDate() >= startOfMonth);
        } else if (timeFilter === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filtered = myParties.filter(p => p.timestamp.toDate() >= startOfYear);
        }
        setFilteredParties(filtered);
    }, [myParties, timeFilter]);

    useEffect(() => {
        if (filteredParties) {
            const stats = badgeService.calculateGlobalStats(filteredParties);
            setDisplayStats(stats);
        }
    }, [filteredParties]);

    const processDrinkDataForChart = (parties) => {
        const drinkTotals = {};
        parties.forEach(party => {
            party.drinks.forEach(drink => {
                drinkTotals[drink.type] = (drinkTotals[drink.type] || 0) + drink.quantity;
            });
        });
        return Object.entries(drinkTotals).map(([name, value]) => ({ name, value }));
    };

    const drinkChartData = processDrinkDataForChart(filteredParties);
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url("https://images.unsplash.com/photo-1543007629-5c4e8a83ba4c?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            color: 'white'
        }}>
            {/* Titre principal */}
            <h2 style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: '600',
                margin: '0 0 32px 0',
                textAlign: 'left'
            }}>
                Statistiques & Outils
            </h2>

            {/* Filtres de période */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '32px',
                flexWrap: 'wrap'
            }}>
                {['week', 'month', 'year', 'all'].map(filter => (
                    <button 
                        key={filter} 
                        onClick={() => setTimeFilter(filter)}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: timeFilter === filter ? '#8b45ff' : '#2d3748',
                            color: 'white'
                        }}
                    >
                        {filter === 'week' ? 'Semaine' : filter === 'month' ? 'Mois' : filter === 'year' ? 'Année' : 'Tout'}
                    </button>
                ))}
            </div>

            {filteredParties.length === 0 ? (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '32px',
                    textAlign: 'center',
                    color: 'white',
                    fontSize: '16px'
                }}>
                    Aucune soirée enregistrée pour cette période.
                </div>
            ) : (
                <>
                    {/* Graphique Répartition des Boissons */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: '0 0 24px 0'
                        }}>
                            Répartition des Boissons
                        </h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={drinkChartData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={100} 
                                        fill="#8884d8" 
                                        label
                                    >
                                        {drinkChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1a1a2e', 
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }} 
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats de la Période */}
                    {displayStats && (
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '24px',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: '0 0 24px 0',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <BarChart size={20} style={{ marginRight: '8px', color: '#10b981' }} />
                                Stats de la Période
                            </h3>
                            
                            {/* Grille de stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px'
                            }}>
                                <div style={{ color: 'white' }}>
                                    <strong>🎉 Soirées :</strong> {displayStats.totalParties || 0}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <strong>🍻 Verres :</strong> {displayStats.totalDrinks || 0}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <strong>🍺 Volume :</strong> {displayStats.totalVolume ? `${(displayStats.totalVolume / 100).toFixed(1)}L` : '0L'}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <strong>🤢 Vomis :</strong> {displayStats.totalVomi || 0}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <strong>🥊 Bagarres :</strong> {displayStats.totalFights || 0}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <strong>💔 Coeurs brisés :</strong> {displayStats.totalHeartbreak || 0}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StatsPage;

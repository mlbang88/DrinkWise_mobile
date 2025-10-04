import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Calendar, TrendingUp, MapPin, Trophy, Filter, X } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { logger } from '../utils/logger';

// Enregistrer les composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * Timeline chronologique des conquêtes territoriales
 * Affiche l'historique avec graphique d'évolution et filtres par période
 */
const TerritoryHistory = ({ db, appId, userId, onClose }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('month'); // 'week', 'month', 'year', 'all'
    const [stats, setStats] = useState({
        totalConquests: 0,
        totalLost: 0,
        netGain: 0,
        avgPointsPerDay: 0
    });

    useEffect(() => {
        if (db && appId && userId) {
            loadHistory();
        }
    }, [db, appId, userId, period]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            console.log('🔍 TerritoryHistory: Chargement avec', { db: !!db, appId, userId, period });
            
            // Calculer la date de début selon la période
            const now = new Date();
            let startDate = new Date();

            switch (period) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                case 'all':
                    startDate = new Date(2000, 0, 1); // Début arbitraire
                    break;
            }

            console.log('📅 Période sélectionnée:', period, 'depuis', startDate);

            // Récupérer tous les venueControls de l'utilisateur
            // Note: On ne fait pas orderBy ici pour éviter de nécessiter un index composite
            const controlsQuery = query(
                collection(db, `artifacts/${appId}/venueControls`),
                where('userId', '==', userId)
            );

            console.log('🔍 Exécution requête Firestore...');
            const snapshot = await getDocs(controlsQuery);
            console.log('✅ Snapshot reçu:', snapshot.docs.length, 'documents');
            
            const historyData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    venueName: data.venueName,
                    venueAddress: data.venueAddress,
                    placeId: data.placeId,
                    controlledSince: data.controlledSince?.toDate(),
                    totalPoints: data.totalPoints,
                    visitCount: data.visitCount,
                    lastVisit: data.lastVisit?.toDate(),
                    coordinates: data.coordinates,
                    level: data.level || 'Bronze'
                };
            }).filter(item => item.controlledSince >= startDate);

            // Trier par date (plus récent d'abord)
            historyData.sort((a, b) => b.controlledSince - a.controlledSince);

            // Calculer les statistiques
            const totalConquests = historyData.length;
            const totalPoints = historyData.reduce((sum, item) => sum + (item.totalPoints || 0), 0);
            const daysSinceEarliest = historyData.length > 0
                ? Math.max(1, Math.floor((now - historyData[historyData.length - 1].controlledSince) / (1000 * 60 * 60 * 24)))
                : 1;

            setStats({
                totalConquests,
                totalLost: 0, // TODO: implémenter le tracking des territoires perdus
                netGain: totalConquests,
                avgPointsPerDay: Math.round(totalPoints / daysSinceEarliest)
            });

            setHistory(historyData);
            logger.info('✅ Historique chargé', { count: historyData.length });

        } catch (error) {
            logger.error('❌ Erreur chargement historique', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Préparer les données pour le graphique
    const prepareChartData = () => {
        if (history.length === 0) {
            return null;
        }

        // Grouper par date
        const groupedByDate = {};
        history.forEach(item => {
            const date = item.controlledSince.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!groupedByDate[date]) {
                groupedByDate[date] = {
                    count: 0,
                    totalPoints: 0
                };
            }
            groupedByDate[date].count += 1;
            groupedByDate[date].totalPoints += item.totalPoints || 0;
        });

        // Créer un tableau cumulatif
        const dates = Object.keys(groupedByDate).sort();
        let cumulativeCount = 0;
        const cumulativeData = dates.map(date => {
            cumulativeCount += groupedByDate[date].count;
            return cumulativeCount;
        });

        return {
            labels: dates.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            }),
            datasets: [
                {
                    label: 'Lieux contrôlés',
                    data: cumulativeData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }
            ]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#ffffff',
                bodyColor: '#d1d5db',
                borderColor: '#8b5cf6',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: (items) => items[0].label,
                    label: (item) => `${item.parsed.y} lieu${item.parsed.y > 1 ? 'x' : ''} contrôlé${item.parsed.y > 1 ? 's' : ''}`
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(139, 92, 246, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(139, 92, 246, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        size: 11
                    },
                    stepSize: 1
                }
            }
        }
    };

    const chartData = prepareChartData();

    const periods = [
        { value: 'week', label: 'Semaine', icon: '📅' },
        { value: 'month', label: 'Mois', icon: '📆' },
        { value: 'year', label: 'Année', icon: '🗓️' },
        { value: 'all', label: 'Tout', icon: '📜' }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#0a0f1e',
                borderRadius: '20px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
                border: '2px solid rgba(139, 92, 246, 0.3)'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #5b21b6 100%)',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid rgba(139, 92, 246, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Calendar size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '700',
                                margin: 0
                            }}>
                                Historique des Conquêtes
                            </h2>
                            <p style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '14px',
                                margin: '4px 0 0 0'
                            }}>
                                Votre progression territoriale
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >
                        <X size={20} color="white" />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '24px'
                }}>
                    {/* Filtres de période */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        {periods.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                style={{
                                    padding: '12px',
                                    backgroundColor: period === p.value ? '#8b5cf6' : '#1f2937',
                                    color: period === p.value ? 'white' : '#9ca3af',
                                    border: period === p.value ? '2px solid #a78bfa' : '2px solid transparent',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    if (period !== p.value) {
                                        e.currentTarget.style.backgroundColor = '#374151';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (period !== p.value) {
                                        e.currentTarget.style.backgroundColor = '#1f2937';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{p.icon}</span>
                                <span>{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Stats cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
                            borderRadius: '12px',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}>
                            <div style={{ color: '#22c55e', fontSize: '12px', marginBottom: '4px' }}>Conquêtes</div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{stats.totalConquests}</div>
                        </div>
                        
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))',
                            borderRadius: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '4px' }}>Perdus</div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{stats.totalLost}</div>
                        </div>
                        
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))',
                            borderRadius: '12px',
                            border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                            <div style={{ color: '#8b5cf6', fontSize: '12px', marginBottom: '4px' }}>Net</div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>+{stats.netGain}</div>
                        </div>
                        
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05))',
                            borderRadius: '12px',
                            border: '1px solid rgba(251, 191, 36, 0.3)'
                        }}>
                            <div style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '4px' }}>Pts/jour</div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{stats.avgPointsPerDay}</div>
                        </div>
                    </div>

                    {/* Graphique */}
                    {chartData && (
                        <div style={{
                            backgroundColor: '#1f2937',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '24px',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            height: '300px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <TrendingUp size={20} color="#8b5cf6" />
                                <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                                    Évolution
                                </span>
                            </div>
                            <div style={{ height: 'calc(100% - 36px)' }}>
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}

                    {/* Liste chronologique */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <MapPin size={20} color="#8b5cf6" />
                            <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                                Chronologie ({history.length})
                            </span>
                        </div>

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                Chargement...
                            </div>
                        ) : history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                Aucune conquête pour cette période
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {history.map((item, index) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            backgroundColor: '#1f2937',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#374151';
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#1f2937';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>
                                                    {item.venueName}
                                                </div>
                                                <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>
                                                    {item.venueAddress}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '4px 12px',
                                                backgroundColor: getLevelColor(item.level),
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: 'white',
                                                height: 'fit-content'
                                            }}>
                                                {item.level}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                            <div>
                                                <Trophy size={14} style={{ display: 'inline', marginRight: '4px', color: '#fbbf24' }} />
                                                {item.totalPoints} pts
                                            </div>
                                            <div>
                                                📅 {item.controlledSince.toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div>
                                                🔄 {item.visitCount} visites
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fonction helper pour les couleurs de niveau
const getLevelColor = (level) => {
    switch (level) {
        case 'Platine': return '#0ea5e9';
        case 'Or': return '#fbbf24';
        case 'Argent': return '#9ca3af';
        case 'Bronze': return '#c27803';
        default: return '#6b7280';
    }
};

export default TerritoryHistory;

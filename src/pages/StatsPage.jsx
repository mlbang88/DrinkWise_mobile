import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { BarChart, Trophy, Sparkles, Lightbulb } from 'lucide-react';

const StatsPage = () => {
    const { db, user, appId, setMessageBox, functions } = useContext(FirebaseContext);
    const [myParties, setMyParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month', 'year'
    const [filteredParties, setFilteredParties] = useState([]);
    const [displayStats, setDisplayStats] = useState(null);
    const [selectedPartyForWhatIf, setSelectedPartyForWhatIf] = useState('');
    const [whatIfChangesInput, setWhatIfChangesInput] = useState('');
    const [whatIfOutcome, setWhatIfOutcome] = useState(null);
    const [loadingWhatIf, setLoadingWhatIf] = useState(false);
    const [drinkSuggestion, setDrinkSuggestion] = useState('');
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);

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

    const analyzeWhatIfScenario = async () => {
        if (!selectedPartyForWhatIf || !whatIfChangesInput.trim()) return;
        setLoadingWhatIf(true);
        setWhatIfOutcome(null);
        const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');
        const partyObject = myParties.find(p => p.id === selectedPartyForWhatIf);
        const prompt = `Soirée originale: ${JSON.stringify(partyObject)}. Changements hypothétiques: "${whatIfChangesInput}". Comment la soirée aurait-elle changé ? Sois créatif et raconte une petite histoire amusante (3 phrases max).`;
        try {
            const result = await callGeminiAPI({ prompt });
            if (result.data.text) {
                setWhatIfOutcome(result.data.text);
            }
        } catch (error) {
            console.error("Erreur 'What If' via Cloud Function:", error);
            setMessageBox({ message: "Erreur lors de l'analyse du scénario.", type: "error" });
        } finally {
            setLoadingWhatIf(false);
        }
    };

    const generateDrinkSuggestion = async () => {
        if (myParties.length === 0) return;
        setLoadingSuggestion(true);
        setDrinkSuggestion('');
        const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');
        const pastDrinksSummary = myParties.slice(0, 5).map(p => p.drinks.map(d => d.brand || d.type).join(', ')).join('; ');
        const prompt = `Basé sur ces boissons que j'ai récemment bues: ${pastDrinksSummary}, suggère une nouvelle boisson (cocktail, bière, vin...) que je pourrais aimer. Réponds avec juste le nom de la boisson et une très courte description (1 phrase).`;
        try {
            const result = await callGeminiAPI({ prompt });
            if (result.data.text) {
                setDrinkSuggestion(result.data.text);
            }
        } catch (error) {
            console.error("Erreur suggestion boisson via Cloud Function:", error);
            setMessageBox({ message: "Erreur de suggestion de boisson.", type: "error" });
        } finally {
            setLoadingSuggestion(false);
        }
    };

    const processDrinkDataForChart = (parties) => {
        const drinkTotals = {};
        parties.forEach(party => {
            party.drinks.forEach(drink => {
                drinkTotals[drink.type] = (drinkTotals[drink.type] || 0) + drink.quantity;
            });
        });
        return Object.entries(drinkTotals).map(([name, value]) => ({ name, value }));
    };

    const processPartyDataForChart = (parties) => {
        const monthCounts = {};
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
        parties.forEach(party => {
            const month = party.timestamp.toDate().getMonth();
            const monthName = monthNames[month];
            monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
        });
        return monthNames.map(name => ({ name, soirées: monthCounts[name] || 0 }));
    };

    const drinkChartData = processDrinkDataForChart(filteredParties);
    const partyChartData = processPartyDataForChart(filteredParties);
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

    const _cardClassName = "bg-black/30 backdrop-blur-md border border-gray-700";
    const _inputClassName = "bg-gray-900/50 text-white border-gray-600";
    const _activeFilterClass = "bg-purple-600 text-white";
    const _inactiveFilterClass = "bg-gray-500/50 hover:bg-gray-500/80";

    if (loading) return <LoadingSpinner />;

    return (
        <div className="mobile-container">
            {/* Header mobile */}
            <div className="mobile-header">
                <h2 className="mobile-title">
                    Statistiques & Outils
                </h2>
            </div>

            <div className="mobile-main">
                {/* Filtres de période */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {['week', 'month', 'year', 'all'].map(filter => (
                        <button 
                            key={filter} 
                            onClick={() => setTimeFilter(filter)}
                            className={`px-4 py-3 rounded-xl border-none font-semibold cursor-pointer transition-all duration-200 ${
                                timeFilter === filter ? 'bg-purple-600 text-white' : 'bg-gray-600 bg-opacity-50 text-white hover:bg-gray-600 hover:bg-opacity-80'
                            }`}
                        >
                            {filter === 'week' ? 'Semaine' : filter === 'month' ? 'Mois' : filter === 'year' ? 'Année' : 'Tout'}
                        </button>
                    ))}
                </div>

                {filteredParties.length === 0 ? (
                    <div className="mobile-card text-center">
                        <p className="text-white text-base">
                            Aucune soirée enregistrée pour cette période.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Graphique Répartition des Boissons */}
                        <div className="mobile-card mb-6">
                            <h3 className="text-white text-xl font-semibold mb-6">
                                Répartition des Boissons
                            </h3>
                            <div className="h-80">
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

                        {/* Graphique Soirées par Mois */}
                        <div className="mobile-card mb-6">
                            <h3 className="text-white text-xl font-semibold mb-6">
                                Soirées par Mois
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={partyChartData}>
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#9ca3af" 
                                            fontSize={12}
                                        />
                                        <YAxis 
                                            stroke="#9ca3af" 
                                            fontSize={12}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1a1a2e', 
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white'
                                            }} 
                                        />
                                        <Bar dataKey="soirées" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </ReBarChart>
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
                            
                            {/* Grille de stats 2x4 */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '24px'
                            }}>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Soirées:</span> {displayStats.totalParties}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Boissons:</span> {displayStats.totalDrinks}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Volume total:</span> {displayStats.totalVolume ? `${(displayStats.totalVolume / 100).toFixed(1)}L` : '0L'}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Bagarres:</span> {displayStats.totalFights}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Vomis:</span> {displayStats.totalVomi}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Recals:</span> {displayStats.totalRecal}
                                </div>
                                <div style={{ color: 'white' }}>
                                    <span style={{ fontWeight: '600' }}>Filles parlées:</span> {displayStats.totalGirlsTalkedTo}
                                </div>
                            </div>

                            {/* Elle veut, elle veut sur une ligne séparée */}
                            <div style={{
                                color: 'white',
                                marginBottom: '24px'
                            }}>
                                <span style={{ fontWeight: '600' }}>Elle veut, elle veut:</span> {displayStats.totalElleVeutElleVeut}
                            </div>

                            {/* Boisson Préférée */}
                            <div style={{
                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                border: '1px solid rgba(255, 193, 7, 0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '24px'
                            }}>
                                <Trophy size={24} style={{ color: '#ffc107', marginRight: '12px' }} />
                                <div>
                                    <p style={{ 
                                        color: 'white', 
                                        fontWeight: '600', 
                                        margin: '0 0 4px 0',
                                        fontSize: '16px'
                                    }}>
                                        Boisson Préférée
                                    </p>
                                    <p style={{ 
                                        color: '#ffc107', 
                                        margin: '0 0 4px 0',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}>
                                        {displayStats.mostConsumedDrink?.type} ({displayStats.mostConsumedDrink?.quantity} verres)
                                    </p>
                                    {displayStats.mostConsumedDrink?.brand && (
                                        <p style={{ 
                                            color: '#9ca3af', 
                                            margin: 0,
                                            fontSize: '14px'
                                        }}>
                                            Marque favorite : {displayStats.mostConsumedDrink.brand}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Détail des volumes par type */}
                            {displayStats.drinkVolumes && Object.keys(displayStats.drinkVolumes).length > 0 && (
                                <div style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <h4 style={{
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        margin: '0 0 12px 0',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <Sparkles size={18} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                        Volumes par type de boisson
                                    </h4>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                        gap: '8px'
                                    }}>
                                        {Object.entries(displayStats.drinkVolumes).map(([type, volume]) => (
                                            <div key={type} style={{ color: '#e5e7eb', fontSize: '14px' }}>
                                                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{type}:</span> {(volume / 100).toFixed(1)}L
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Résumés des Soirées */}
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
                            Résumés de Soirées
                        </h3>
                        
                        {filteredParties.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                                Aucune soirée pour cette période.
                            </p>
                        ) : (
                            <div style={{
                                maxHeight: '400px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                {filteredParties.map((party) => (
                                    <div 
                                        key={party.id} 
                                        style={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '16px'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <h4 style={{
                                                color: 'white',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                margin: 0
                                            }}>
                                                {party.date} - {party.category}
                                            </h4>
                                            <span style={{
                                                color: '#9ca3af',
                                                fontSize: '14px'
                                            }}>
                                                {party.location || 'Lieu non spécifié'}
                                            </span>
                                        </div>
                                        
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                            gap: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                🍺 {party.drinks?.reduce((sum, drink) => sum + drink.quantity, 0) || 0} boissons
                                            </div>
                                            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                👥 {party.girlsTalkedTo || 0} filles
                                            </div>
                                            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                🤮 {party.vomi || 0} vomis
                                            </div>
                                            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                👊 {party.fights || 0} bagarres
                                            </div>
                                        </div>

                                        {party.summary && (
                                            <div style={{
                                                backgroundColor: 'rgba(139, 69, 255, 0.1)',
                                                border: '1px solid rgba(139, 69, 255, 0.3)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                marginTop: '8px'
                                            }}>
                                                <p style={{
                                                    color: '#c4b5fd',
                                                    fontSize: '14px',
                                                    fontStyle: 'italic',
                                                    margin: 0,
                                                    lineHeight: '1.4'
                                                }}>
                                                    {party.summary}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Suggestion de Boisson */}
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
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Sparkles size={20} style={{ marginRight: '8px', color: '#ffc107' }} />
                    Suggestion de Boisson
                </h3>
                <button 
                    onClick={generateDrinkSuggestion} 
                    disabled={loadingSuggestion || myParties.length === 0}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        backgroundColor: loadingSuggestion || myParties.length === 0 ? '#6b7280' : '#f97316',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loadingSuggestion || myParties.length === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: loadingSuggestion || myParties.length === 0 ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!loadingSuggestion && myParties.length > 0) {
                            e.target.style.backgroundColor = '#ea580c';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loadingSuggestion && myParties.length > 0) {
                            e.target.style.backgroundColor = '#f97316';
                        }
                    }}
                >
                    {loadingSuggestion ? <LoadingIcon /> : 'Trouver une nouvelle boisson'}
                </button>
                {drinkSuggestion && (
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <p style={{ 
                            color: 'white', 
                            fontStyle: 'italic', 
                            margin: 0,
                            fontSize: '16px'
                        }}>
                            {drinkSuggestion}
                        </p>
                    </div>
                )}
            </div>

            {/* Analyse "Et si...?" */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px'
            }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Lightbulb size={20} style={{ marginRight: '8px', color: '#3b82f6' }} />
                    Analyse "Et si...?"
                </h3>
                <select 
                    onChange={(e) => setSelectedPartyForWhatIf(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        backgroundColor: '#2d3748',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        marginBottom: '16px'
                    }}
                >
                    <option value="">-- Choisissez une soirée (toutes périodes) --</option>
                    {myParties.map(p => (
                        <option key={p.id} value={p.id} style={{ backgroundColor: '#2d3748', color: 'white' }}>
                            {p.date} - {p.category}
                        </option>
                    ))}
                </select>
                
                {selectedPartyForWhatIf && (
                    <>
                        <textarea 
                            value={whatIfChangesInput} 
                            onChange={(e) => setWhatIfChangesInput(e.target.value)} 
                            placeholder="Ex: si j'avais bu 2 bières de moins..." 
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                backgroundColor: '#2d3748',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none',
                                marginBottom: '16px',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                        <button 
                            onClick={analyzeWhatIfScenario} 
                            disabled={loadingWhatIf}
                            style={{
                                width: '100%',
                                padding: '16px 24px',
                                backgroundColor: loadingWhatIf ? '#6b7280' : '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loadingWhatIf ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: loadingWhatIf ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!loadingWhatIf) {
                                    e.target.style.backgroundColor = '#7c3aed';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loadingWhatIf) {
                                    e.target.style.backgroundColor = '#8b45ff';
                                }
                            }}
                        >
                            {loadingWhatIf ? <LoadingIcon /> : 'Analyser le Scénario'}
                        </button>
                        {whatIfOutcome && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <p style={{ 
                                    color: 'white', 
                                    fontStyle: 'italic', 
                                    margin: 0,
                                    fontSize: '16px'
                                }}>
                                    {whatIfOutcome}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
            </div>
        </div>
    );
};

export default StatsPage;
import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { normalizeString } from '../utils/helpers';
import { drinkImageLibrary } from '../utils/data';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { BarChart, Trophy, Sparkles, Lightbulb, Calendar, Camera } from 'lucide-react';

const StatsPage = () => {
    const { db, user, appId, setMessageBox, functions } = useContext(FirebaseContext);
    const { theme } = useTheme();
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

    // États pour la section souvenirs
    const [showMemories, setShowMemories] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedSeason, setSelectedSeason] = useState('all');
    const [availableYears, setAvailableYears] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [memorySummary, setMemorySummary] = useState(null);

    useEffect(() => {
        if (!user || !db) { setLoading(false); return; }
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
        const unsubscribe = onSnapshot(q, (snap) => {
            const partiesData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            const sortedParties = partiesData.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setMyParties(sortedParties);
            
            // Calculer les années disponibles pour les souvenirs
            const years = [...new Set(partiesData.map(p => p.timestamp.toDate().getFullYear()))];
            setAvailableYears(years.sort((a, b) => b - a));
            if (years.length > 0 && !years.includes(selectedYear)) {
                setSelectedYear(years[0]);
            }
            
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

    // Fonctions pour les souvenirs
    const getLocalImageForDrink = (drinkType, drinkBrand) => {
        const normalizedBrand = normalizeString(drinkBrand);
        const normalizedType = normalizeString(drinkType);

        if (drinkBrand && drinkImageLibrary[normalizedBrand]) {
            return drinkImageLibrary[normalizedBrand];
        }
        if (drinkImageLibrary[normalizedType]) {
            return drinkImageLibrary[normalizedType];
        }
        return drinkImageLibrary['default'];
    };

    const generateNarrativeFromTemplate = (stats, period) => {
        const volumeInLiters = stats.totalVolume ? (stats.totalVolume / 100).toFixed(1) : '0';
        const favoriteVolume = stats.drinkVolumes[stats.mostConsumedDrink.type] ? (stats.drinkVolumes[stats.mostConsumedDrink.type] / 100).toFixed(1) : '0';
        const templates = [
            `Ce fut un(e) ${period} mémorable ! Vous avez participé à ${stats.totalParties} soirées, consommant ${volumeInLiters}L de liquide, avec une préférence marquée pour le/la ${stats.mostConsumedDrink.brand || stats.mostConsumedDrink.type}, que vous avez savouré ${stats.mostConsumedDrink.quantity} fois (${favoriteVolume}L au total).`,
            `Quel(le) ${period} ! Entre vos ${stats.totalParties} soirées et ${volumeInLiters}L de boissons, le/la ${stats.mostConsumedDrink.brand || stats.mostConsumedDrink.type} a été votre fidèle allié, avec ${stats.mostConsumedDrink.quantity} verres au compteur soit ${favoriteVolume}L.`,
            `Bilan de votre ${period} : ${stats.totalParties} soirées endiablées et ${volumeInLiters}L de liquide consommé. Votre boisson de prédilection ? Le/la ${stats.mostConsumedDrink.brand || stats.mostConsumedDrink.type}, sans hésitation (${stats.mostConsumedDrink.quantity} verres = ${favoriteVolume}L).`,
            `Ce ${period}, vous n'avez pas chômé avec ${stats.totalParties} soirées et ${volumeInLiters}L ingurgités ! Le carburant de vos exploits était clairement le/la ${stats.mostConsumedDrink.brand || stats.mostConsumedDrink.type}, consommé ${stats.mostConsumedDrink.quantity} fois pour un total de ${favoriteVolume}L.`
        ];
        const randomIndex = Math.floor(Math.random() * templates.length);
        return templates[randomIndex];
    };

    const handleGenerateMemory = () => {
        setGenerating(true);

        const getSeasonDates = (year, season) => {
            if (season === 'winter') return { start: new Date(year - 1, 11, 1), end: new Date(year, 1, 29) };
            if (season === 'spring') return { start: new Date(year, 2, 1), end: new Date(year, 4, 31) };
            if (season === 'summer') return { start: new Date(year, 5, 1), end: new Date(year, 7, 31) };
            if (season === 'autumn') return { start: new Date(year, 8, 1), end: new Date(year, 10, 30) };
            return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) }; // 'all'
        };

        const { start, end } = getSeasonDates(selectedYear, selectedSeason);
        const filteredParties = myParties.filter(p => {
            const partyDate = p.timestamp.toDate();
            return partyDate >= start && partyDate <= end;
        });

        if (filteredParties.length === 0) {
            setMessageBox({ message: "Aucune soirée trouvée pour cette période.", type: "info" });
            setGenerating(false);
            return;
        }

        const stats = badgeService.calculateGlobalStats(filteredParties);
        const imageUrl = getLocalImageForDrink(stats.mostConsumedDrink.type, stats.mostConsumedDrink.brand);
        const seasonName = { winter: 'Hiver', spring: 'Printemps', summer: 'Été', autumn: 'Automne', all: "l'Année" }[selectedSeason];
        const period = `${seasonName} ${selectedYear}`;
        const narrative = generateNarrativeFromTemplate(stats, seasonName.toLowerCase());
        const title = `Votre Rétro ${period}`;

        setMemorySummary({
            stats,
            narrative,
            imageUrl,
            period,
            title
        });

        setGenerating(false);
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

    const cardClassName = "bg-black/30 backdrop-blur-md border border-gray-700";
    const inputClassName = "bg-gray-900/50 text-white border-gray-600";
    const activeFilterClass = "bg-purple-600 text-white";
    const inactiveFilterClass = "bg-gray-500/50 hover:bg-gray-500/80";

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url("https://images.unsplash.com/photo-1543007629-5c4e8a83ba4c?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: '20px 20px 20px 20px',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* Titre principal */}
            <h2 style={{
                color: 'white',
                fontSize: 'clamp(20px, 6vw, 28px)',
                fontWeight: '600',
                margin: '0 0 32px 0',
                textAlign: 'left'
            }}>
                Statistiques & Outils
            </h2>

            {/* Section Souvenirs */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: 'clamp(16px, 5vw, 24px)',
                marginBottom: '24px'
            }}>
                {memorySummary ? (
                    // Vue du souvenir généré
                    <div style={{
                        background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
                        borderRadius: '20px',
                        padding: '24px',
                        color: 'white',
                        position: 'relative',
                        margin: '0 auto',
                        maxWidth: '400px'
                    }}>
                        {/* Bouton retour */}
                        <button 
                            onClick={() => setMemorySummary(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                color: 'white',
                                fontSize: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ←
                        </button>

                        {/* Titre principal */}
                        <h1 style={{
                            textAlign: 'center',
                            fontSize: 'clamp(18px, 5vw, 24px)',
                            fontWeight: '600',
                            margin: '20px 0 32px 0',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                        }}>
                            {memorySummary.title}
                        </h1>

                        {/* Image de la boisson avec overlay */}
                        <div style={{
                            position: 'relative',
                            width: '200px',
                            height: '200px',
                            margin: '0 auto 24px auto',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '3px solid rgba(255, 255, 255, 0.3)'
                        }}>
                            <img 
                                src={memorySummary.imageUrl}
                                alt={memorySummary.stats.mostConsumedDrink.brand || memorySummary.stats.mostConsumedDrink.type}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    console.log('Image failed to load:', memorySummary.imageUrl);
                                    e.target.src = 'https://images.unsplash.com/photo-1514362545857-3bc7d00a937b?q=80&w=2070&auto=format&fit=crop';
                                }}
                            />
                            {/* Icône trophée */}
                            <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '12px',
                                background: '#8b45ff',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px'
                            }}>
                                🏆
                            </div>
                        </div>

                        {/* Titre boisson */}
                        <h2 style={{
                            textAlign: 'center',
                            fontSize: 'clamp(14px, 4vw, 16px)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            margin: '0 0 8px 0'
                        }}>
                            Votre Boisson N°1
                        </h2>

                        {/* Nom de la boisson */}
                        <h3 style={{
                            textAlign: 'center',
                            fontSize: 'clamp(20px, 6vw, 28px)',
                            fontWeight: '700',
                            margin: '0 0 8px 0',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            lineHeight: '1.2'
                        }}>
                            {memorySummary.stats.mostConsumedDrink.brand || memorySummary.stats.mostConsumedDrink.type}
                        </h3>

                        {/* Quantité */}
                        <p style={{
                            textAlign: 'center',
                            fontSize: 'clamp(16px, 4.5vw, 18px)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            margin: '0 0 32px 0'
                        }}>
                            {memorySummary.stats.mostConsumedDrink.quantity} verres bus
                        </p>

                        {/* Statistiques */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'clamp(12px, 4vw, 16px)',
                            marginBottom: '24px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                    fontSize: 'clamp(14px, 4.5vw, 18px)', 
                                    fontWeight: '600',
                                    wordWrap: 'break-word'
                                }}>Soirées: {memorySummary.stats.totalParties}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                    fontSize: 'clamp(14px, 4.5vw, 18px)', 
                                    fontWeight: '600',
                                    wordWrap: 'break-word'
                                }}>Lieux visités: {Object.keys(memorySummary.stats.locationTypes || {}).length}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                    fontSize: 'clamp(14px, 4.5vw, 18px)', 
                                    fontWeight: '600',
                                    wordWrap: 'break-word'
                                }}>Bagarres: {memorySummary.stats.totalFights || 0}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                    fontSize: 'clamp(14px, 4.5vw, 18px)', 
                                    fontWeight: '600',
                                    wordWrap: 'break-word'
                                }}>Vomis: {memorySummary.stats.totalVomi || 0}</div>
                            </div>
                        </div>

                        {/* Texte narratif */}
                        <p style={{
                            textAlign: 'center',
                            fontSize: 'clamp(12px, 3.5vw, 14px)',
                            fontStyle: 'italic',
                            color: 'rgba(255, 255, 255, 0.9)',
                            lineHeight: '1.4',
                            margin: 0,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                        }}>
                            {memorySummary.narrative}
                        </p>
                    </div>
                ) : (
                    // Vue de configuration
                    <>
                        <h3 style={{
                            color: 'white',
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: '0 0 16px 0',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Camera size={20} style={{ marginRight: '8px', color: '#c084fc' }} />
                            Vos Souvenirs
                        </h3>

                        <div style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '24px',
                            maxWidth: '400px',
                            margin: '0 auto'
                        }}>
                            {/* Sélecteur d'année */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    marginBottom: '8px'
                                }}>
                                    Année
                                </label>
                                <select 
                                    value={selectedYear} 
                                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '16px',
                                        backgroundColor: '#2d3748',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        outline: 'none'
                                    }}
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year} style={{ backgroundColor: '#2d3748' }}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sélecteur de période */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    marginBottom: '8px'
                                }}>
                                    Période
                                </label>
                                <select 
                                    value={selectedSeason} 
                                    onChange={e => setSelectedSeason(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '16px',
                                        backgroundColor: '#2d3748',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="all" style={{ backgroundColor: '#2d3748' }}>Toute l'année</option>
                                    <option value="winter" style={{ backgroundColor: '#2d3748' }}>Hiver</option>
                                    <option value="spring" style={{ backgroundColor: '#2d3748' }}>Printemps</option>
                                    <option value="summer" style={{ backgroundColor: '#2d3748' }}>Été</option>
                                    <option value="autumn" style={{ backgroundColor: '#2d3748' }}>Automne</option>
                                </select>
                            </div>

                            {/* Bouton de génération */}
                            <button 
                                onClick={handleGenerateMemory} 
                                disabled={generating || myParties.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '16px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: 'white',
                                    backgroundColor: generating || myParties.length === 0 ? '#6b7280' : '#c084fc',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: generating || myParties.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: generating || myParties.length === 0 ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!generating && myParties.length > 0) {
                                        e.target.style.backgroundColor = '#a855f7';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!generating && myParties.length > 0) {
                                        e.target.style.backgroundColor = '#c084fc';
                                    }
                                }}
                            >
                                {generating ? <LoadingIcon /> : <Calendar size={20} />}
                                {generating ? 'Génération...' : 'Générer mon Souvenir'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Filtres de période */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '32px',
                flexWrap: 'wrap'
            }}>
                {['week', 'month', 'year', 'all'].map(filter => (
                    <button 
                        key={filter} 
                        onClick={() => setTimeFilter(filter)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: timeFilter === filter ? '#8b45ff' : '#2d3748',
                            color: 'white',
                            flex: '1',
                            minWidth: '0',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                            if (timeFilter !== filter) {
                                e.target.style.backgroundColor = '#374151';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (timeFilter !== filter) {
                                e.target.style.backgroundColor = '#2d3748';
                            }
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

                    {/* Graphique Soirées par Mois */}
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
                            Soirées par Mois
                        </h3>
                        <div style={{ height: '300px' }}>
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
    );
};

export default StatsPage;
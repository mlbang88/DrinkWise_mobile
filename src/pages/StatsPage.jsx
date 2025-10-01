import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { ExperienceService } from '../services/experienceService';
import { normalizeString } from '../utils/helpers';
import { drinkImageLibrary } from '../utils/data';
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';
import { Flame, Trophy, Lightbulb, GitBranch, Rocket, Sparkles, Camera, Calendar, BarChart3 } from 'lucide-react';
import { logger } from '../utils/logger.js';
import EditPartyModal from '../components/EditPartyModal';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';

// Phase 2C: Animation components
import AnimatedCard from '../components/AnimatedCard';
import AnimatedChart from '../components/AnimatedChart';
import AnimatedList from '../components/AnimatedList';

const StatsPage = () => {
    const { db, user, appId, setMessageBox, functions, userProfile } = useContext(FirebaseContext);
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
    const [loadingSystemRepair, setLoadingSystemRepair] = useState(false);

    // États pour la section souvenirs
    const [showMemories, setShowMemories] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedSeason, setSelectedSeason] = useState('all');
    const [availableYears, setAvailableYears] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [memorySummary, setMemorySummary] = useState(null);
    
    // États pour l'édition/suppression des soirées
    const [editingParty, setEditingParty] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (!user || !db) { setLoading(false); return; }
        
        let unsubscribe = null;
        
        // Petit délai pour éviter les conflits de listeners
        const timeoutId = setTimeout(() => {
            const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
            unsubscribe = onSnapshot(q, (snap) => {
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
                logger.error("Erreur lecture soirées", { error: error.message });
                setMessageBox({ message: "Erreur chargement de vos soirées.", type: "error" });
                setLoading(false);
            });
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) {
                try {
                    unsubscribe();
                } catch (error) {
                    console.warn('⚠️ Erreur nettoyage listener stats:', error);
                }
            }
        };
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
        if (filteredParties && userProfile) {
            const stats = ExperienceService.calculateRealStats(filteredParties, userProfile);
            setDisplayStats(stats);
        }
    }, [filteredParties, userProfile]);

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
            logger.error("Erreur 'What If' via Cloud Function", { error: error.message });
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
            logger.error("Erreur suggestion boisson via Cloud Function", { error: error.message });
            setMessageBox({ message: "Erreur de suggestion de boisson.", type: "error" });
        } finally {
            setLoadingSuggestion(false);
        }
    };

    // Fonction de réparation du système
    const repairSystem = async () => {
        setLoadingSystemRepair(true);
        const repairFriendshipSystem = httpsCallable(functions, 'repairFriendshipSystem');
        
        try {
            const result = await repairFriendshipSystem({ appId });
            if (result.data.success) {
                setMessageBox({ 
                    message: result.data.message, 
                    type: "success" 
                });
            }
        } catch (error) {
            logger.error("Erreur réparation système", { error: error.message });
            setMessageBox({ 
                message: "Erreur lors de la réparation du système.", 
                type: "error" 
            });
        } finally {
            setLoadingSystemRepair(false);
        }
    };

    // ===== GESTION ÉDITION/SUPPRESSION DES SOIRÉES =====
    
    const handleEditParty = (party) => {
        logger.info('Ouverture édition soirée depuis StatsPage', { partyId: party.id });
        setEditingParty(party);
        setShowEditModal(true);
    };

    const handleDeleteParty = (party) => {
        // Confirmation rapide avant suppression
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la soirée du ${party.date} ?`)) {
            logger.info('Confirmation suppression soirée depuis StatsPage', { partyId: party.id });
            setEditingParty(party);
            setShowEditModal(true);
        }
    };

    const handlePartyUpdated = (updatedParty) => {
        // Les parties viennent de l'onSnapshot, elles se mettront à jour automatiquement
        logger.info('Soirée mise à jour depuis StatsPage', { partyId: updatedParty.id });
    };

    const handlePartyDeleted = (partyId) => {
        // Les parties viennent de l'onSnapshot, elles se mettront à jour automatiquement
        logger.info('Soirée supprimée depuis StatsPage', { partyId });
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
        const mostConsumed = stats.mostConsumedDrink || { type: 'boissons', quantity: 0, brand: '' };
        const favoriteVolume = stats.drinkVolumes?.[mostConsumed.type] ? (stats.drinkVolumes[mostConsumed.type] / 100).toFixed(1) : '0';
        const templates = [
            `Ce fut un(e) ${period} mémorable ! Vous avez participé à ${stats.totalParties} soirées, consommant ${volumeInLiters}L de liquide, avec une préférence marquée pour le/la ${mostConsumed.brand || mostConsumed.type}, que vous avez savouré ${mostConsumed.quantity} fois (${favoriteVolume}L au total).`,
            `Quel(le) ${period} ! Entre vos ${stats.totalParties} soirées et ${volumeInLiters}L de boissons, le/la ${mostConsumed.brand || mostConsumed.type} a été votre fidèle allié, avec ${mostConsumed.quantity} verres au compteur soit ${favoriteVolume}L.`,
            `Bilan de votre ${period} : ${stats.totalParties} soirées endiablées et ${volumeInLiters}L de liquide consommé. Votre boisson de prédilection ? Le/la ${mostConsumed.brand || mostConsumed.type}, sans hésitation (${mostConsumed.quantity} verres = ${favoriteVolume}L).`,
            `Ce ${period}, vous n'avez pas chômé avec ${stats.totalParties} soirées et ${volumeInLiters}L ingurgités ! Le carburant de vos exploits était clairement le/la ${mostConsumed.brand || mostConsumed.type}, consommé ${mostConsumed.quantity} fois pour un total de ${favoriteVolume}L.`
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

        if (!userProfile) {
            setMessageBox({ message: "Profil utilisateur non disponible.", type: "error" });
            setGenerating(false);
            return;
        }

        const stats = ExperienceService.calculateRealStats(filteredParties, userProfile);
        const imageUrl = getLocalImageForDrink(stats.mostConsumedDrink?.type, stats.mostConsumedDrink?.brand);
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
            background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.15) 0%, rgba(59, 130, 246, 0.15) 25%, rgba(16, 185, 129, 0.15) 75%, rgba(251, 191, 36, 0.15) 100%), linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1543007629-5c4e8a83ba4c?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: 'clamp(16px, 4vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)'
        }}>

            {/* Titre principal */}
            <h2 style={{
                background: 'linear-gradient(135deg, #8b45ff 0%, #3b82f6 50%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 'clamp(24px, 6vw, 32px)',
                fontWeight: '700',
                margin: '0 0 32px 0',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
                📊 Statistiques & Outils IA ✨
            </h2>

            {/* Section Souvenirs */}
            <div 
                role="region"
                aria-label="Section souvenirs et statistiques"
                tabIndex={0}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.008) 100%)',
                    borderRadius: 'clamp(16px, 4vw, 24px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: 'clamp(20px, 5vw, 28px)',
                    marginBottom: 'clamp(20px, 4vw, 28px)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                onFocus={(e) => {
                    e.target.style.outline = '2px solid rgba(139, 69, 255, 0.6)';
                    e.target.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                    e.target.style.outline = 'none';
                }}
            >
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
                                    logger.warn('Image failed to load', { imageUrl: memorySummary.imageUrl });
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
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.008) 100%)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '28px',
                            marginBottom: '24px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                        }}>
                            <h3 style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: 'clamp(18px, 5vw, 22px)',
                                fontWeight: '700',
                                margin: '0 0 28px 0',
                                display: 'flex',
                                alignItems: 'center',
                                letterSpacing: '-0.02em'
                            }}>
                                <BarChart3 size={24} style={{ marginRight: '12px', color: '#10b981', filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))' }} />
                                Stats de la Période
                            </h3>
                            
                            {/* Grille de stats 2x4 */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '32px'
                            }}>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Soirées</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalParties}</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Boissons</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalDrinks}</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Volume total</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalVolume ? `${(displayStats.totalVolume / 100).toFixed(1)}L` : '0L'}</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Bagarres</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalFights}</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Vomis</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalVomi}</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Recals</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalRecal}</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '16px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default'
                                }}>
                                    <span style={{ 
                                        fontWeight: '500', 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>Filles parlées</span>
                                    <span style={{
                                        fontWeight: '700',
                                        color: 'white',
                                        fontSize: '20px'
                                    }}>{displayStats.totalGirlsTalkedTo}</span>
                                </div>
                            </div>

                            {/* Elle veut, elle veut sur une ligne séparée */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.1) 100%)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                padding: '20px',
                                marginBottom: '32px',
                                textAlign: 'center',
                                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.1)'
                            }}>
                                <span style={{ 
                                    fontWeight: '500', 
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '14px',
                                    display: 'block',
                                    marginBottom: '8px'
                                }}>Elle veut, elle veut</span>
                                <span style={{
                                    fontWeight: '700',
                                    color: '#ec4899',
                                    fontSize: '28px',
                                    filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3))'
                                }}>{displayStats.totalElleVeutElleVeut}</span>
                            </div>

                            {/* Boisson Préférée */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 193, 7, 0.4)',
                                borderRadius: '20px',
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '24px',
                                boxShadow: '0 8px 32px rgba(255, 193, 7, 0.1)',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #ffc107 0%, #f59e0b 100%)',
                                    borderRadius: '16px',
                                    padding: '12px',
                                    marginRight: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 16px rgba(255, 193, 7, 0.3)'
                                }}>
                                    <Trophy size={28} style={{ color: 'white' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ 
                                        color: 'white', 
                                        fontWeight: '700', 
                                        margin: '0 0 8px 0',
                                        fontSize: '18px',
                                        letterSpacing: '-0.02em'
                                    }}>
                                        Boisson Préférée
                                    </p>
                                    <p style={{ 
                                        background: 'linear-gradient(135deg, #ffc107 0%, #f59e0b 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        margin: '0 0 6px 0',
                                        fontSize: '16px',
                                        fontWeight: '700'
                                    }}>
                                        {displayStats.mostConsumedDrink?.type} ({displayStats.mostConsumedDrink?.quantity} verres)
                                    </p>
                                    {displayStats.mostConsumedDrink?.brand && (
                                        <p style={{ 
                                            color: 'rgba(255, 255, 255, 0.7)', 
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}>
                                            Marque favorite : {displayStats.mostConsumedDrink.brand}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Détail des volumes par type */}
                            {displayStats.drinkVolumes && Object.keys(displayStats.drinkVolumes).length > 0 && (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
                                }}>
                                    <h4 style={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        margin: '0 0 20px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        letterSpacing: '-0.02em'
                                    }}>
                                        <Sparkles size={22} style={{ marginRight: '12px', color: '#3b82f6', filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' }} />
                                        Volumes par type de boisson
                                    </h4>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                        gap: '12px'
                                    }}>
                                        {Object.entries(displayStats.drinkVolumes).map(([type, volume]) => (
                                            <div key={type} style={{
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                padding: '12px',
                                                textAlign: 'center',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                <div style={{ 
                                                    color: '#3b82f6', 
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    marginBottom: '4px'
                                                }}>{type}</div>
                                                <div style={{
                                                    color: 'white',
                                                    fontWeight: '700',
                                                    fontSize: '16px'
                                                }}>{(volume / 100).toFixed(1)}L</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Résumés des Soirées */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0.008) 100%)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '28px',
                        marginBottom: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                    }}>
                        <h3 style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: 'clamp(20px, 5.5vw, 24px)',
                            fontWeight: '700',
                            margin: '0 0 28px 0',
                            letterSpacing: '-0.02em',
                            textAlign: 'center'
                        }}>
                            📖 Résumés de Soirées
                        </h3>
                        
                        {filteredParties.length === 0 ? (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '32px',
                                textAlign: 'center'
                            }}>
                                <p style={{ 
                                    color: 'rgba(255, 255, 255, 0.6)', 
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}>
                                    🎭 Aucune soirée pour cette période.
                                </p>
                            </div>
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
                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '16px',
                                            padding: '20px',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            cursor: 'default',
                                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        {/* Boutons Edit/Delete */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            display: 'flex',
                                            gap: '8px',
                                            zIndex: 10
                                        }}>
                                            <button
                                                onClick={() => handleEditParty(party)}
                                                style={{
                                                    padding: '8px 10px',
                                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                                                    backdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                    borderRadius: '10px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Modifier cette soirée"
                                                aria-label="Modifier cette soirée"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteParty(party)}
                                                style={{
                                                    padding: '8px 10px',
                                                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
                                                    backdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                                    borderRadius: '10px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Supprimer cette soirée"
                                                aria-label="Supprimer cette soirée"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '12px',
                                            paddingRight: '100px'
                                        }}>
                                            <h4 style={{
                                                background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                margin: 0,
                                                letterSpacing: '-0.01em'
                                            }}>
                                                {party.date} - {party.category}
                                            </h4>
                                            <span style={{
                                                color: 'rgba(255, 255, 255, 0.6)',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)'
                                            }}>
                                                📍 {party.location || 'Lieu non spécifié'}
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

            {/* Section Maintenance Système */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                marginTop: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    🔧 Maintenance Système
                </h3>
                <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    margin: '0 0 16px 0'
                }}>
                    Réparer automatiquement les problèmes de synchronisation (amis, niveaux, données)
                </p>
                <button 
                    onClick={repairSystem} 
                    disabled={loadingSystemRepair}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        backgroundColor: loadingSystemRepair ? '#6b7280' : '#dc2626',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loadingSystemRepair ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: loadingSystemRepair ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!loadingSystemRepair) {
                            e.target.style.backgroundColor = '#b91c1c';
                            e.target.style.transform = 'translateY(-2px) scale(1.02)';
                            e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loadingSystemRepair) {
                            e.target.style.backgroundColor = '#dc2626';
                            e.target.style.transform = 'translateY(0) scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                        }
                    }}
                >
                    {loadingSystemRepair ? <LoadingIcon /> : '🔧 Réparer le Système'}
                </button>
            </div>

            {/* Modal d'édition des soirées */}
            {showEditModal && editingParty && (
                <EditPartyModal
                    partyData={editingParty}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingParty(null);
                    }}
                    onPartyUpdated={handlePartyUpdated}
                    onPartyDeleted={handlePartyDeleted}
                />
            )}
        </div>
    );
};

export default StatsPage;
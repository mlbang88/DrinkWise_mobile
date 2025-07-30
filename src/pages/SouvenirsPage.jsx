import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import { normalizeString } from '../utils/helpers';
import { drinkImageLibrary } from '../utils/data';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingIcon from '../components/LoadingIcon';

const SouvenirsPage = () => {
    const { db, user, appId, setMessageBox } = useContext(FirebaseContext);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedSeason, setSelectedSeason] = useState('all');
    const [availableYears, setAvailableYears] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const partiesData = snapshot.docs.map(doc => doc.data());
            setParties(partiesData);
            const years = [...new Set(partiesData.map(p => p.timestamp.toDate().getFullYear()))];
            setAvailableYears(years.sort((a, b) => b - a));
            if (years.length > 0 && !years.includes(selectedYear)) {
                setSelectedYear(years[0]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, user, appId]);

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

    const handleGenerate = () => {
        setGenerating(true);

        const getSeasonDates = (year, season) => {
            if (season === 'winter') return { start: new Date(year - 1, 11, 1), end: new Date(year, 1, 29) };
            if (season === 'spring') return { start: new Date(year, 2, 1), end: new Date(year, 4, 31) };
            if (season === 'summer') return { start: new Date(year, 5, 1), end: new Date(year, 7, 31) };
            if (season === 'autumn') return { start: new Date(year, 8, 1), end: new Date(year, 10, 30) };
            return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) }; // 'all'
        };

        const { start, end } = getSeasonDates(selectedYear, selectedSeason);
        const filteredParties = parties.filter(p => {
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

        setSummary({
            stats,
            narrative,
            imageUrl,
            period,
            title
        });

        setGenerating(false);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url("https://images.unsplash.com/photo-1543007629-5c4e8a83ba4c?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            {summary ? (
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
                        onClick={() => setSummary(null)}
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
                        fontSize: '24px',
                        fontWeight: '600',
                        margin: '20px 0 32px 0'
                    }}>
                        {summary.title}
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
                            src={summary.imageUrl}
                            alt={summary.stats.mostConsumedDrink.brand || summary.stats.mostConsumedDrink.type}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                console.log('Image failed to load:', summary.imageUrl);
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
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: '0 0 8px 0'
                    }}>
                        Votre Boisson N°1
                    </h2>

                    {/* Nom de la boisson */}
                    <h3 style={{
                        textAlign: 'center',
                        fontSize: '28px',
                        fontWeight: '700',
                        margin: '0 0 8px 0'
                    }}>
                        {summary.stats.mostConsumedDrink.brand || summary.stats.mostConsumedDrink.type}
                    </h3>

                    {/* Quantité */}
                    <p style={{
                        textAlign: 'center',
                        fontSize: '18px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        margin: '0 0 32px 0'
                    }}>
                        {summary.stats.mostConsumedDrink.quantity} verres bus
                    </p>

                    {/* Statistiques */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>Soirées: {summary.stats.totalParties}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>Lieux visités: {Object.keys(summary.stats.locationTypes || {}).length}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>Bagarres: {summary.stats.totalFights || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>Vomis: {summary.stats.totalVomi || 0}</div>
                        </div>
                    </div>

                    {/* Texte narratif */}
                    <p style={{
                        textAlign: 'center',
                        fontSize: '14px',
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.9)',
                        lineHeight: '1.4',
                        margin: 0
                    }}>
                        {summary.narrative}
                    </p>
                </div>
            ) : (
                // Vue de configuration
                <>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        marginBottom: '32px'
                    }}>
                    </div>

                    {/* Conteneur principal */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '32px 24px',
                        margin: '0 auto',
                        maxWidth: '400px'
                    }}>
                        {/* Titre */}
                        <h2 style={{
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: '600',
                            textAlign: 'center',
                            margin: '0 0 32px 0'
                        }}>
                            Vos Souvenirs
                        </h2>

                        {/* Sélecteur d'année */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Année
                            </label>
                            <select 
                                value={selectedYear} 
                                onChange={e => setSelectedYear(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '16px',
                                    backgroundColor: '#1a1a2e',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    outline: 'none'
                                }}
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sélecteur de période */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Période
                            </label>
                            <select 
                                value={selectedSeason} 
                                onChange={e => setSelectedSeason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '16px',
                                    backgroundColor: '#1a1a2e',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    outline: 'none'
                                }}
                            >
                                <option value="all">Toute l'année</option>
                                <option value="winter">Hiver</option>
                                <option value="spring">Printemps</option>
                                <option value="summer">Été</option>
                                <option value="autumn">Automne</option>
                            </select>
                        </div>

                        {/* Bouton de génération */}
                        <button 
                            onClick={handleGenerate} 
                            disabled={generating}
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: 'white',
                                backgroundColor: '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: generating ? 'not-allowed' : 'pointer',
                                opacity: generating ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {generating ? <LoadingIcon /> : null}
                            {generating ? 'Génération...' : 'Générer mon Souvenir'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SouvenirsPage;
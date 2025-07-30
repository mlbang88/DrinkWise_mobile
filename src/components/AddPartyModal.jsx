import React, { useState, useContext, useCallback } from 'react';
import { Timestamp, addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data';
import LoadingSpinner from './LoadingSpinner';
import DrinkAnalyzer from './DrinkAnalyzer';
import QuizManagerSimple from './QuizManagerSimple';
import { PlusCircle, Trash2, XCircle } from 'lucide-react';

const AddPartyModal = ({ onClose, onPartySaved, draftData }) => {
    console.log("🎭 AddPartyModal rendu/re-rendu", draftData ? "avec données du draft" : "normal");
    
    const { db, user, appId, setMessageBox, functions, userProfile } = useContext(FirebaseContext);
    
    // Initialiser les données depuis le draft si disponible
    const initializeFromDraft = () => {
        if (draftData) {
            console.log("📝 Initialisation depuis le draft:", draftData);
            return {
                date: draftData.startTime ? new Date(draftData.startTime.seconds ? draftData.startTime.toDate() : draftData.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                drinks: draftData.drinks && draftData.drinks.length > 0 ? draftData.drinks : [{ type: 'Bière', brand: '', quantity: 1 }],
                stats: {
                    girlsTalkedTo: draftData.events?.girlsTalkedTo || 0,
                    fights: draftData.events?.fights || 0,
                    recal: draftData.events?.recal || 0,
                    vomi: draftData.events?.vomi || 0,
                    elleVeutElleVeut: draftData.events?.elleVeutElleVeut || 0
                },
                location: draftData.location || '',
                category: draftData.category || partyCategories[0]
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            drinks: [{ type: 'Bière', brand: '', quantity: 1 }],
            stats: { girlsTalkedTo: 0, fights: 0, recal: 0, vomi: 0, elleVeutElleVeut: 0 },
            location: '',
            category: partyCategories[0]
        };
    };

    const initialData = initializeFromDraft();
    const [date, setDate] = useState(initialData.date);
    const [drinks, setDrinks] = useState(initialData.drinks);
    const [stats, setStats] = useState(initialData.stats);
    const [location, setLocation] = useState(initialData.location);
    const [category, setCategory] = useState(initialData.category);
    const [lastPartyData, setLastPartyData] = useState(null);
    const [lastPartyId, setLastPartyId] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Fonction pour gérer la fin du quiz
    const handleQuizComplete = () => {
        console.log("✅ Quiz terminé, fermeture du modal");
        setShowQuiz(false);
        
        // Maintenant on peut informer le parent que tout est terminé
        if (onPartySaved) {
            onPartySaved();
        }
        
        onClose();
    };

    const handleStatChange = (field, value) => setStats(prev => ({ ...prev, [field]: Math.max(0, Number(value)) }));
    const handleDrinkChange = (index, field, value) => {
        const newDrinks = [...drinks];
        newDrinks[index][field] = field === 'quantity' ? parseInt(value, 10) || 0 : value;
        if (field === 'type') newDrinks[index].brand = '';
        setDrinks(newDrinks);
    };

    // Fonction pour gérer la détection automatique de boisson
    const handleDrinkDetected = (drinkType, detectedBrand) => {
        console.log('🤖 Boisson détectée:', { drinkType, detectedBrand });
        
        // Ajouter ou remplacer la première boisson avec le type et la marque détectés
        const newDrinks = [...drinks];
        if (newDrinks.length === 0) {
            newDrinks.push({ 
                type: drinkType, 
                brand: detectedBrand || '', 
                quantity: 1 
            });
        } else {
            newDrinks[0] = { 
                ...newDrinks[0], 
                type: drinkType, 
                brand: detectedBrand || newDrinks[0].brand || ''
            };
        }
        setDrinks(newDrinks);
    };
    const addDrink = () => setDrinks([...drinks, { type: 'Bière', brand: '', quantity: 1 }]);
    const removeDrink = (index) => setDrinks(drinks.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("🎉 Début soumission de soirée", { user: !!user, db: !!db });
        
        if (!user || !db) return setMessageBox({ message: "Connexion requise.", type: "error" });

        const partyData = { date, drinks, ...stats, location, category, timestamp: Timestamp.now(), userId: user.uid, username: userProfile?.username || "Anonyme" };
        console.log("📋 Données de soirée:", partyData);
        
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), partyData);
            console.log("✅ Soirée sauvegardée avec ID:", docRef.id);
            
            setLastPartyData(partyData);
            setLastPartyId(docRef.id);
            
            // Générer le résumé de la soirée
            generatePartySummary(partyData, docRef.id);
            
            // Stocker les données pour le quiz simple
            console.log("🎯 Soirée sauvegardée, déclenchement du quiz simple");
            setLastPartyData(partyData);
            setLastPartyId(docRef.id);
            setShowQuiz(true);
            
            console.log("✅ Quiz simple préparé avec les données:", { partyData, id: docRef.id });
            
            // Log de vérification des états
            setTimeout(() => {
                console.log("🔍 États après setShowQuiz:", { 
                    showQuiz: true, // On sait qu'on vient de le set à true
                    hasLastPartyData: !!partyData,
                    hasLastPartyId: !!docRef.id
                });
            }, 100);
            
            // NE PAS informer le parent maintenant - on attend que le quiz soit terminé
            // if (onPartySaved) {
            //     onPartySaved();
            // }
            
            // NE PAS fermer le modal - on attend que le quiz soit terminé
            
        } catch (error) {
            console.error("❌ Erreur enregistrement soirée:", error);
            setMessageBox({ message: "Erreur lors de l'enregistrement.", type: "error" });
        }
    };

    const generatePartySummary = useCallback(async (partyDetails, docId) => {
        setLoadingSummary(true);
        const callGeminiAPI = httpsCallable(functions, 'callGeminiAPI');
        const prompt = `Génère un résumé de soirée amusant et mémorable (max 3 phrases) basé sur: ${JSON.stringify(partyDetails)}. Sois créatif et humoristique.`;
        try {
            console.log("🤖 Génération du résumé de soirée...");
            const result = await callGeminiAPI({ prompt });
            if (result.data.text) {
                const summary = result.data.text;
                const partyRef = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docId);
                await updateDoc(partyRef, { summary });
                console.log("✅ Résumé généré et sauvegardé:", summary);
            }
        } catch (error) { 
            console.error("❌ Erreur génération résumé via Cloud Function:", error); 
        } finally {
            setLoadingSummary(false);
        }
    }, [db, user, appId, functions]);

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
        >
            <div 
                style={{
                    backgroundColor: '#1a1a2e',
                    borderRadius: '20px',
                    border: '2px solid #8b45ff',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Header avec titre et bouton close */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 24px 0 24px',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: '600',
                        margin: 0,
                        textAlign: 'center',
                        flex: 1
                    }}>
                        {draftData ? '📝 Finaliser la Soirée' : 'Enregistrer une Soirée'}
                    </h2>
                    
                    {draftData && (
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            left: '24px',
                            right: '24px',
                            backgroundColor: 'rgba(139, 69, 255, 0.2)',
                            border: '1px solid #8b45ff',
                            borderRadius: '8px',
                            padding: '12px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                color: '#c084fc',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                🎉 Données du Mode Soirée récupérées
                            </div>
                            <div style={{
                                color: '#9ca3af',
                                fontSize: '12px',
                                marginTop: '4px'
                            }}>
                                Vous pouvez maintenant finaliser et compléter votre soirée
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#9ca3af';
                        }}
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {loadingSummary && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        zIndex: 10
                    }}>
                        <LoadingSpinner text="Finalisation..." />
                    </div>
                )}

                {/* Contenu scrollable */}
                <div style={{
                    padding: '0 24px 24px 24px',
                    paddingTop: draftData ? '20px' : '0', // Espace supplémentaire si notification
                    maxHeight: 'calc(90vh - 120px)',
                    overflowY: 'auto'
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Date */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Date:
                            </label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#374151';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.backgroundColor = '#2d3748';
                                }}
                            />
                        </div>

                        {/* Analyseur de boisson IA */}
                        <DrinkAnalyzer 
                            onDrinkDetected={handleDrinkDetected}
                            setMessageBox={setMessageBox}
                        />

                        {/* Boissons */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '16px'
                            }}>
                                Boissons:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {drinks.map((drink, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: '#2d3748',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px'
                                    }}>
                                        <select 
                                            value={drink.type} 
                                            onChange={(e) => handleDrinkChange(index, 'type', e.target.value)}
                                            style={{
                                                width: '100px',
                                                padding: '10px 8px',
                                                backgroundColor: '#374151',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '11px',
                                                outline: 'none'
                                            }}
                                        >
                                            {drinkOptions.map(opt => (
                                                <option key={opt.type} value={opt.type} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                    {opt.type}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        {drinkOptions.find(opt => opt.type === drink.type)?.brands.length > 0 && (
                                            <select 
                                                value={drink.brand} 
                                                onChange={(e) => handleDrinkChange(index, 'brand', e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    padding: '10px 8px',
                                                    backgroundColor: '#374151',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '11px',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="" style={{ backgroundColor: '#374151', color: 'white' }}>Marque</option>
                                                {drinkOptions.find(opt => opt.type === drink.type)?.brands.map(brand => (
                                                    <option key={brand} value={brand} style={{ backgroundColor: '#374151', color: 'white' }}>
                                                        {brand}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        
                                        <input 
                                            type="number" 
                                            value={drink.quantity} 
                                            onChange={(e) => handleDrinkChange(index, 'quantity', e.target.value)} 
                                            min="1"
                                            style={{
                                                width: '50px',
                                                padding: '10px 8px',
                                                backgroundColor: '#374151',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                textAlign: 'center'
                                            }}
                                        />
                                        
                                        <button 
                                            type="button" 
                                            onClick={() => removeDrink(index)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: '#dc2626',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={addDrink}
                                style={{
                                    width: '100%',
                                    padding: '16px 24px',
                                    backgroundColor: '#8b45ff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#8b45ff'}
                            >
                                <PlusCircle size={20} />
                                Ajouter
                            </button>
                        </div>
                        {/* Statistiques en grille 2x2 */}
                        <div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px'
                            }}>
                                {/* Vomis */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Vomis:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.vomi} 
                                        onChange={(e) => handleStatChange('vomi', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>

                                {/* Bagarres */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Bagarres:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.fights} 
                                        onChange={(e) => handleStatChange('fights', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>

                                {/* Recals */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Recals:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.recal} 
                                        onChange={(e) => handleStatChange('recal', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>

                                {/* Filles parlées */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        color: '#9ca3af',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        marginBottom: '8px'
                                    }}>
                                        Filles parlées:
                                    </label>
                                    <input 
                                        type="number" 
                                        value={stats.girlsTalkedTo} 
                                        onChange={(e) => handleStatChange('girlsTalkedTo', e.target.value)} 
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            backgroundColor: '#2d3748',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '16px',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Elle veut, elle veut (champ seul) */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Elle veut, elle veut:
                            </label>
                            <input 
                                type="number" 
                                value={stats.elleVeutElleVeut} 
                                onChange={(e) => handleStatChange('elleVeutElleVeut', e.target.value)} 
                                min="0"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                        {/* Lieu */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Lieu:
                            </label>
                            <input 
                                type="text" 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="Où s'est déroulée la soirée ?"
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#374151';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.backgroundColor = '#2d3748';
                                }}
                            />
                        </div>
                        
                        {/* Catégorie */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Catégorie:
                            </label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px 20px',
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b45ff';
                                    e.target.style.backgroundColor = '#374151';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.backgroundColor = '#2d3748';
                                }}
                            >
                                {partyCategories.map(cat => (
                                    <option key={cat} value={cat} style={{ backgroundColor: '#2d3748', color: 'white' }}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Bouton submit */}
                        <button 
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '18px 24px',
                                backgroundColor: '#8b45ff',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginTop: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#8b45ff'}
                        >
                            🎉 Enregistrer & Lancer le Quiz
                        </button>
                    </form>
                </div>
            </div>
            
            {/* Quiz simple qui s'affiche après la soumission */}
            {(() => {
                console.log("🔍 Condition Quiz:", { showQuiz, hasLastPartyData: !!lastPartyData, hasLastPartyId: !!lastPartyId });
                return showQuiz && lastPartyData && lastPartyId;
            })() && (
                <QuizManagerSimple
                    partyData={lastPartyData}
                    partyId={lastPartyId}
                    onQuizComplete={handleQuizComplete}
                />
            )}
        </div>
    );
};

export default AddPartyModal;
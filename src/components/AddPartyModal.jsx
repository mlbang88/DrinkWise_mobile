import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Timestamp, addDoc, collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { drinkOptions, partyCategories } from '../utils/data';
import LoadingSpinner from './LoadingSpinner';
import DrinkAnalyzer from './DrinkAnalyzer';
import QuizManagerSimple from './QuizManagerSimple';
import { PlusCircle, Trash2, XCircle, Users, User } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
                category: draftData.category || partyCategories[0],
                companions: draftData.companions || { type: 'none', selectedIds: [], selectedNames: [] }
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            drinks: [{ type: 'Bière', brand: '', quantity: 1 }],
            stats: { girlsTalkedTo: 0, fights: 0, recal: 0, vomi: 0, elleVeutElleVeut: 0 },
            location: '',
            category: partyCategories[0],
            companions: { type: 'none', selectedIds: [], selectedNames: [] }
        };
    };

    const initialData = initializeFromDraft();
    const [date, setDate] = useState(initialData.date);
    const [drinks, setDrinks] = useState(initialData.drinks);
    const [stats, setStats] = useState(initialData.stats);
    const [location, setLocation] = useState(initialData.location);
    const [category, setCategory] = useState(initialData.category);
    const [companions, setCompanions] = useState(initialData.companions);
    const [lastPartyData, setLastPartyData] = useState(null);
    const [lastPartyId, setLastPartyId] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    
    // États pour la gestion des amis et groupes
    const [friendsList, setFriendsList] = useState([]);
    const [groupsList, setGroupsList] = useState([]);
    const [loadingCompanions, setLoadingCompanions] = useState(false);

    // Charger les amis et groupes au montage du composant
    useEffect(() => {
        const loadCompanionsData = async () => {
            if (!user || !db || !userProfile) return;
            
            setLoadingCompanions(true);
            try {
                // Charger les amis
                if (userProfile.friends && userProfile.friends.length > 0) {
                    const friendsData = [];
                    for (const friendId of userProfile.friends) {
                        try {
                            const friendQuery = query(
                                collection(db, `artifacts/${appId}/public_user_stats`),
                                where('__name__', '==', friendId)
                            );
                            const friendSnapshot = await getDocs(friendQuery);
                            if (!friendSnapshot.empty) {
                                const friendData = friendSnapshot.docs[0].data();
                                friendsData.push({
                                    id: friendId,
                                    username: friendData.username || 'Ami',
                                    displayName: friendData.displayName || friendData.username || 'Ami'
                                });
                            }
                        } catch (error) {
                            console.error('Erreur chargement ami:', error);
                        }
                    }
                    setFriendsList(friendsData);
                }

                // Charger les groupes (structure simplifiée)
                try {
                    const groupsQuery = query(
                        collection(db, `artifacts/${appId}/groups`),
                        where('members', 'array-contains', user.uid)
                    );
                    const groupsSnapshot = await getDocs(groupsQuery);
                    const groupsData = groupsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name || 'Groupe',
                        ...doc.data()
                    }));
                    setGroupsList(groupsData);
                } catch (error) {
                    console.error('Erreur chargement groupes:', error);
                }
            } catch (error) {
                console.error('Erreur chargement compagnons:', error);
            } finally {
                setLoadingCompanions(false);
            }
        };

        loadCompanionsData();
    }, [user, db, userProfile, appId]);

    // Fonction pour gérer le changement de type de compagnon
    const handleCompanionTypeChange = (type) => {
        setCompanions({ type, selectedIds: [], selectedNames: [] });
    };

    // Fonction pour gérer la sélection/désélection d'amis
    const handleFriendToggle = (friendId, friendName) => {
        setCompanions(prev => {
            const isSelected = prev.selectedIds.includes(friendId);
            if (isSelected) {
                return {
                    ...prev,
                    selectedIds: prev.selectedIds.filter(id => id !== friendId),
                    selectedNames: prev.selectedNames.filter(name => name !== friendName)
                };
            } else {
                return {
                    ...prev,
                    selectedIds: [...prev.selectedIds, friendId],
                    selectedNames: [...prev.selectedNames, friendName]
                };
            }
        });
    };

    // Fonction pour gérer la sélection de groupe
    const handleGroupSelect = (groupId, groupName) => {
        setCompanions({
            type: 'group',
            selectedIds: [groupId],
            selectedNames: [groupName]
        });
    };

    // Fonction pour gérer la fin du quiz et afficher le récapitulatif
    const handleQuizComplete = (resultTitle) => {
        console.log("✅ Quiz terminé, notification parent");
        setShowQuiz(false);
        
        // Fermer le modal et notifier le parent
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

        const partyData = { 
            date, 
            drinks, 
            ...stats, 
            location, 
            category, 
            companions,
            timestamp: Timestamp.now(), 
            userId: user.uid, 
            username: userProfile?.username || "Anonyme" 
        };
        console.log("📋 Données de soirée:", partyData);
        
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), partyData);
            console.log("✅ Soirée sauvegardée avec ID:", docRef.id);
            
            // upload photo if selected
            if (photoFile) {
                try {
                    const storageRefPhoto = ref(storage, `artifacts/${appId}/users/${user.uid}/parties/${docRef.id}/photo.jpg`);
                    await uploadBytes(storageRefPhoto, photoFile);
                    const photoURL = await getDownloadURL(storageRefPhoto);
                                                        const partyRefWithPhoto = doc(db, `artifacts/${appId}/users/${user.uid}/parties`, docRef.id);
                                    await updateDoc(partyRefWithPhoto, { photoURL });
                    await updateDoc(partyRefWithPhoto, { photoURL });
                } catch (photoError) {
                    console.error("❌ Erreur upload photo, mais on continue ", photoError);
                }
            }
            
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

    // If quiz is activated, unmount form and display quiz modal
    if (showQuiz && lastPartyData && lastPartyId) {
        return (
            <QuizManagerSimple
                partyData={lastPartyData}
                partyId={lastPartyId}
                onQuizComplete={handleQuizComplete}
            />
        );
    }

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
                        
                        {/* Compagnons */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '12px'
                            }}>
                                Avec qui étiez-vous ?
                            </label>
                            
                            {/* Sélecteur de type */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => handleCompanionTypeChange('none')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        backgroundColor: companions.type === 'none' ? '#8b45ff' : '#2d3748',
                                        border: '1px solid ' + (companions.type === 'none' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Seul(e)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCompanionTypeChange('friends')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        backgroundColor: companions.type === 'friends' ? '#8b45ff' : '#2d3748',
                                        border: '1px solid ' + (companions.type === 'friends' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <User size={16} />
                                    Amis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCompanionTypeChange('group')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        backgroundColor: companions.type === 'group' ? '#8b45ff' : '#2d3748',
                                        border: '1px solid ' + (companions.type === 'group' ? '#8b45ff' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Users size={16} />
                                    Groupe
                                </button>
                            </div>

                            {/* Liste des amis (si amis sélectionné) */}
                            {companions.type === 'friends' && (
                                <div style={{
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {loadingCompanions ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Chargement des amis...
                                        </div>
                                    ) : friendsList.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Aucun ami trouvé
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {friendsList.map(friend => (
                                                <label
                                                    key={friend.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: companions.selectedIds.includes(friend.id) ? 'rgba(139, 69, 255, 0.2)' : 'transparent',
                                                        border: companions.selectedIds.includes(friend.id) ? '1px solid #8b45ff' : '1px solid transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={companions.selectedIds.includes(friend.id)}
                                                        onChange={() => handleFriendToggle(friend.id, friend.username)}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            accentColor: '#8b45ff'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: companions.selectedIds.includes(friend.id) ? '600' : '400'
                                                    }}>
                                                        {friend.username}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Liste des groupes (si groupe sélectionné) */}
                            {companions.type === 'group' && (
                                <div style={{
                                    backgroundColor: '#2d3748',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {loadingCompanions ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Chargement des groupes...
                                        </div>
                                    ) : groupsList.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                            Aucun groupe trouvé
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {groupsList.map(group => (
                                                <label
                                                    key={group.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: companions.selectedIds.includes(group.id) ? 'rgba(139, 69, 255, 0.2)' : 'transparent',
                                                        border: companions.selectedIds.includes(group.id) ? '1px solid #8b45ff' : '1px solid transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="selectedGroup"
                                                        checked={companions.selectedIds.includes(group.id)}
                                                        onChange={() => handleGroupSelect(group.id, group.name)}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            accentColor: '#8b45ff'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        fontWeight: companions.selectedIds.includes(group.id) ? '600' : '400'
                                                    }}>
                                                        {group.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Affichage des compagnons sélectionnés */}
                            {companions.selectedNames.length > 0 && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(139, 69, 255, 0.1)',
                                    border: '1px solid #8b45ff',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        color: '#c084fc',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        marginBottom: '4px'
                                    }}>
                                        {companions.type === 'friends' ? 'Amis sélectionnés :' : 'Groupe sélectionné :'}
                                    </div>
                                    <div style={{
                                        color: 'white',
                                        fontSize: '14px'
                                    }}>
                                        {companions.selectedNames.join(', ')}
                                    </div>
                                </div>
                            )}
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
                        {/* Photo de la soirée */}
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#9ca3af',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Photo de la soirée:
                            </label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => setPhotoFile(e.target.files[0])}
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
                            />
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
        </div>
    );
};

export default AddPartyModal;
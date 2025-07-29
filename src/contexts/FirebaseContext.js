// src/contexts/FirebaseContext.js
import { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [partyMode, setPartyMode] = useState(false);
    const [activeDraft, setActiveDraft] = useState(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            
            // Charger le draft actif si l'utilisateur est connecté
            if (user) {
                loadActiveDraft(user.uid);
            } else {
                setPartyMode(false);
                setActiveDraft(null);
            }
        });

        return () => unsubscribe();
    }, []);

    // Auto-save du draft toutes les 10 secondes
    useEffect(() => {
        if (partyMode && activeDraft && user) {
            const interval = setInterval(() => {
                saveDraftToFirebase();
            }, 10000); // 10 secondes

            return () => clearInterval(interval);
        }
    }, [partyMode, activeDraft, user]);

    const loadActiveDraft = async (userId) => {
        try {
            const draftRef = doc(db, 'partyDrafts', userId);
            const draftSnap = await getDoc(draftRef);
            
            if (draftSnap.exists()) {
                const draft = draftSnap.data();
                setActiveDraft(draft);
                setPartyMode(true);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du draft:', error);
        }
    };

    const startPartyMode = async () => {
        if (!user) return;

        const newDraft = {
            userId: user.uid,
            startTime: new Date(),
            drinks: [],
            events: {
                vomi: 0,
                fights: 0,
                girlsTalkedTo: 0
            },
            location: '',
            category: 'Soirée',
            notes: '',
            status: 'draft',
            lastSaved: new Date()
        };

        try {
            await setDoc(doc(db, 'partyDrafts', user.uid), newDraft);
            setActiveDraft(newDraft);
            setPartyMode(true);
        } catch (error) {
            console.error('Erreur lors du démarrage du mode soirée:', error);
        }
    };

    const endPartyMode = async () => {
        if (!user || !activeDraft) return;

        try {
            // Supprimer le draft de Firebase
            await deleteDoc(doc(db, 'partyDrafts', user.uid));
            
            setPartyMode(false);
            setActiveDraft(null);
        } catch (error) {
            console.error('Erreur lors de l\'arrêt du mode soirée:', error);
        }
    };

    const saveDraftToFirebase = async () => {
        if (!user || !activeDraft) return;

        setIsAutoSaving(true);
        try {
            const updatedDraft = {
                ...activeDraft,
                lastSaved: new Date()
            };
            
            await updateDoc(doc(db, 'partyDrafts', user.uid), updatedDraft);
            setActiveDraft(updatedDraft);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        } finally {
            setIsAutoSaving(false);
        }
    };

    const addDrinkToDraft = (drinkType, quantity = 1) => {
        if (!activeDraft) return;

        const updatedDraft = { ...activeDraft };
        const existingDrink = updatedDraft.drinks.find(d => d.type === drinkType);

        if (existingDrink) {
            existingDrink.quantity += quantity;
        } else {
            updatedDraft.drinks.push({ 
                type: drinkType, 
                quantity: quantity,
                addedAt: new Date()
            });
        }

        setActiveDraft(updatedDraft);
        saveDraftToFirebase();
    };

    const removeDrinkFromDraft = (drinkType, quantity = 1) => {
        if (!activeDraft) return;

        const updatedDraft = { ...activeDraft };
        const drinkIndex = updatedDraft.drinks.findIndex(d => d.type === drinkType);

        if (drinkIndex !== -1) {
            updatedDraft.drinks[drinkIndex].quantity -= quantity;
            if (updatedDraft.drinks[drinkIndex].quantity <= 0) {
                updatedDraft.drinks.splice(drinkIndex, 1);
            }
        }

        setActiveDraft(updatedDraft);
        saveDraftToFirebase();
    };

    const addEventToDraft = (eventType) => {
        if (!activeDraft) return;

        const updatedDraft = { ...activeDraft };
        updatedDraft.events[eventType] = (updatedDraft.events[eventType] || 0) + 1;

        setActiveDraft(updatedDraft);
        saveDraftToFirebase();
    };

    const completeParty = async (completedPartyData) => {
        if (!user || !activeDraft) return;

        try {
            // Ajouter la soirée terminée à la collection parties
            await addDoc(collection(db, 'parties'), {
                ...completedPartyData,
                userId: user.uid,
                endTime: new Date()
            });

            // Supprimer le draft
            await deleteDoc(doc(db, 'partyDrafts', user.uid));

            setPartyMode(false);
            setActiveDraft(null);
        } catch (error) {
            console.error('Erreur lors de la finalisation de la soirée:', error);
        }
    };

    const contextValue = {
        user,
        loading,
        partyMode,
        activeDraft,
        isAutoSaving,
        startPartyMode,
        endPartyMode,
        addDrinkToDraft,
        removeDrinkFromDraft,
        addEventToDraft,
        completeParty,
        saveDraftToFirebase
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
};
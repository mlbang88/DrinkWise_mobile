// src/services/battleRoyaleService.js
import { doc, updateDoc, getDoc, increment, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export class BattleRoyaleService {
    constructor(db, appId) {
        this.db = db;
        this.appId = appId;
    }

    // Calculer les points selon le mode choisi
    async calculateModePoints(userId, mode, partyData, additionalData = {}) {
        const points = { total: 0, breakdown: {} };
        
        switch (mode) {
            case 'moderation':
                points.breakdown = this.calculateModerationPoints(partyData, additionalData);
                break;
            case 'explorer':
                points.breakdown = this.calculateExplorerPoints(partyData, additionalData);
                break;
            case 'social':
                points.breakdown = this.calculateSocialPoints(partyData, additionalData);
                break;
            case 'balanced':
                points.breakdown = this.calculateBalancedPoints(partyData, additionalData);
                break;
            case 'party':
                points.breakdown = this.calculatePartyBeastPoints(partyData, additionalData);
                break;
        }

        points.total = Object.values(points.breakdown).reduce((sum, val) => sum + val, 0);
        return points;
    }

    // Points pour Modération Master
    calculateModerationPoints(party, additional) {
        const points = {};
        
        // Temps entre les boissons (si plus de 30min entre chaque)
        if (party.drinks && party.drinks.length > 1) {
            const timeBetweenDrinks = this.calculateTimeBetweenDrinks(party.drinks);
            if (timeBetweenDrinks >= 30) {
                points.timeBetweenDrinks = 10 * (party.drinks.length - 1);
            }
        }
        
        // Boissons sans alcool consommées
        const nonAlcoholicDrinks = party.drinks?.filter(drink => 
            drink.type?.toLowerCase().includes('eau') || 
            drink.type?.toLowerCase().includes('soda') ||
            drink.type?.toLowerCase().includes('jus') ||
            drink.alcoholContent === 0
        ) || [];
        points.waterIntake = nonAlcoholicDrinks.length * 5;
        
        // Plan de retour responsable
        if (party.transportMode && ['uber', 'taxi', 'friend', 'metro'].includes(party.transportMode)) {
            points.responsiblePlanning = 20;
        }
        
        // Aide aux amis (données additionnelles)
        if (additional.helpedFriends) {
            points.helpingFriends = additional.helpedFriends * 15;
        }
        
        // Bonus modération générale
        const totalDrinks = party.drinks?.length || 0;
        const hours = this.calculatePartyDurationHours(party);
        if (hours > 0 && totalDrinks / hours <= 1) { // Max 1 boisson/heure
            points.moderationBonus = 25;
        }

        return points;
    }

    // Points pour Explorer Pro  
    calculateExplorerPoints(party, additional) {
        const points = {};
        
        // Nouvelles boissons découvertes
        const uniqueDrinks = new Set(party.drinks?.map(d => d.name?.toLowerCase()) || []);
        points.newDrinks = uniqueDrinks.size * 25;
        
        // Nouveau lieu visité
        if (additional.isNewVenue) {
            points.newVenues = 20;
        }
        
        // Photos créatives partagées
        if (party.photos && party.photos.length > 0) {
            points.creativePhotos = Math.min(party.photos.length * 15, 60); // Max 60 pts
        }
        
        // Review détaillée
        if (party.description && party.description.length > 50) {
            points.detailedReviews = 10;
        }
        
        // Bonus diversité
        const drinkTypes = new Set(party.drinks?.map(d => d.type) || []);
        if (drinkTypes.size >= 3) {
            points.diversityBonus = 30;
        }
        
        // Découverte culturelle
        if (additional.culturalExperience) {
            points.culturalDiscovery = 20;
        }

        return points;
    }

    // Points pour Social Host
    calculateSocialPoints(party, additional) {
        const points = {};
        
        // Événement organisé
        if (additional.isOrganizer) {
            points.eventsOrganized = 50;
        }
        
        // Amis rassemblés
        const friendsCount = party.companions?.length || 0;
        points.friendsGathered = friendsCount * 5;
        
        // Ambiance positive créée
        if (party.mood && ['excellent', 'great', 'good'].includes(party.mood)) {
            points.moodBoost = 10;
        }
        
        // Souvenirs partagés
        if (party.photos || party.description) {
            points.memoriesShared = 15;
        }
        
        // Inclusion sociale
        if (additional.includedNewPeople) {
            points.socialInclusion = 25;
        }
        
        // Animation du groupe
        if (additional.groupActivities && additional.groupActivities.length > 0) {
            points.groupAnimation = additional.groupActivities.length * 10;
        }

        return points;
    }

    // Points pour Balanced Player
    calculateBalancedPoints(party, additional) {
        const points = {};
        
        // Équilibre consommation/pauses
        const hours = this.calculatePartyDurationHours(party);
        const drinks = party.drinks?.length || 0;
        if (hours > 0) {
            const ratio = drinks / hours;
            if (ratio >= 0.5 && ratio <= 1.5) { // Équilibre optimal
                points.balanceRatio = 15;
            }
        }
        
        // Variété des expériences
        let varietyScore = 0;
        if (party.drinks?.length > 0) varietyScore += 3;
        if (party.photos?.length > 0) varietyScore += 3;
        if (party.companions?.length > 0) varietyScore += 3;
        if (party.location) varietyScore += 3;
        points.varietyScore = varietyScore;
        
        // Consistance (basée sur historique - données additionnelles)
        if (additional.consistencyScore >= 80) {
            points.consistency = 18;
        }
        
        // Adaptabilité sociale
        if (additional.adaptedToContext) {
            points.socialAdaptability = 10;
        }
        
        // Bonus équilibre parfait
        const hasModeration = drinks <= hours;
        const hasExploration = new Set(party.drinks?.map(d => d.type) || []).size >= 2;
        const hasSocial = (party.companions?.length || 0) >= 1;
        
        if (hasModeration && hasExploration && hasSocial) {
            points.perfectBalanceBonus = 25;
        }

        return points;
    }

    // Points pour Party Beast
    calculatePartyBeastPoints(party, additional) {
        const points = {};
        
        // Volume de consommation (plus = mieux)
        const totalDrinks = party.drinks?.length || 0;
        points.volumePoints = totalDrinks * 8;
        
        // Bonus endurance (soirée longue)
        const hours = this.calculatePartyDurationHours(party);
        if (hours >= 4) {
            points.enduranceBonus = 25;
            // Bonus supplémentaire pour les marathoniens
            if (hours >= 8) {
                points.marathonBonus = 40;
            }
        }
        
        // Créativité des mélanges (cocktails, mélanges originaux)
        const creativeDrinks = party.drinks?.filter(drink => 
            drink.name?.toLowerCase().includes('mix') || 
            drink.name?.toLowerCase().includes('cocktail') ||
            drink.name?.toLowerCase().includes('shot') ||
            drink.type?.toLowerCase().includes('cocktail')
        ) || [];
        points.creativeMixes = creativeDrinks.length * 20;
        
        // Énergie de la soirée (mood excellent + photos)
        if (party.mood === 'excellent' && party.photos?.length > 0) {
            points.partyEnergy = 15;
        }
        
        // Record personnel (données additionnelles)
        if (additional.isPersonalRecord) {
            points.longestStreak = 30;
        }
        
        // Faire danser les autres (influence sociale positive)
        if (additional.madeOthersDance || party.companions?.length >= 3) {
            points.crowdPleaser = 12;
        }
        
        // Bonus diversité alcoolique 
        const alcoholTypes = new Set(
            party.drinks?.filter(d => d.alcoholContent > 0)
                         .map(d => d.type?.toLowerCase())
                         .filter(Boolean) || []
        );
        if (alcoholTypes.size >= 3) {
            points.varietyAlcoholBonus = 25;
        }
        
        // Bonus consommation continue (pas de grandes pauses)
        if (party.drinks?.length >= 5) {
            const avgTimeBetween = this.calculateTimeBetweenDrinks(party.drinks);
            if (avgTimeBetween <= 45) { // Moins de 45min entre boissons
                points.steadyPaceBonus = 20;
            }
        }
        
        // Bonus soirée épique (combinaison de facteurs)
        const isEpicNight = (
            totalDrinks >= 6 && 
            hours >= 5 && 
            party.companions?.length >= 2 && 
            party.photos?.length >= 2
        );
        if (isEpicNight) {
            points.epicNightBonus = 50;
        }

        return points;
    }

    // Utilitaires
    calculateTimeBetweenDrinks(drinks) {
        if (drinks.length < 2) return 0;
        
        // Filter drinks that have valid timestamps
        const drinksWithTime = drinks.filter(d => d.timestamp || d.time);
        if (drinksWithTime.length < 2) {
            // If no timestamps available, estimate based on total drinks and party duration
            // Return a conservative estimate (assuming drinks were spread evenly)
            return 45; // 45 minutes average as fallback
        }
        
        const times = drinksWithTime.map(d => new Date(d.timestamp || d.time));
        times.sort((a, b) => a - b);
        
        let totalGaps = 0;
        for (let i = 1; i < times.length; i++) {
            totalGaps += (times[i] - times[i-1]) / (1000 * 60); // En minutes
        }
        
        return totalGaps / (times.length - 1); // Moyenne
    }

    calculatePartyDurationHours(party) {
        // Use new duration field if available
        if (party.duration) return party.duration;
        
        // Use startTime/endTime if available
        if (party.startTime && party.endTime) {
            const start = new Date(party.startTime);
            const end = new Date(party.endTime);
            return (end - start) / (1000 * 60 * 60); // En heures
        }
        
        // Fallback: estimate based on number of drinks (conservative estimate)
        const drinkCount = party.drinks?.length || 0;
        if (drinkCount <= 2) return 2; // 2 hours for light evening
        if (drinkCount <= 4) return 3; // 3 hours for moderate evening
        return 4; // 4 hours for longer evening
    }

    // Mettre à jour les points du tournoi
    async updateTournamentScore(tournamentId, userId, modePoints, mode) {
        try {
            const tournamentRef = doc(this.db, `artifacts/${this.appId}/tournaments`, tournamentId);
            const tournamentDoc = await getDoc(tournamentRef);
            
            if (!tournamentDoc.exists()) return;
            
            const currentScores = tournamentDoc.data().scores || {};
            
            // Initialiser le score utilisateur s'il n'existe pas
            if (!currentScores[userId]) {
                currentScores[userId] = {
                    totalPoints: 0,
                    modePoints: {},
                    lastUpdate: new Date()
                };
            }
            
            // Ajouter les points du mode
            if (!currentScores[userId].modePoints[mode]) {
                currentScores[userId].modePoints[mode] = 0;
            }
            
            currentScores[userId].modePoints[mode] += modePoints.total;
            currentScores[userId].totalPoints += modePoints.total;
            currentScores[userId].lastUpdate = new Date();
            
            // Sauvegarder
            await updateDoc(tournamentRef, {
                scores: currentScores
            });
            
            return modePoints;
        } catch (error) {
            console.error('Erreur mise à jour score tournoi:', error?.message || String(error));
            throw error;
        }
    }

    // Rejoindre un tournoi
    async joinTournament(tournamentId, userId) {
        try {
            const tournamentRef = doc(this.db, `artifacts/${this.appId}/tournaments`, tournamentId);
            const tournamentDoc = await getDoc(tournamentRef);
            
            if (!tournamentDoc.exists()) {
                throw new Error('Tournoi introuvable');
            }
            
            const tournamentData = tournamentDoc.data();
            const currentParticipants = tournamentData.participants || [];
            
            // Vérifier si déjà inscrit
            if (currentParticipants.includes(userId)) {
                return { success: false, message: 'Déjà inscrit à ce tournoi' };
            }
            
            // Vérifier la limite de participants
            if (currentParticipants.length >= tournamentData.maxParticipants) {
                return { success: false, message: 'Tournoi complet' };
            }
            
            // Ajouter l'utilisateur
            await updateDoc(tournamentRef, {
                participants: [...currentParticipants, userId]
            });
            
            return { success: true, message: 'Inscrit avec succès' };
        } catch (error) {
            console.error('Erreur rejoindre tournoi:', error?.message || String(error));
            return { success: false, message: 'Erreur lors de l\'inscription' };
        }
    }

    // Obtenir le classement d'un tournoi
    async getTournamentLeaderboard(tournamentId) {
        try {
            const tournamentRef = doc(this.db, `artifacts/${this.appId}/tournaments`, tournamentId);
            const tournamentDoc = await getDoc(tournamentRef);
            
            if (!tournamentDoc.exists()) return [];
            
            const scores = tournamentDoc.data().scores || {};
            
            // Convertir en array et trier
            const leaderboard = Object.entries(scores)
                .map(([userId, data]) => ({
                    userId,
                    ...data
                }))
                .sort((a, b) => b.totalPoints - a.totalPoints);
            
            return leaderboard;
        } catch (error) {
            console.error('Erreur récupération classement:', error?.message || String(error));
            return [];
        }
    }

    // Créer des défis flash
    async createFlashChallenge(challengeData) {
        try {
            const challenge = {
                ...challengeData,
                type: 'flash',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                participants: [],
                status: 'active'
            };
            
            const docRef = await addDoc(collection(this.db, `artifacts/${this.appId}/flashChallenges`), challenge);
            return docRef.id;
        } catch (error) {
            console.error('Erreur création défi flash:', error?.message || String(error));
            throw error;
        }
    }
}

export default BattleRoyaleService;
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { badgeList } from '../utils/data';
import { appId } from '../firebase';

export const badgeService = {
    calculateGlobalStats: (parties) => {
        const stats = {
            totalDrinks: 0,
            totalVomi: 0,
            totalFights: 0,
            totalRecal: 0,
            totalGirlsTalkedTo: 0,
            totalElleVeutElleVeut: 0,
            totalParties: parties.length,
            uniqueLocations: new Set(),
            drinkTypes: {},
            partyTypes: {},
        };
        const drinkBrandCounts = {};

        parties.forEach(party => {
            party.drinks.forEach(drink => {
                stats.totalDrinks += drink.quantity;
                stats.drinkTypes[drink.type] = (stats.drinkTypes[drink.type] || 0) + drink.quantity;

                if (drink.brand) {
                    const brandKey = `${drink.type} - ${drink.brand}`;
                    drinkBrandCounts[brandKey] = (drinkBrandCounts[brandKey] || 0) + drink.quantity;
                }
            });
            stats.totalVomi += party.vomi || 0;
            stats.totalFights += party.fights || 0;
            stats.totalRecal += party.recal || 0;
            stats.totalGirlsTalkedTo += party.girlsTalkedTo || 0;
            stats.totalElleVeutElleVeut += party.elleVeutElleVeut || 0;
            if (party.location) stats.uniqueLocations.add(party.location.toLowerCase());
            if (party.category) stats.partyTypes[party.category] = (stats.partyTypes[party.category] || 0) + 1;
        });

        let mostConsumedDrink = { type: 'Aucune', quantity: 0, brand: '' };
        let maxQty = 0;
        for (const type in stats.drinkTypes) {
            if (stats.drinkTypes[type] > maxQty) {
                maxQty = stats.drinkTypes[type];
                mostConsumedDrink.type = type;
                mostConsumedDrink.quantity = maxQty;
            }
        }

        let mostConsumedBrand = '';
        let maxBrandQty = 0;
        for (const brandKey in drinkBrandCounts) {
            if (brandKey.startsWith(mostConsumedDrink.type)) {
                if (drinkBrandCounts[brandKey] > maxBrandQty) {
                    maxBrandQty = drinkBrandCounts[brandKey];
                    mostConsumedBrand = brandKey.split(' - ')[1];
                }
            }
        }
        mostConsumedDrink.brand = mostConsumedBrand;

        stats.uniqueLocations = stats.uniqueLocations.size;
        stats.mostConsumedDrink = mostConsumedDrink;
        return stats;
    },

    checkAndAwardBadges: async (db, user, userProfile, appId, newPartyData, setMessageBox) => {
        console.log("🎖️ Début checkAndAwardBadges", { user: !!user, userProfile: !!userProfile, appId, newPartyData });
        
        if (!user || !userProfile) {
            console.log("❌ Pas d'utilisateur ou de profil");
            return { newBadgesCount: 0 };
        }

        const userPartiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');

        try {
            const partiesSnapshot = await getDocs(userPartiesRef);
            const allParties = partiesSnapshot.docs.map(doc => doc.data());
            console.log("📊 Parties récupérées:", allParties.length);
            
            const cumulativeStats = badgeService.calculateGlobalStats(allParties);
            console.log("📈 Stats cumulatives:", cumulativeStats);

            let updatedBadges = [...(userProfile.unlockedBadges || [])];
            let newBadgesAwarded = [];
            console.log("🏅 Badges actuels:", updatedBadges);

            for (const badgeId in badgeList) {
                const badge = badgeList[badgeId];
                const isAlreadyUnlocked = updatedBadges.includes(badgeId);
                const meetsCriteria = badge.criteria(cumulativeStats, newPartyData);
                
                console.log(`🔍 Badge ${badgeId}: déjà débloqué=${isAlreadyUnlocked}, critères remplis=${meetsCriteria}`);
                
                if (!isAlreadyUnlocked && meetsCriteria) {
                    updatedBadges.push(badgeId);
                    newBadgesAwarded.push(badgeId); // Stocker l'ID au lieu du nom
                    console.log(`✅ Nouveau badge débloqué: ${badge.name}`);
                }
            }

            if (newBadgesAwarded.length > 0) {
                console.log("💾 Sauvegarde des nouveaux badges:", newBadgesAwarded);
                await updateDoc(userProfileRef, { unlockedBadges: updatedBadges });
                const badgeNames = newBadgesAwarded.map(id => badgeList[id]?.name).filter(Boolean);
                setMessageBox({ message: `Nouveaux badges débloqués : ${badgeNames.join(', ')}`, type: 'success' });
                return { newBadgesCount: newBadgesAwarded.length, newBadges: newBadgesAwarded };
            }
            console.log("📝 Aucun nouveau badge");
            return { newBadgesCount: 0, newBadges: [] };
        } catch (error) {
            console.error("❌ Erreur lors de la vérification des badges:", error);
            setMessageBox({ message: "Erreur lors de la mise à jour des badges.", type: "error" });
            return { newBadgesCount: 0, newBadges: [] };
        }
    }
};
// src/utils/data.jsx

import React from 'react';
import { Award, Beer, GlassWater, Bomb, Shield, Heart, Sparkles, HelpCircle, Users, HeartOff, PartyPopper, Wine, MapPin, ShieldCheck, Trophy, Calendar, Star, Moon, Feather, Dumbbell, Music, Sun, Snowflake, Crown } from 'lucide-react';

export const localImageData = {
    soiree: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2069&auto=format&fit=crop',
    amis: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1932&auto=format&fit=crop',
    graphique: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    profil: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
    defis: 'https://images.unsplash.com/photo-1561041695-d2fadf9f328c?q=80&w=1974&auto=format&fit=crop',
    souvenirs: 'https://images.unsplash.com/photo-1511992243105-2992b3246146?q=80&w=1974&auto=format&fit=crop',
    anniversaire: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop',
    soireeentreamis: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2070&auto=format&fit=crop',
    concert: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop',
    clubbing: 'https://images.unsplash.com/photo-1563212139-685822305331?q=80&w=1974&auto=format&fit=crop',
    bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop',
    maison: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop',
    festival: 'https://images.unsplash.com/photo-1519750013443-4b48b53261e4?q=80&w=1974&auto=format&fit=crop',
    mariage: 'https://images.unsplash.com/photo-1485965215714-28b15a15cb32?q=80&w=2070&auto=format&fit=crop',
    evenementsportif: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1974&auto=format&fit=crop',
    nouvelan: 'https://images.unsplash.com/photo-1515224526905-56c835567718?q=80&w=1974&auto=format&fit=crop',
    autre: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop'
};

export const drinkImageLibrary = {
    'budweiser': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=1974&auto=format&fit=crop',
    'heineken': 'https://images.unsplash.com/photo-1611053748293-8a03c538a7c6?q=80&w=1974&auto=format&fit=crop',
    'corona': 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?q=80&w=1974&auto=format&fit=crop',
    'leffe': 'https://images.unsplash.com/photo-1621872658433-2374a5431365?q=80&w=1966&auto=format&fit=crop',
    'desperados': 'https://images.unsplash.com/photo-1603306093928-998036577874?q=80&w=2080&auto=format&fit=crop',
    'stellaartois': 'https://images.unsplash.com/photo-1623932982186-85c49a99a893?q=80&w=1974&auto=format&fit=crop',
    'guinness': 'https://images.unsplash.com/photo-1568644403353-0b7b41b83c38?q=80&w=1974&auto=format&fit=crop',
    'bière': 'https://images.unsplash.com/photo-1586993451228-098b8f221cde?q=80&w=1974&auto=format&fit=crop',
    'bordeaux': 'https://images.unsplash.com/photo-1598112389233-a25943fb1b83?q=80&w=1974&auto=format&fit=crop',
    'bourgogne': 'https://images.unsplash.com/photo-1568213813339-3252a14e353b?q=80&w=1974&auto=format&fit=crop',
    'champagne': 'https://images.unsplash.com/photo-1551024709-8f2378a01240?q=80&w=2070&auto=format&fit=crop',
    'prosecco': 'https://images.unsplash.com/photo-1611577484435-783c9a59325a?q=80&w=1974&auto=format&fit=crop',
    'vin': 'https://images.unsplash.com/photo-1553763768-d8a41c3885de?q=80&w=1974&auto=format&fit=crop',
    'mojito': 'https://images.unsplash.com/photo-1551538850-094e49340b8a?q=80&w=1974&auto=format&fit=crop',
    'margarita': 'https://images.unsplash.com/photo-1548883354-94bcfe321c2d?q=80&w=1974&auto=format&fit=crop',
    'gintonic': 'https://images.unsplash.com/photo-1608663719019-49e0a81182a1?q=80&w=1974&auto=format&fit=crop',
    'cosmopolitan': 'https://images.unsplash.com/photo-1572492376422-445b2f83a54a?q=80&w=1974&auto=format&fit=crop',
    'bloodymary': 'https://images.unsplash.com/photo-1541546369136-8969aa333a59?q=80&w=1974&auto=format&fit=crop',
    'cocktail': 'https://images.unsplash.com/photo-1551024709-8f2378a01240?q=80&w=2070&auto=format&fit=crop',
    'vodka': 'https://images.unsplash.com/photo-1550985223-e0b92a1b9018?q=80&w=1974&auto=format&fit=crop',
    'rhum': 'https://images.unsplash.com/photo-1619451426434-3f823e5746c9?q=80&w=1974&auto=format&fit=crop',
    'whisky': 'https://images.unsplash.com/photo-1527281400683-1a02762169ea?q=80&w=1974&auto=format&fit=crop',
    'gin': 'https://images.unsplash.com/photo-1626897505354-60c8b13c3437?q=80&w=1974&auto=format&fit=crop',
    'tequila': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?q=80&w=1974&auto=format&fit=crop',
    'spiritueux': 'https://images.unsplash.com/photo-1569502154382-c0e4b52c56a2?q=80&w=1974&auto=format&fit=crop',
    'shot': 'https://images.unsplash.com/photo-1587880193132-829420935395?q=80&w=1974&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1514362545857-3bc7d00a937b?q=80&w=2070&auto=format&fit=crop',
};

export const drinkOptions = [
    { type: 'Bière', brands: ['Heineken', 'Corona', 'Leffe', 'Grimbergen', 'Desperados', '1664', 'Stella Artois', 'Budweiser', 'Guinness', 'Autre bière'] },
    { type: 'Vin', brands: ['Bordeaux', 'Bourgogne', 'Côtes du Rhône', 'Loire', 'Alsace', 'Champagne', 'Prosecco', 'Chianti', 'Malbec', 'Autre vin'] },
    { type: 'Cocktail', brands: ['Mojito', 'Margarita', 'Gin Tonic', 'Cosmopolitan', 'Bloody Mary', 'Cuba Libre', 'Pina Colada', 'Daiquiri', 'Old Fashioned', 'Autre cocktail'] },
    { type: 'Spiritueux', brands: ['Vodka', 'Rhum', 'Whisky', 'Gin', 'Tequila', 'Cognac', 'Pastis', 'Jägermeister', 'Autre spiritueux'] },
    { type: 'Shot', brands: ['Tequila Shot', 'Jägerbomb', 'Vodka Shot', 'Fireball', 'Kamikaze', 'Autre shot'] },
    { type: 'Champagne', brands: ['Moët & Chandon', 'Veuve Clicquot', 'Dom Pérignon', 'Ruinart', 'Laurent-Perrier', 'Autre champagne'] },
    { type: 'Autre', brands: [] },
];

export const partyCategories = [
    'Anniversaire', 'Soirée entre amis', 'Concert', 'Clubbing', 'Bar', 'Maison', 'Festival', 'Mariage', 'Événement sportif', 'Nouvel An', 'Autre',
];

export const badgeList = {
    // === BADGES COMMUNS (Common) - Premiers pas ===
    'first_party': { name: "Le Baptême du Feu", description: "Enregistrer sa toute première soirée.", icon: <Award size={24} />, tier: 'common', xpBonus: 50, criteria: (stats) => stats.totalParties >= 1 },
    'drinks_1': { name: "Buveur Novice", description: "Boire 50 verres au total.", icon: <Beer size={24} />, tier: 'common', xpBonus: 50, criteria: (stats) => stats.totalDrinks >= 50 },
    'vomi_1': { name: "Premier Regret", description: "Vomir pour la première fois.", icon: <GlassWater size={24} />, tier: 'common', xpBonus: 30, criteria: (stats) => stats.totalVomi >= 1 },
    'social_starter': { name: "Premier Contact", description: "Parler à 10 personnes au total.", icon: <Users size={24} />, tier: 'common', xpBonus: 50, criteria: (stats) => stats.totalGirlsTalkedTo >= 10 },
    
    // === BADGES RARES (Rare) - Progression significative ===
    'drinks_2': { name: "Pilier de Bar", description: "Boire 250 verres au total.", icon: <Beer size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats) => stats.totalDrinks >= 250 },
    'iron_stomach': { name: "Estomac d'Acier", description: "Boire >10 verres en une soirée sans vomir.", icon: <Shield size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats, party) => party.drinks.reduce((sum, d) => sum + d.quantity, 0) >= 10 && party.vomi === 0 },
    'pacifist': { name: "Le Pacifiste", description: "Participer à 20 soirées sans aucune bagarre.", icon: <Heart size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.totalParties >= 20 && stats.totalFights === 0 },
    'social_butterfly': { name: "Papillon Social", description: "Parler à 50 personnes au total.", icon: <Users size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats) => stats.totalGirlsTalkedTo >= 50 },
    'explorer': { name: "L'Explorateur", description: "Enregistrer des soirées dans 5 lieux différents.", icon: <MapPin size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats) => stats.uniqueLocations >= 5 },
    'festival_goer': { name: "Festivalier", description: "Participer à 5 festivals.", icon: <PartyPopper size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats) => stats.partyTypes['Festival'] >= 5 },
    'vomi_2': { name: "Habitué des Toilettes", description: "Vomir 10 fois au total.", icon: <GlassWater size={24} />, tier: 'rare', xpBonus: 75, criteria: (stats) => stats.totalVomi >= 10 },
    'responsible_drinker': { name: "Le Responsable", description: "10 soirées consécutives sans vomir ni bagarre.", icon: <ShieldCheck size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.consecutiveCleanParties >= 10 },
    
    // === BADGES ÉPIQUES (Epic) - Accomplissements majeurs ===
    'drinks_3': { name: "Légende de la Soif", description: "Boire 1000 verres au total.", icon: <Beer size={24} />, tier: 'epic', xpBonus: 250, criteria: (stats) => stats.totalDrinks >= 1000 },
    'legendary_night': { name: "Nuit Légendaire", description: "Boire >15 verres en une seule soirée.", icon: <Sparkles size={24} />, tier: 'epic', xpBonus: 200, criteria: (stats, party) => party.drinks.reduce((sum, d) => sum + d.quantity, 0) >= 15 },
    'clubber': { name: "Clubber Invétéré", description: "Participer à 10 soirées en club.", icon: <Wine size={24} />, tier: 'epic', xpBonus: 200, criteria: (stats) => stats.partyTypes['Clubbing'] >= 10 },
    'sommelier': { name: "Sommelier en Herbe", description: "Boire 50 verres de vin.", icon: <Wine size={24} />, tier: 'epic', xpBonus: 200, criteria: (stats) => stats.drinkTypes['Vin'] >= 50 },
    'social_master': { name: "Maître Social", description: "Parler à 100 personnes au total.", icon: <Users size={24} />, tier: 'epic', xpBonus: 250, criteria: (stats) => stats.totalGirlsTalkedTo >= 100 },
    'fights_1': { name: "Le Bagarreur", description: "Participer à 5 bagarres.", icon: <Bomb size={24} />, tier: 'epic', xpBonus: 150, criteria: (stats) => stats.totalFights >= 5 },
    'world_traveler': { name: "Globe-Trotter", description: "Enregistrer des soirées dans 15 lieux différents.", icon: <MapPin size={24} />, tier: 'epic', xpBonus: 250, criteria: (stats) => stats.uniqueLocations >= 15 },
    
    // === NOUVEAUX BADGES CRÉATIFS ===
    
    // Badges Humoristiques
    'party_animal': { name: "Animal de Fête", description: "Faire la fête 3 soirs d'affilée.", icon: <PartyPopper size={24} />, tier: 'rare', xpBonus: 120, criteria: (stats) => stats.consecutivePartiesWeekend >= 3 },
    'night_owl': { name: "Oiseau de Nuit", description: "Rester en soirée jusqu'à 6h du matin.", icon: <Moon size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats, party) => party.endTime && new Date(party.endTime).getHours() >= 6 },
    'lightweight': { name: "Poids Plume", description: "Vomir après moins de 5 verres.", icon: <Feather size={24} />, tier: 'common', xpBonus: 30, criteria: (stats, party) => party.vomi > 0 && party.drinks.reduce((sum, d) => sum + d.quantity, 0) < 5 },
    'heavyweight': { name: "Poids Lourd", description: "Boire plus de 20 verres sans vomir.", icon: <Dumbbell size={24} />, tier: 'epic', xpBonus: 300, criteria: (stats, party) => party.drinks.reduce((sum, d) => sum + d.quantity, 0) > 20 && party.vomi === 0 },
    'dancing_queen': { name: "Reine de la Piste", description: "Danser lors de 10 soirées.", icon: <Music size={24} />, tier: 'rare', xpBonus: 100, criteria: (stats) => stats.partiesWithDancing >= 10 },
    
    // Badges Sociaux
    'wingman': { name: "L'Ailier Parfait", description: "Aider 5 amis à trouver quelqu'un.", icon: <Users size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.successfulWingman >= 5 },
    'influencer': { name: "L'Influenceur", description: "Avoir 50 amis sur l'app.", icon: <Sparkles size={24} />, tier: 'epic', xpBonus: 250, criteria: (stats) => stats.totalFriends >= 50 },
    'party_starter': { name: "Le Lanceur", description: "Organiser 10 soirées de groupe.", icon: <Users size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.organizedParties >= 10 },
    'loyal_friend': { name: "Ami Fidèle", description: "Sortir avec le même groupe 15 fois.", icon: <Heart size={24} />, tier: 'rare', xpBonus: 120, criteria: (stats) => stats.sameGroupParties >= 15 },
    
    // Badges Saisonniers
    'summer_vibes': { name: "Ambiance d'Été", description: "Participer à 10 festivals d'été.", icon: <Sun size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.summerFestivals >= 10 },
    'winter_warrior': { name: "Guerrier d'Hiver", description: "Sortir 5 fois par temps de neige.", icon: <Snowflake size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.winterParties >= 5 },
    'new_year_legend': { name: "Légende du Nouvel An", description: "Fêter 5 réveillons.", icon: <PartyPopper size={24} />, tier: 'epic', xpBonus: 200, criteria: (stats) => stats.newYearParties >= 5 },
    
    // Badges Spéciaux
    'time_traveler': { name: "Voyageur Temporel", description: "Sortir dans 10 villes différentes.", icon: <MapPin size={24} />, tier: 'epic', xpBonus: 300, criteria: (stats) => stats.uniqueCities >= 10 },
    'cocktail_master': { name: "Maître Cocktailleur", description: "Boire 50 cocktails différents.", icon: <Wine size={24} />, tier: 'epic', xpBonus: 250, criteria: (stats) => stats.uniqueCocktails >= 50 },
    'beer_connoisseur': { name: "Connaisseur de Bière", description: "Goûter 30 marques de bières.", icon: <Beer size={24} />, tier: 'rare', xpBonus: 150, criteria: (stats) => stats.uniqueBeers >= 30 },
    
    // === BADGES LÉGENDAIRES (Legendary) - Exploits rarissimes ===
    'blackout_king': { name: "Roi du Blackout", description: "Obtenir 'Trou Noir Galactique' au quiz.", icon: <HelpCircle size={24} />, tier: 'legendary', xpBonus: 500, criteria: (stats, party) => party.partyTitle === "Trou Noir Galactique" },
    'heartbreaker': { name: "Le Brise-cœur", description: "Prendre 20 recals au total.", icon: <HeartOff size={24} />, tier: 'legendary', xpBonus: 500, criteria: (stats) => stats.totalRecal >= 20 },
    'party_god': { name: "Dieu de la Fête", description: "Participer à 100 soirées au total.", icon: <Trophy size={24} />, tier: 'legendary', xpBonus: 1000, criteria: (stats) => stats.totalParties >= 100 },
    'drink_master': { name: "Maître des Boissons", description: "Boire 5000 verres au total.", icon: <Beer size={24} />, tier: 'legendary', xpBonus: 1000, criteria: (stats) => stats.totalDrinks >= 5000 },
    'perfect_balance': { name: "Équilibre Parfait", description: "50 soirées consécutives sans vomir ni bagarre.", icon: <ShieldCheck size={24} />, tier: 'legendary', xpBonus: 1000, criteria: (stats) => stats.consecutiveCleanParties >= 50 },
    'the_legend': { name: "La Légende Vivante", description: "Atteindre le niveau 100.", icon: <Crown size={24} />, tier: 'legendary', xpBonus: 5000, criteria: (stats) => stats.level >= 100 },
};

export const challengeList = {
    'weekly_drinks_10': { id: 'weekly_drinks_10', type: 'weekly', title: 'Tour de chauffe', description: 'Boire 10 verres cette semaine', xp: 50, icon: <Beer size={24} />, criteria: (stats) => stats.totalDrinks >= 10, target: 10, field: 'totalDrinks' },
    'weekly_party_2': { id: 'weekly_party_2', type: 'weekly', title: 'Le Social', description: 'Participer à 2 soirées cette semaine', xp: 75, icon: <Users size={24} />, criteria: (stats) => stats.totalParties >= 2, target: 2, field: 'totalParties' },
    'weekly_no_vomi': { id: 'weekly_no_vomi', type: 'weekly', title: 'Le Sage', description: 'Passer une semaine sans vomir', xp: 100, icon: <ShieldCheck size={24} />, criteria: (stats) => stats.totalVomi === 0, target: 0, field: 'totalVomi' },
    'monthly_drinks_50': { id: 'monthly_drinks_50', type: 'monthly', title: 'Marathonien du mois', description: 'Boire 50 verres ce mois-ci', xp: 150, icon: <Trophy size={24} />, criteria: (stats) => stats.totalDrinks >= 50, target: 50, field: 'totalDrinks' },
    'monthly_explorer': { id: 'monthly_explorer', type: 'monthly', title: 'Explorateur du mois', description: 'Visiter 3 lieux différents ce mois-ci', xp: 200, icon: <MapPin size={24} />, criteria: (stats) => stats.uniqueLocations >= 3, target: 3, field: 'uniqueLocations' },
    'monthly_pacifist': { id: 'monthly_pacifist', type: 'monthly', title: 'Pacifiste Absolu', description: 'Passer un mois sans bagarre', xp: 250, icon: <Heart size={24} />, criteria: (stats) => stats.totalFights === 0, target: 0, field: 'totalFights' },
};


export const gameplayConfig = {
    xpPerParty: 50,
    xpPerDrink: 5,
    xpPerBadge: 100,
    xpPerChallenge: 25,
    xpPerQuizQuestion: 10,
    
    // Multiplicateurs pour incitations
    battleRoyaleMultiplier: 1.5,
    groupActivityMultiplier: 1.2,
    weekendMultiplier: 1.1,
    
    // Formule simplifiée: niveau = floor(sqrt(xp / 50)) + 1
    // Niveau 1 = 0 XP
    // Niveau 2 = 50 XP
    // Niveau 3 = 200 XP (+150)
    // Niveau 4 = 450 XP (+250)
    // Niveau 5 = 800 XP (+350)
    // Progression naturelle et intuitive
    levelFormula: {
        type: 'polynomial',
        divisor: 50  // XP nécessaire pour passer du niveau 1 au niveau 2
    },
    
    // Noms de niveaux dynamiques
    levelNames: [
        "Novice", "Apprenti", "Habitué", "Connaisseur", "Expert",
        "Vétéran", "Maître", "Champion", "Légende", "Dieu de la Fête"
    ]
};

// Configuration des volumes par type de boisson et contexte
export const drinkVolumes = {
    // Contextes "publics" (bars, clubs, festivals, etc.)
    publicContexts: ['Bar', 'Clubbing', 'Concert', 'Festival', 'Événement sportif'],
    
    // Contextes "privés" (maison, entre amis, etc.)
    privateContexts: ['Maison', 'Anniversaire', 'Soirée entre amis', 'Mariage', 'Nouvel An', 'Autre'],
    
    volumes: {
        'Bière': {
            public: 50,    // 50cl dans les bars, clubs, etc.
            private: 33    // 33cl à la maison, entre amis
        },
        'Spiritueux': {
            public: 3,     // 3cl dans les bars, clubs
            private: 5     // 5cl à la maison, entre amis
        },
        'Vin': {
            public: 12,    // 12cl dans les bars, clubs
            private: 15    // 15cl à la maison, entre amis
        },
        'Champagne': {
            public: 10,    // 10cl dans les bars, clubs
            private: 12    // 12cl à la maison, entre amis
        },
        'Cocktail': {
            public: 15,    // 15cl dans les bars, clubs
            private: 20    // 20cl à la maison, entre amis
        },
        'Shot': {
            public: 4,     // 4cl partout
            private: 4
        },
        'Autre': {
            public: 25,    // Volume par défaut
            private: 25
        }
    }
};

// Fonction pour calculer le volume d'une boisson
export const calculateDrinkVolume = (drinkType, partyCategory, quantity = 1) => {
    const volumes = drinkVolumes.volumes[drinkType];
    if (!volumes) {
        // Type de boisson non reconnu, utiliser "Autre"
        return drinkVolumes.volumes['Autre'].public * quantity;
    }
    
    const isPrivateContext = drinkVolumes.privateContexts.includes(partyCategory);
    const volumePerDrink = isPrivateContext ? volumes.private : volumes.public;
    
    return volumePerDrink * quantity;
};
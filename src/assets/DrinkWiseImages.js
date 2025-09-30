// 🎨 Bibliothèque d'images SVG statiques pour DrinkWise
// Version optimisée pour un rendu immédiat et élégant

export const DrinkWiseImages = {
  // 🌟 Logos et identité
  logos: {
    // Logo principal DrinkWise avec verre et sourire
    main: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="50" fill="url(#logoGrad)" stroke="#ffffff" stroke-width="4" filter="url(#glow)"/>
        <path d="M35 50 Q60 30 85 50 Q60 70 35 50" fill="#ffffff"/>
        <circle cx="45" cy="45" r="3" fill="#f59e0b"/>
        <circle cx="75" cy="45" r="3" fill="#f59e0b"/>
        <path d="M50 65 Q60 75 70 65" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>
    `)}`,

    // Version texte avec baseline
    text: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80">
        <defs>
          <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="150" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="url(#textGrad)">DrinkWise</text>
        <text x="150" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#e5e7eb" opacity="0.9">🍻 Boire Responsable</text>
      </svg>
    `)}`,
  },

  // 🎭 Backgrounds modernes
  backgrounds: {
    // Background principal avec gradient et motifs
    auth: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <defs>
          <radialGradient id="authBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
            <stop offset="30%" style="stop-color:#7c3aed;stop-opacity:0.9" />
            <stop offset="70%" style="stop-color:#3730a3;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
          </radialGradient>
          <pattern id="authDots" patternUnits="userSpaceOnUse" width="60" height="60">
            <circle cx="30" cy="30" r="2" fill="rgba(255,255,255,0.1)"/>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#authBg)"/>
        <rect width="800" height="600" fill="url(#authDots)"/>
        <circle cx="150" cy="120" r="80" fill="rgba(255,255,255,0.05)"/>
        <circle cx="650" cy="450" r="120" fill="rgba(255,255,255,0.03)"/>
        <circle cx="720" cy="80" r="60" fill="rgba(255,255,255,0.07)"/>
      </svg>
    `)}`,

    // Background dashboard avec motifs géométriques
    dashboard: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="dashBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
          </linearGradient>
          <pattern id="hexPattern" patternUnits="userSpaceOnUse" width="50" height="43.3">
            <polygon points="25,2 45,14.5 45,29.5 25,42 5,29.5 5,14.5" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#dashBg)"/>
        <rect width="800" height="600" fill="url(#hexPattern)"/>
      </svg>
    `)}`,

    // Background général coloré
    general: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="genBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:0.8" />
            <stop offset="30%" style="stop-color:#f5576c;stop-opacity:0.7" />
            <stop offset="70%" style="stop-color:#4facfe;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:0.9" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#genBg)"/>
        <circle cx="100" cy="100" r="50" fill="rgba(255,255,255,0.1)"/>
        <circle cx="700" cy="200" r="70" fill="rgba(255,255,255,0.08)"/>
        <circle cx="400" cy="500" r="90" fill="rgba(255,255,255,0.06)"/>
      </svg>
    `)}`,
  },

  // 🎨 Illustrations expressives  
  illustrations: {
    // Bienvenue avec personnage festif
    welcome: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
        <defs>
          <linearGradient id="welcomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.2" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="75" r="65" fill="url(#welcomeGrad)"/>
        <!-- Verre de fête -->
        <path d="M70 60 Q100 40 130 60 Q100 80 70 60" fill="#f59e0b"/>
        <rect x="95" y="50" width="10" height="20" fill="#fbbf24"/>
        <!-- Yeux souriants -->
        <circle cx="85" cy="55" r="2" fill="#ffffff"/>
        <circle cx="115" cy="55" r="2" fill="#ffffff"/>
        <!-- Sourire -->
        <path d="M90 70 Q100 80 110 70" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Confettis -->
        <rect x="60" y="30" width="3" height="3" fill="#f59e0b" transform="rotate(45 60 30)"/>
        <rect x="140" y="35" width="3" height="3" fill="#ef4444" transform="rotate(45 140 35)"/>
        <rect x="50" y="90" width="3" height="3" fill="#10b981" transform="rotate(45 50 90)"/>
        <text x="100" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#4f46e5" font-weight="bold">Bienvenue ! 🎉</text>
      </svg>
    `)}`,

    // Fête responsable
    party: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
        <circle cx="100" cy="75" r="55" fill="#7c3aed" opacity="0.2"/>
        <!-- Verres responsables -->
        <rect x="80" y="50" width="12" height="35" fill="#f59e0b" rx="2"/>
        <rect x="108" y="45" width="12" height="40" fill="#ef4444" rx="2"/>
        <!-- Bulles festives -->
        <circle cx="70" cy="40" r="3" fill="#fbbf24" opacity="0.7"/>
        <circle cx="130" cy="35" r="4" fill="#10b981" opacity="0.6"/>
        <circle cx="60" cy="85" r="2" fill="#f59e0b" opacity="0.8"/>
        <!-- Ligne de fête -->
        <path d="M60 90 Q100 70 140 90" stroke="#4f46e5" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="100" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#7c3aed" font-weight="bold">Fête Responsable 🎊</text>
      </svg>
    `)}`,

    // État vide motivant
    emptyState: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
        <circle cx="100" cy="75" r="45" fill="#e5e7eb" opacity="0.3"/>
        <!-- Trophée en attente -->
        <path d="M85 55 L115 55 L110 75 L90 75 Z" fill="#d1d5db"/>
        <rect x="95" y="75" width="10" height="15" fill="#d1d5db"/>
        <rect x="90" y="90" width="20" height="5" fill="#d1d5db" rx="2"/>
        <!-- Points d'interrogation motivants -->
        <text x="70" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">?</text>
        <text x="130" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">?</text>
        <text x="100" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">Votre aventure commence ici !</text>
      </svg>
    `)}`,
  },

  // 🏆 Badges et achievements
  badges: {
    // Badge or premium
    gold: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
        <defs>
          <radialGradient id="goldGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#f59e0b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
          </radialGradient>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="30" cy="30" r="25" fill="url(#goldGrad)" stroke="#f59e0b" stroke-width="2" filter="url(#goldGlow)"/>
        <path d="M20 25 L25 35 L30 30 L35 35 L40 25 L30 20 Z" fill="#ffffff"/>
        <circle cx="30" cy="30" r="15" stroke="#f59e0b" stroke-width="1" fill="none" opacity="0.5"/>
        <circle cx="30" cy="30" r="3" fill="#ffffff"/>
      </svg>
    `)}`,

    // Badge argent élégant
    silver: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
        <defs>
          <radialGradient id="silverGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d1d5db;stop-opacity:1" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="25" fill="url(#silverGrad)" stroke="#d1d5db" stroke-width="2"/>
        <path d="M20 25 L25 35 L30 30 L35 35 L40 25 L30 20 Z" fill="#374151"/>
        <circle cx="30" cy="30" r="15" stroke="#9ca3af" stroke-width="1" fill="none" opacity="0.5"/>
        <circle cx="30" cy="30" r="3" fill="#374151"/>
      </svg>
    `)}`,

    // Badge bronze motivant
    bronze: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
        <defs>
          <radialGradient id="bronzeGrad" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:0.8" />
            <stop offset="70%" style="stop-color:#d97706;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#92400e;stop-opacity:1" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="25" fill="url(#bronzeGrad)" stroke="#92400e" stroke-width="2"/>
        <path d="M20 25 L25 35 L30 30 L35 35 L40 25 L30 20 Z" fill="#ffffff"/>
        <circle cx="30" cy="30" r="15" stroke="#92400e" stroke-width="1" fill="none" opacity="0.5"/>
        <circle cx="30" cy="30" r="3" fill="#ffffff"/>
      </svg>
    `)}`,
  },

  // 👤 Avatars personnalisés
  avatars: {
    // Avatar par défaut moderne
    default: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#avatarGrad)"/>
        <circle cx="50" cy="40" r="15" fill="#ffffff"/>
        <path d="M25 75 Q50 60 75 75 Q50 90 25 75" fill="#ffffff"/>
      </svg>
    `)}`,

    // Générateur d'avatar géométrique
    geometric: (seed = 0) => {
      const colors = [
        { primary: '#4f46e5', secondary: '#7c3aed' },
        { primary: '#f59e0b', secondary: '#d97706' },
        { primary: '#ef4444', secondary: '#dc2626' },
        { primary: '#10b981', secondary: '#059669' },
        { primary: '#8b5cf6', secondary: '#7c3aed' },
        { primary: '#06b6d4', secondary: '#0891b2' }
      ];
      const color = colors[seed % colors.length];
      
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="geoGrad${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${color.secondary};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#geoGrad${seed})" rx="50"/>
          <polygon points="30,35 70,35 50,65" fill="rgba(255,255,255,0.9)"/>
          <circle cx="50" cy="45" r="8" fill="rgba(255,255,255,0.7)"/>
        </svg>
      `)}`;
    }
  }
};

// 🛠️ Utilitaires pour récupérer les images
export const getImage = (category, type, seed = 0) => {
  try {
    if (category === 'avatars' && type === 'geometric') {
      return DrinkWiseImages.avatars.geometric(seed);
    }
    return DrinkWiseImages[category]?.[type] || DrinkWiseImages.illustrations.emptyState;
  } catch (error) {
    console.error('Erreur récupération image:', error);
    return DrinkWiseImages.illustrations.emptyState;
  }
};

// 🎨 Générateur d'avatar basé sur userId
export const generateUserAvatar = (userId) => {
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return getImage('avatars', 'geometric', seed);
};

export default DrinkWiseImages;
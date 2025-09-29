// Utilitaires pour l'authentification
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    const minLength = 6;
    return password.length >= minLength;
};

export const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'Aucun compte associé à cette adresse email.';
        case 'auth/wrong-password':
            return 'Mot de passe incorrect.';
        case 'auth/email-already-in-use':
            return 'Cette adresse email est déjà utilisée.';
        case 'auth/weak-password':
            return 'Le mot de passe doit contenir au moins 6 caractères.';
        case 'auth/invalid-email':
            return 'Adresse email invalide.';
        case 'auth/user-disabled':
            return 'Ce compte a été désactivé.';
        case 'auth/too-many-requests':
            return 'Trop de tentatives. Veuillez réessayer plus tard.';
        case 'auth/network-request-failed':
            return 'Problème de connexion. Vérifiez votre connexion internet.';
        case 'auth/invalid-credential':
            return 'Identifiants invalides.';
        case 'auth/account-exists-with-different-credential':
            return 'Un compte existe déjà avec cette adresse email mais avec un autre mode de connexion.';
        case 'auth/popup-closed-by-user':
            return 'Connexion annulée par l\'utilisateur.';
        case 'auth/popup-blocked':
            return 'Popup bloqué par le navigateur. Veuillez autoriser les popups pour ce site.';
        case 'auth/cancelled-popup-request':
            return 'Connexion annulée.';
        case 'auth/operation-not-allowed':
            return 'Ce mode de connexion n\'est pas activé.';
        case 'auth/operation-not-supported-in-this-environment':
            return 'Cette opération n\'est pas supportée dans cet environnement.';
        default:
            return 'Une erreur inattendue s\'est produite.';
    }
};

export const formatEmailForDisplay = (email) => {
    if (!email || !email.includes('@')) return email;
    
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 3 
        ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 3) + localPart.slice(-1)
        : localPart;
    
    return `${maskedLocal}@${domain}`;
};
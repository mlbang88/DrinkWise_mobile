// Mode de test - Utilisateur de développement
// À supprimer en production

export const DEV_TEST_USER = {
  email: 'test@drinkwise.app',
  password: 'TestPass123!',
  displayName: 'Testeur DrinkWise',
  uid: 'dev-test-user-' + Date.now()
};

export const createTestUser = async (auth, db, appId) => {
  try {
    // Créer un utilisateur test temporaire
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { doc, setDoc } = await import('firebase/firestore');
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      DEV_TEST_USER.email, 
      DEV_TEST_USER.password
    );
    
    const user = userCredential.user;
    
    // Créer le profil utilisateur
    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
    await setDoc(userProfileRef, {
      username: 'testeur_drinkwise',
      displayName: DEV_TEST_USER.displayName,
      email: user.email,
      photoURL: null,
      level: 1,
      levelName: 'Novice de la Fête',
      xp: 0,
      createdAt: new Date(),
      isPublic: true,
      friends: []
    });
    
    return user;
  } catch (error) {
    console.log('Utilisateur test existe déjà ou erreur:', error.code);
    throw error;
  }
};
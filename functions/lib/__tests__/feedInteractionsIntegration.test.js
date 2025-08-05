import { describe, it, expect, beforeAll } from 'vitest';
import admin from 'firebase-admin';
import { getFeedInteractionsLogic } from '../feedInteractionsLogic.js';

describe('Integration getFeedInteractions with Emulator', () => {
  let db;
  const appId = 'testApp';
  const itemId = 'item123';
  const user1 = 'user1';
  const user2 = 'user2';

  beforeAll(async () => {
    // Pointer vers l'émulateur Firestore
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'integration-test' });
    }
    db = admin.firestore();
    // Nettoyer les interactions existantes dans l’émulateur
    const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
    const existing = await interactionsRef.get();
    await Promise.all(existing.docs.map(doc => doc.ref.delete()));
    // Créer les collections et permissions pour deux amis
    await db.doc(`artifacts/${appId}/public_user_stats/${user1}`).set({ friends: [user2] });
    await db.doc(`artifacts/${appId}/public_user_stats/${user2}`).set({ friends: [user1] });

    // Ajouter une interaction commentaire
    await db.collection(`artifacts/${appId}/feed_interactions`).add({
      itemId,
      itemType: 'party',
      ownerId: user1,
      userId: user2,
      type: 'comment',
      content: 'Salut !',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  it('should return the comment via logic', async () => {
    const result = await getFeedInteractionsLogic(db, user1, itemId, appId);
    expect(result.comments.length).toBe(1);
    expect(result.comments[0].content).toBe('Salut !');
  });
});

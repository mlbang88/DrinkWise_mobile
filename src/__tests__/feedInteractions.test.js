import { describe, it, expect, vi } from 'vitest';
// Mock des modules Firebase Functions utilisés dans index.js
vi.mock('firebase-functions', () => ({ setGlobalOptions: () => {} }));
vi.mock('firebase-functions/v2/https', () => ({
  onCall: (opts, handler) => {
    // Retourne le handler enrichi d'une méthode on() pour les besoins du wrapper
    const fn = handler;
    fn.on = () => {};
    return fn;
  }
}));
vi.mock('firebase-functions/https', () => ({ onRequest: handler => handler }));
vi.mock('firebase-functions/v2/firestore', () => ({ onDocumentCreated: (opts, handler) => handler, onDocumentUpdated: (opts, handler) => handler }));
vi.mock('firebase-functions/logger', () => ({ info: () => {}, error: () => {} }));
// Mock CORS
vi.mock('cors', () => () => (req, res, next) => next());
// Mock Firebase Admin et Firestore
vi.mock('firebase-admin', () => {
  const FieldValue = { serverTimestamp: () => 12345, arrayUnion: () => [], arrayRemove: () => [] };
  const firestore = () => ({
    doc: () => ({ get: () => Promise.resolve({ exists: true, data: () => ({ friends: [] }) }) }),
    collection: () => ({
      where: () => ({ orderBy: () => ({ get: () => Promise.resolve({ docs: [] }) }) })
    })
  });
  return { initializeApp: () => {}, apps: [], firestore, FieldValue };
});
// Importer la Cloud Function à tester
import { getFeedInteractions } from '../../functions/index.js';

// ...existing code...

// Tests
describe('getFeedInteractions Cloud Function', () => {
  it('returns success with empty interactions when no interactions exist', async () => {
    const request = {
      auth: { uid: 'user1' },
      data: { itemId: 'item1', appId: 'app1' }
    };

    const result = await getFeedInteractions(request);
    expect(result.success).toBe(true);
    expect(result.interactions).toEqual({ likes: [], congratulations: [], comments: [] });
  });
});

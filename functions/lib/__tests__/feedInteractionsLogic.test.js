import { describe, it, expect } from 'vitest';
import { getFeedInteractionsLogic } from '../feedInteractionsLogic.js';

// Helper to create a mock Firestore-like db
function createMockDb({ friendsList = [], interactions = [] } = {}) {
  return {
    doc: (path) => ({
      get: () => Promise.resolve({ exists: true, data: () => ({ friends: friendsList }) })
    }),
    collection: (path) => ({
      where: (field, op, value) => ({
        orderBy: (field2, dir) => ({
          get: () => Promise.resolve({ docs: interactions.map(i => ({ id: i.id, data: () => i })) })
        })
      })
    })
  };
}

describe('getFeedInteractionsLogic', () => {
  it('throws if user is not authenticated', async () => {
    const db = createMockDb();
    await expect(getFeedInteractionsLogic(db, null, 'item1', 'app1')).rejects.toThrow('Utilisateur non authentifié');
  });

  it('throws if itemId or appId missing', async () => {
    const db = createMockDb();
    await expect(getFeedInteractionsLogic(db, 'user1', '', 'app1')).rejects.toThrow('Paramètres manquants');
    await expect(getFeedInteractionsLogic(db, 'user1', 'item1', '')).rejects.toThrow('Paramètres manquants');
  });

  it('returns empty arrays when no interactions exist', async () => {
    const db = createMockDb({ friendsList: [], interactions: [] });
    const result = await getFeedInteractionsLogic(db, 'user1', 'item1', 'app1');
    expect(result).toEqual({ likes: [], congratulations: [], comments: [] });
  });

  it('filters out interactions from non-friends', async () => {
    const interactions = [
      { id: 'i1', userId: 'u2', type: 'like', timestamp: 1 },
      { id: 'i2', userId: 'user1', type: 'comment', content: 'hello', timestamp: 2 }
    ];
    // u2 is not in friendsList -> filtered, user1 sees own comment
    const db = createMockDb({ friendsList: [], interactions });
    const result = await getFeedInteractionsLogic(db, 'user1', 'item1', 'app1');
    expect(result).toEqual({
      likes: [],
      congratulations: [],
      comments: [{ id: 'i2', userId: 'user1', content: 'hello', timestamp: 2 }]
    });
  });

  it('includes interactions from bidirectional friends only', async () => {
    const interactions = [
      { id: 'i1', userId: 'u2', type: 'comment', content: 'hi', timestamp: 3 }
    ];
    // Simuler amitié bidirectionnelle : user1 et u2 sont mutuellement amis
    const db = createMockDb({ friendsList: ['u2', 'user1'], interactions });
    const result = await getFeedInteractionsLogic(db, 'user1', 'item1', 'app1');
    expect(result).toEqual({
      likes: [],
      congratulations: [],
      comments: [{ id: 'i1', userId: 'u2', content: 'hi', timestamp: 3 }]
    });
  });
  
  it('includes likes from friends', async () => {
    const interactions = [
      { id: 'l1', userId: 'u2', type: 'like', timestamp: 5 }
    ];
    // user1 et u2 sont amis mutuels
    const db = createMockDb({ friendsList: ['u2', 'user1'], interactions });
    const result = await getFeedInteractionsLogic(db, 'user1', 'item1', 'app1');
    expect(result.likes).toEqual([{ id: 'l1', userId: 'u2', timestamp: 5 }]);
    expect(result.congratulations).toEqual([]);
    expect(result.comments).toEqual([]);
  });

  it('includes congratulations from friends', async () => {
    const interactions = [
      { id: 'c1', userId: 'u2', type: 'congratulate', timestamp: 7 }
    ];
    // user1 et u2 sont amis mutuels
    const db = createMockDb({ friendsList: ['u2', 'user1'], interactions });
    const result = await getFeedInteractionsLogic(db, 'user1', 'item1', 'app1');
    expect(result.likes).toEqual([]);
    expect(result.congratulations).toEqual([{ id: 'c1', userId: 'u2', timestamp: 7 }]);
    expect(result.comments).toEqual([]);
  });
});

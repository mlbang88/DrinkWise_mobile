import { describe, it, expect } from 'vitest';
import { handleFeedInteractionLogic } from '../feedInteractionHandler.js';

// Mock simple db with collection and doc
function createMockDb() {
  const data = [];
  return {
    collection: () => ({
      add: (obj) => { data.push(obj); return Promise.resolve({}); },
      where: () => ({
        where: () => ({
          where: () => ({
            get: () => Promise.resolve({ empty: data.length === 0, docs: data.map((_, i) => ({ ref: { delete: () => {} } })) })
          })
        })
      }),
      doc: () => ({ get: () => Promise.resolve({ exists: true, data: () => ({}) }) })
    }),
    batch: () => ({
      delete: () => {},
      commit: () => Promise.resolve()
    })
  };
}

describe('handleFeedInteractionLogic', () => {
  it('throws when missing params', async () => {
    const db = createMockDb();
    await expect(handleFeedInteractionLogic(db, null, {})).rejects.toThrow('Utilisateur non authentifié');
    await expect(handleFeedInteractionLogic(db, 'u1', {})).rejects.toThrow('Paramètres manquants');
  });

  it('adds a comment', async () => {
    const db = createMockDb();
    const result = await handleFeedInteractionLogic(db, 'u1', { itemId: 'i1', itemType: 'party', ownerId: 'o1', interactionType: 'comment', content: 'hey', appId: 'app1' });
    expect(result.action).toBe('commentAdded');
  });

  it('toggles a like', async () => {
    const db = createMockDb();
    // First add
    let res1 = await handleFeedInteractionLogic(db, 'u1', { itemId: 'i1', itemType: 'party', ownerId: 'o1', interactionType: 'like', appId: 'app1' });
    expect(res1.action).toBe('added');
    // Then remove
    let res2 = await handleFeedInteractionLogic(db, 'u1', { itemId: 'i1', itemType: 'party', ownerId: 'o1', interactionType: 'like', appId: 'app1' });
    expect(res2.action).toBe('removed');
  });
});

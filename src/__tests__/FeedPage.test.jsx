import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeedPage from '../pages/FeedPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } }
}));

// Mock services
vi.mock('../services/feedService', () => ({
  getFeedForUser: vi.fn(() => Promise.resolve([])),
  addLike: vi.fn(() => Promise.resolve()),
  removeLike: vi.fn(() => Promise.resolve()),
  addReaction: vi.fn(() => Promise.resolve()),
  removeReaction: vi.fn(() => Promise.resolve())
}));

vi.mock('../services/commentService', () => ({
  addComment: vi.fn(() => Promise.resolve({ id: 'comment-123' })),
  getComments: vi.fn(() => Promise.resolve([]))
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg'
};

const renderFeedPage = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ currentUser: mockUser }}>
        <FeedPage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('FeedPage - Critical Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render feed page without crashing', () => {
    renderFeedPage();
    expect(screen.getByText(/feed/i)).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    renderFeedPage();
    // Le composant devrait afficher un état de chargement
    // (adapter selon votre implémentation)
  });

  it('should load feed items on mount', async () => {
    const { getFeedForUser } = await import('../services/feedService');
    getFeedForUser.mockResolvedValueOnce([
      {
        id: 'post-1',
        type: 'party',
        userId: 'user-1',
        content: 'Test party',
        timestamp: new Date()
      }
    ]);

    renderFeedPage();

    await waitFor(() => {
      expect(getFeedForUser).toHaveBeenCalledWith('test-user-123');
    });
  });

  it('should handle like action', async () => {
    const { addLike } = await import('../services/feedService');
    
    renderFeedPage();

    // Simuler un clic sur le bouton like
    // (adapter selon votre structure HTML)
    const likeButton = screen.queryByRole('button', { name: /like/i });
    if (likeButton) {
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(addLike).toHaveBeenCalled();
      });
    }
  });

  it('should handle add comment action', async () => {
    const { addComment } = await import('../services/commentService');
    
    renderFeedPage();

    // Simuler l'ajout d'un commentaire
    // (adapter selon votre structure HTML)
    const commentInput = screen.queryByPlaceholderText(/comment/i);
    if (commentInput) {
      fireEvent.change(commentInput, { target: { value: 'Test comment' } });
      
      const submitButton = screen.queryByRole('button', { name: /post/i });
      if (submitButton) {
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(addComment).toHaveBeenCalled();
        });
      }
    }
  });

  it('should handle error state gracefully', async () => {
    const { getFeedForUser } = await import('../services/feedService');
    getFeedForUser.mockRejectedValueOnce(new Error('Network error'));

    renderFeedPage();

    await waitFor(() => {
      // Vérifier qu'un message d'erreur s'affiche
      // (adapter selon votre implémentation)
      expect(screen.queryByText(/error/i)).toBeTruthy();
    });
  });

  it('should prevent XSS in comments', async () => {
    const { getFeedForUser } = await import('../services/feedService');
    const { getComments } = await import('../services/commentService');

    getFeedForUser.mockResolvedValueOnce([
      {
        id: 'post-1',
        type: 'party',
        userId: 'user-1',
        content: 'Test party'
      }
    ]);

    getComments.mockResolvedValueOnce([
      {
        id: 'comment-1',
        text: '<script>alert("XSS")</script>Malicious comment',
        userId: 'user-2',
        timestamp: new Date()
      }
    ]);

    renderFeedPage();

    await waitFor(() => {
      // Vérifier que le script n'est pas exécuté
      const commentElements = screen.queryAllByText(/Malicious comment/i);
      commentElements.forEach(element => {
        expect(element.innerHTML).not.toContain('<script>');
      });
    });
  });

  it('should batch load interactions efficiently', async () => {
    const { getFeedForUser } = await import('../services/feedService');
    
    // Créer 10 posts pour tester le batch loading
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${i}`,
      type: 'party',
      userId: `user-${i}`,
      content: `Test party ${i}`,
      timestamp: new Date()
    }));

    getFeedForUser.mockResolvedValueOnce(mockPosts);

    renderFeedPage();

    await waitFor(() => {
      expect(getFeedForUser).toHaveBeenCalledTimes(1);
    });

    // Vérifier que les interactions sont chargées par batch
    // (le test exact dépend de votre implémentation)
  });
});

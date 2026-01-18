import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import FeedPage from '../pages/FeedPage';
import InstagramPost from '../components/InstagramPost';
import { AuthContext } from '../contexts/AuthContext';

// Étendre les matchers
expect.extend(toHaveNoViolations);

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } }
}));

// Mock services
vi.mock('../services/feedService', () => ({
  getFeedForUser: vi.fn(() => Promise.resolve([])),
}));

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg'
};

const mockPost = {
  id: 'post-123',
  userId: 'user-123',
  type: 'party',
  content: 'Test party content',
  photoURLs: ['https://example.com/photo1.jpg'],
  videoURLs: [],
  timestamp: new Date(),
  location: 'Test Location'
};

describe('Accessibility Tests', () => {
  it('FeedPage should have no accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={{ currentUser: mockUser }}>
          <FeedPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('InstagramPost should have no accessibility violations', async () => {
    const { container } = render(
      <InstagramPost
        post={mockPost}
        user={mockUser}
        onLike={() => {}}
        onComment={() => {}}
        onAddComment={() => {}}
        onDoubleTapLike={() => {}}
        isLiked={false}
        userReaction={null}
        reactions={{}}
        likesCount={0}
        commentsCount={0}
        timestamp={new Date()}
        showHeartAnimation={false}
        isCommentsOpen={false}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels on interactive elements', async () => {
    const { container } = render(
      <InstagramPost
        post={mockPost}
        user={mockUser}
        onLike={() => {}}
        onComment={() => {}}
        onAddComment={() => {}}
        onDoubleTapLike={() => {}}
        isLiked={false}
        userReaction={null}
        reactions={{}}
        likesCount={0}
        commentsCount={0}
        timestamp={new Date()}
        showHeartAnimation={false}
        isCommentsOpen={false}
      />
    );

    // Vérifier les règles spécifiques d'accessibilité
    const results = await axe(container, {
      rules: {
        'button-name': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-required-attr': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={{ currentUser: mockUser }}>
          <FeedPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper image alt text', async () => {
    const { container } = render(
      <InstagramPost
        post={mockPost}
        user={mockUser}
        onLike={() => {}}
        onComment={() => {}}
        onAddComment={() => {}}
        onDoubleTapLike={() => {}}
        isLiked={false}
        userReaction={null}
        reactions={{}}
        likesCount={0}
        commentsCount={0}
        timestamp={new Date()}
        showHeartAnimation={false}
        isCommentsOpen={false}
      />
    );

    const results = await axe(container, {
      rules: {
        'image-alt': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });
});

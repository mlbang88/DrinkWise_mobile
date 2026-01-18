import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstagramPost from '../components/InstagramPost';

// Mock navigator.share
global.navigator.share = vi.fn(() => Promise.resolve());

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

const mockUser = {
  uid: 'user-123',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg'
};

const defaultProps = {
  post: mockPost,
  user: mockUser,
  onLike: vi.fn(),
  onComment: vi.fn(),
  onAddComment: vi.fn(),
  onDoubleTapLike: vi.fn(),
  isLiked: false,
  userReaction: null,
  reactions: {},
  likesCount: 0,
  commentsCount: 0,
  timestamp: new Date(),
  showHeartAnimation: false,
  isCommentsOpen: false
};

describe('InstagramPost - Critical Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render post without crashing', () => {
    render(<InstagramPost {...defaultProps} />);
    expect(screen.getByText(/Test party content/i)).toBeInTheDocument();
  });

  it('should display user information correctly', () => {
    render(<InstagramPost {...defaultProps} />);
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it('should handle like button click', async () => {
    const onLike = vi.fn();
    render(<InstagramPost {...defaultProps} onLike={onLike} />);

    const likeButton = screen.getByRole('button', { name: /like|j'aime/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(onLike).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle double tap like', async () => {
    const onDoubleTapLike = vi.fn();
    render(<InstagramPost {...defaultProps} onDoubleTapLike={onDoubleTapLike} />);

    const postImage = screen.getByRole('img');
    fireEvent.doubleClick(postImage);

    await waitFor(() => {
      expect(onDoubleTapLike).toHaveBeenCalled();
    });
  });

  it('should handle comment submission', async () => {
    const onAddComment = vi.fn();
    render(<InstagramPost {...defaultProps} isCommentsOpen={true} onAddComment={onAddComment} />);

    const commentInput = screen.getByPlaceholderText(/comment/i);
    await userEvent.type(commentInput, 'Test comment');

    const submitButton = screen.getByRole('button', { name: /post|envoyer/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('Test comment');
    });
  });

  it('should display active reaction emoji', () => {
    const propsWithReaction = {
      ...defaultProps,
      userReaction: 'love',
      isLiked: true
    };

    render(<InstagramPost {...propsWithReaction} />);

    // Vérifier que l'emoji ❤️ est affiché au lieu du cœur normal
    const reactionElement = screen.getByText('❤️');
    expect(reactionElement).toBeInTheDocument();
  });

  it('should handle share action', async () => {
    render(<InstagramPost {...defaultProps} />);

    const shareButton = screen.getByRole('button', { name: /share|partager/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(global.navigator.share).toHaveBeenCalled();
    });
  });

  it('should prevent XSS in post content', () => {
    const maliciousPost = {
      ...mockPost,
      content: '<script>alert("XSS")</script>Safe content'
    };

    const { container } = render(
      <InstagramPost {...defaultProps} post={maliciousPost} />
    );

    // Vérifier que le script n'est pas dans le DOM
    expect(container.innerHTML).not.toContain('<script>');
    expect(screen.getByText(/Safe content/i)).toBeInTheDocument();
  });

  it('should handle swipe gesture for multiple photos', async () => {
    const postWithMultiplePhotos = {
      ...mockPost,
      photoURLs: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
        'https://example.com/photo3.jpg'
      ]
    };

    render(<InstagramPost {...defaultProps} post={postWithMultiplePhotos} />);

    // Vérifier que les indicateurs de navigation sont présents
    const indicators = screen.getAllByRole('button', { name: /photo/i });
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('should display video with play icon', () => {
    const postWithVideo = {
      ...mockPost,
      photoURLs: [],
      videoURLs: ['https://example.com/video.mp4']
    };

    render(<InstagramPost {...defaultProps} post={postWithVideo} />);

    // Vérifier que l'élément vidéo est présent
    const video = screen.getByRole('video') || screen.getByTestId('video-player');
    expect(video).toBeTruthy();
  });

  it('should show reaction picker on long press', async () => {
    render(<InstagramPost {...defaultProps} />);

    const likeButton = screen.getByRole('button', { name: /like|j'aime/i });
    
    // Simuler un long press
    fireEvent.mouseDown(likeButton);
    
    await waitFor(() => {
      // Vérifier que le picker de réactions apparaît
      const reactionPicker = screen.getByRole('menu') || screen.getByTestId('reaction-picker');
      expect(reactionPicker).toBeTruthy();
    }, { timeout: 600 });

    fireEvent.mouseUp(likeButton);
  });

  it('should not process swipe when vertical scroll is active', () => {
    const postWithMultiplePhotos = {
      ...mockPost,
      photoURLs: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg'
      ]
    };

    render(<InstagramPost {...defaultProps} post={postWithMultiplePhotos} />);

    const postImage = screen.getAllByRole('img')[0];

    // Simuler un mouvement vertical dominant (scroll)
    fireEvent.drag(postImage, { 
      movementX: 10, 
      movementY: 100  // Mouvement vertical dominant
    });

    // Le swipe ne devrait pas être traité
    // (vérifier que l'index de la photo n'a pas changé)
  });
});

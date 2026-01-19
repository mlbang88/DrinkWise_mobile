import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MoreVertical, Eye, Heart } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useFirebase } from '../../contexts/FirebaseContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StoryViewer({ stories, userName, onClose, initialIndex = 0 }) {
    console.log('StoryViewer rendered with:', { stories, userName, storiesLength: stories?.length });
    const { user } = useFirebase();
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const STORY_DURATION = 5000; // 5 seconds per story
    const currentStory = stories?.[currentStoryIndex];
    console.log('Current story:', currentStory, 'Index:', currentStoryIndex);

    useEffect(() => {
        if (!currentStory || isPaused) return;

        // Mark as viewed
        storyService.markAsViewed(currentStory.id, user.uid);

        // Progress animation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + (100 / (STORY_DURATION / 100));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentStoryIndex, isPaused, currentStory]);

    const handleNext = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Supprimer cette story ?')) return;

        try {
            await storyService.deleteStory(currentStory.id, user.uid);
            if (stories.length === 1) {
                onClose();
            } else {
                handleNext();
            }
        } catch (error) {
            console.error('Failed to delete story', error);
        }
    };

    if (!currentStory) return null;

    const isOwnStory = currentStory.userId === user.uid;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10001,
                backgroundColor: '#000'
            }}
        >
            {/* Progress bars */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                display: 'flex',
                gap: '0.25rem',
                padding: '0.5rem'
            }}>
                {stories.map((_, index) => (
                    <div key={index} style={{
                        flex: 1,
                        height: '0.25rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                    }}>
                        <motion.div
                            style={{
                                height: '100%',
                                backgroundColor: '#fff'
                            }}
                            initial={{ width: 0 }}
                            animate={{
                                width: index < currentStoryIndex 
                                    ? '100%' 
                                    : index === currentStoryIndex 
                                    ? `${progress}%` 
                                    : '0%'
                            }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div style={{
                position: 'absolute',
                top: '2rem',
                left: 0,
                right: 0,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(to bottom right, #06b6d4, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold'
                    }}>
                        ?
                    </div>
                    <div>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>
                            {userName || (isOwnStory ? 'Votre story' : 'Utilisateur')}
                        </p>
                        {currentStory.createdAt && (
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                                {formatDistanceToNow(currentStory.createdAt.toDate(), {
                                    addSuffix: true,
                                    locale: fr
                                })}
                            </p>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isOwnStory && (
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(8px)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'}
                        >
                            <MoreVertical style={{ color: '#fff' }} size={20} />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(8px)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'}
                    >
                        <X style={{ color: '#fff' }} size={20} />
                    </button>
                </div>
            </div>

            {/* Options menu */}
            <AnimatePresence>
                {showOptions && isOwnStory && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            position: 'absolute',
                            top: '5rem',
                            right: '1rem',
                            zIndex: 30,
                            backgroundColor: '#0f172a',
                            borderRadius: '0.75rem',
                            border: '1px solid #334155',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        <button
                            onClick={handleDelete}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1.5rem',
                                textAlign: 'left',
                                color: '#f87171',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Supprimer
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Story content - Image centered with flexbox */}
            <div style={{
                position: 'absolute',
                top: '5rem',
                left: 0,
                right: 0,
                bottom: '5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {currentStory.type === 'image' ? (
                    <img
                        src={currentStory.mediaUrl}
                        alt="Story"
                        style={{
                            width: '80vw',
                            height: '60vh',
                            objectFit: 'contain',
                            userSelect: 'none'
                        }}
                        onLoad={(e) => {
                            console.log('✅ Image loaded:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                            console.log('✅ Display dimensions:', e.target.width, 'x', e.target.height);
                            console.log('✅ Computed style:', window.getComputedStyle(e.target).display);
                        }}
                        onError={(e) => console.error('❌ Image failed to load:', currentStory.mediaUrl, e)}
                    />
                ) : (
                    <video
                        src={currentStory.mediaUrl}
                        style={{
                            width: '80vw',
                            height: '60vh',
                            objectFit: 'contain'
                        }}
                        autoPlay
                        muted
                        playsInline
                    />
                )}
            </div>

            {/* Caption */}
            {currentStory.caption && (
                <div style={{
                    position: 'absolute',
                    bottom: '5rem',
                    left: 0,
                    right: 0,
                    padding: '1rem 1.5rem',
                    textAlign: 'center',
                    zIndex: 2
                }}>
                    <p style={{
                        color: '#fff',
                        fontSize: '1.125rem',
                        fontWeight: 500,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        {currentStory.caption}
                    </p>
                </div>
            )}

            {/* Navigation buttons - positioned on sides */}
            {currentStoryIndex > 0 && (
                <button
                    onClick={handlePrev}
                    style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 15,
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ChevronLeft style={{
                        color: '#fff'
                    }} size={28} />
                </button>
            )}
            <button
                onClick={handleNext}
                style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 15,
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <ChevronRight style={{
                    color: '#fff'
                }} size={28} />
            </button>

            {/* Footer (views for own stories) */}
            {isOwnStory && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    padding: '1.5rem',
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Eye size={20} />
                            <span style={{ fontWeight: 600 }}>{currentStory.viewCount || 0}</span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

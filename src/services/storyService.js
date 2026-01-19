import { 
    collection, doc, addDoc, deleteDoc, query, where, 
    orderBy, getDocs, getDoc, onSnapshot, serverTimestamp, 
    writeBatch, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { logger } from '../utils/logger';

class StoryService {
    constructor() {
        this.storiesCollection = collection(db, 'stories');
        this.activeListeners = new Map();
        this.STORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
    }

    // Create a new story
    async createStory(userId, mediaFile, type = 'image', caption = '') {
        try {
            // Upload media to Storage
            const mediaUrl = await this.uploadMedia(userId, mediaFile, type);

            // Create story document
            const storyData = {
                userId,
                type, // 'image' or 'video'
                mediaUrl,
                caption,
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromMillis(Date.now() + this.STORY_DURATION),
                views: [],
                viewCount: 0
            };

            const storyRef = await addDoc(this.storiesCollection, storyData);
            logger.info('Story created', { storyId: storyRef.id, userId });

            return { storyId: storyRef.id, ...storyData };
        } catch (error) {
            logger.error('Failed to create story', { error, userId });
            throw error;
        }
    }

    // Upload media to Firebase Storage
    async uploadMedia(userId, file, type) {
        try {
            const timestamp = Date.now();
            const fileExtension = file.name.split('.').pop();
            const fileName = `${userId}_${timestamp}.${fileExtension}`;
            const storageRef = ref(storage, `stories/${type}s/${fileName}`);

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            logger.info('Story media uploaded', { fileName, url });
            return url;
        } catch (error) {
            logger.error('Failed to upload story media', { error, userId });
            throw error;
        }
    }

    // Get stories from friends (user's following list)
    async getStoriesFromFriends(userId, friendIds) {
        try {
            if (!friendIds || friendIds.length === 0) {
                return [];
            }

            const q = query(
                this.storiesCollection,
                where('userId', 'in', friendIds.slice(0, 10)) // Firestore limit
            );

            const snapshot = await getDocs(q);
            const now = Date.now();
            
            // Filter and sort client-side
            const stories = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(story => story.expiresAt?.toMillis() > now)
                .sort((a, b) => b.expiresAt.toMillis() - a.expiresAt.toMillis());

            // Group stories by user
            const groupedStories = this.groupStoriesByUser(stories);

            logger.info('Stories fetched', { userId, storiesCount: stories.length });
            return groupedStories;
        } catch (error) {
            logger.error('Failed to get stories', { error, userId });
            return [];
        }
    }

    // Get user's own stories
    async getUserStories(userId) {
        try {
            const q = query(
                this.storiesCollection,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            const now = Date.now();
            
            // Filter and sort client-side
            const stories = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(story => story.expiresAt?.toMillis() > now)
                .sort((a, b) => b.expiresAt.toMillis() - a.expiresAt.toMillis());

            logger.info('User stories fetched', { userId, count: stories.length });
            return stories;
        } catch (error) {
            logger.error('Failed to get user stories', { error, userId });
            return [];
        }
    }

    // Group stories by user for UI rendering
    groupStoriesByUser(stories) {
        const grouped = {};

        stories.forEach(story => {
            if (!grouped[story.userId]) {
                grouped[story.userId] = {
                    userId: story.userId,
                    stories: [],
                    hasUnviewed: false
                };
            }
            grouped[story.userId].stories.push(story);
            
            // Check if any story is unviewed by current user
            if (story.views && !story.views.includes(story.userId)) {
                grouped[story.userId].hasUnviewed = true;
            }
        });

        return Object.values(grouped);
    }

    // Mark story as viewed
    async markAsViewed(storyId, viewerId) {
        try {
            const storyRef = doc(db, 'stories', storyId);
            const storyDoc = await getDoc(storyRef);
            
            if (!storyDoc.exists()) return;

            const storyData = storyDoc.data();
            const views = storyData.views || [];

            if (!views.includes(viewerId)) {
                const batch = writeBatch(db);
                batch.update(storyRef, {
                    views: [...views, viewerId],
                    viewCount: views.length + 1
                });
                await batch.commit();

                logger.info('Story marked as viewed', { storyId, viewerId });
            }
        } catch (error) {
            logger.error('Failed to mark story as viewed', { error, storyId, viewerId });
        }
    }

    // Delete story
    async deleteStory(storyId, userId) {
        try {
            const storyRef = doc(db, 'stories', storyId);
            const storyDoc = await getDoc(storyRef);

            if (!storyDoc.exists()) {
                throw new Error('Story not found');
            }

            const storyData = storyDoc.data();

            // Verify ownership
            if (storyData.userId !== userId) {
                throw new Error('Unauthorized to delete this story');
            }

            // Delete media from Storage
            if (storyData.mediaUrl) {
                try {
                    const mediaRef = ref(storage, storyData.mediaUrl);
                    await deleteObject(mediaRef);
                } catch (err) {
                    logger.warn('Failed to delete story media', { error: err, storyId });
                }
            }

            // Delete story document
            await deleteDoc(storyRef);

            logger.info('Story deleted', { storyId, userId });
        } catch (error) {
            logger.error('Failed to delete story', { error, storyId, userId });
            throw error;
        }
    }

    // Clean up expired stories (run periodically)
    async cleanupExpiredStories() {
        try {
            const now = Timestamp.now();
            const q = query(
                this.storiesCollection,
                where('expiresAt', '<=', now)
            );

            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach(doc => {
                const storyData = doc.data();
                
                // Delete media from Storage
                if (storyData.mediaUrl) {
                    const mediaRef = ref(storage, storyData.mediaUrl);
                    deleteObject(mediaRef).catch(err => {
                        logger.warn('Failed to delete expired story media', { 
                            error: err, 
                            storyId: doc.id 
                        });
                    });
                }

                // Delete document
                batch.delete(doc.ref);
            });

            await batch.commit();

            logger.info('Expired stories cleaned up', { count: snapshot.size });
            return snapshot.size;
        } catch (error) {
            logger.error('Failed to cleanup expired stories', { error });
            return 0;
        }
    }

    // Subscribe to stories updates
    subscribeToStories(friendIds, callback) {
        try {
            if (!friendIds || friendIds.length === 0) {
                callback([]);
                return () => {};
            }

            const now = Timestamp.now();
            const q = query(
                this.storiesCollection,
                where('userId', 'in', friendIds.slice(0, 10)),
                where('expiresAt', '>', now),
                orderBy('expiresAt'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const stories = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const groupedStories = this.groupStoriesByUser(stories);
                callback(groupedStories);
            }, (error) => {
                logger.error('Error listening to stories', { error });
                callback([]);
            });

            this.activeListeners.set('stories', unsubscribe);
            return unsubscribe;
        } catch (error) {
            logger.error('Failed to subscribe to stories', { error });
            callback([]);
            return () => {};
        }
    }

    // Clean up listeners
    unsubscribeAll() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
        logger.info('All story listeners unsubscribed');
    }
}

// Export singleton instance
export const storyService = new StoryService();

// Auto-cleanup expired stories every hour
if (typeof window !== 'undefined') {
    setInterval(() => {
        storyService.cleanupExpiredStories();
    }, 60 * 60 * 1000); // 1 hour
}

export default storyService;

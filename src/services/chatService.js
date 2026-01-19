import { 
    collection, doc, addDoc, updateDoc, query, where, 
    orderBy, limit, onSnapshot, serverTimestamp, getDoc,
    getDocs, writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { logger } from '../utils/logger';

class ChatService {
    constructor() {
        this.chatsCollection = collection(db, 'chats');
        this.messagesCollection = (chatId) => collection(db, `chats/${chatId}/messages`);
        this.activeListeners = new Map();
    }

    // Create or get existing chat between two users
    async createOrGetChat(userId, otherUserId) {
        try {
            // Check if chat already exists
            const q = query(
                this.chatsCollection,
                where('participants', 'array-contains', userId)
            );

            const snapshot = await getDocs(q);
            const existingChat = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.participants.includes(otherUserId) && 
                       data.participants.length === 2;
            });

            if (existingChat) {
                return { chatId: existingChat.id, ...existingChat.data() };
            }

            // Create new chat
            const chatData = {
                participants: [userId, otherUserId],
                createdAt: serverTimestamp(),
                lastMessage: null,
                lastMessageAt: serverTimestamp(),
                unreadCount: {
                    [userId]: 0,
                    [otherUserId]: 0
                }
            };

            const chatRef = await addDoc(this.chatsCollection, chatData);
            logger.info('Chat created', { chatId: chatRef.id });

            return { chatId: chatRef.id, ...chatData };
        } catch (error) {
            logger.error('Failed to create/get chat', { error, userId, otherUserId });
            throw error;
        }
    }

    // Send a message
    async sendMessage(chatId, senderId, content, type = 'text') {
        try {
            const messageData = {
                senderId,
                content,
                type, // 'text', 'image', 'location'
                createdAt: serverTimestamp(),
                read: false
            };

            const messagesRef = this.messagesCollection(chatId);
            const messageRef = await addDoc(messagesRef, messageData);

            // Update chat's last message
            const chatRef = doc(db, 'chats', chatId);
            const chatDoc = await getDoc(chatRef);
            const chatData = chatDoc.data();

            const otherUserId = chatData.participants.find(id => id !== senderId);

            await updateDoc(chatRef, {
                lastMessage: content.substring(0, 100),
                lastMessageAt: serverTimestamp(),
                [`unreadCount.${otherUserId}`]: (chatData.unreadCount?.[otherUserId] || 0) + 1
            });

            logger.info('Message sent', { chatId, messageId: messageRef.id });
            return { messageId: messageRef.id, ...messageData };
        } catch (error) {
            logger.error('Failed to send message', { error, chatId, senderId });
            throw error;
        }
    }

    // Listen to messages in a chat
    subscribeToMessages(chatId, callback, limitCount = 50) {
        try {
            const messagesRef = this.messagesCollection(chatId);
            const q = query(
                messagesRef,
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).reverse(); // Reverse to show oldest first

                callback(messages);
            }, (error) => {
                logger.error('Error listening to messages', { error, chatId });
                callback([]);
            });

            this.activeListeners.set(`messages-${chatId}`, unsubscribe);
            return unsubscribe;
        } catch (error) {
            logger.error('Failed to subscribe to messages', { error, chatId });
            throw error;
        }
    }

    // Listen to user's chat list
    subscribeToChats(userId, callback) {
        try {
            const q = query(
                this.chatsCollection,
                where('participants', 'array-contains', userId),
                orderBy('lastMessageAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const chats = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                callback(chats);
            }, (error) => {
                logger.error('Error listening to chats', { error, userId });
                callback([]);
            });

            this.activeListeners.set(`chats-${userId}`, unsubscribe);
            return unsubscribe;
        } catch (error) {
            logger.error('Failed to subscribe to chats', { error, userId });
            throw error;
        }
    }

    // Mark messages as read
    async markAsRead(chatId, userId) {
        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                [`unreadCount.${userId}`]: 0
            });

            logger.info('Chat marked as read', { chatId, userId });
        } catch (error) {
            logger.error('Failed to mark as read', { error, chatId, userId });
        }
    }

    // Delete a message
    async deleteMessage(chatId, messageId) {
        try {
            const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
            await updateDoc(messageRef, {
                deleted: true,
                deletedAt: serverTimestamp()
            });

            logger.info('Message deleted', { chatId, messageId });
        } catch (error) {
            logger.error('Failed to delete message', { error, chatId, messageId });
            throw error;
        }
    }

    // Get unread count for user
    async getUnreadCount(userId) {
        try {
            const q = query(
                this.chatsCollection,
                where('participants', 'array-contains', userId)
            );

            const snapshot = await getDocs(q);
            let totalUnread = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                totalUnread += data.unreadCount?.[userId] || 0;
            });

            return totalUnread;
        } catch (error) {
            logger.error('Failed to get unread count', { error, userId });
            return 0;
        }
    }

    // Clean up listeners
    unsubscribeAll() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
        logger.info('All chat listeners unsubscribed');
    }

    unsubscribe(key) {
        const unsubscribe = this.activeListeners.get(key);
        if (unsubscribe) {
            unsubscribe();
            this.activeListeners.delete(key);
            logger.info('Chat listener unsubscribed', { key });
        }
    }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;

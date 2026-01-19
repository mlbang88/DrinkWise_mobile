import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Plus, Search, X } from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { chatService } from '../../services/chatService';
import ChatWindow from './ChatWindow';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

export default function ChatList() {
    const { user } = useFirebase();
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendsData, setFriendsData] = useState({});

    // Load friends
    useEffect(() => {
        if (!user?.uid) return;

        const loadFriends = async () => {
            try {
                const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
                const userDoc = await getDoc(userStatsRef);
                if (userDoc.exists()) {
                    const friendsList = userDoc.data().friends || [];
                    setFriends(friendsList);
                    
                    // Load friend names
                    const friendsInfo = {};
                    for (const friendId of friendsList) {
                        const friendRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
                        const friendDoc = await getDoc(friendRef);
                        if (friendDoc.exists()) {
                            friendsInfo[friendId] = friendDoc.data().displayName || friendDoc.data().username || 'Utilisateur';
                        }
                    }
                    setFriendsData(friendsInfo);
                }
            } catch (error) {
                console.error('Error loading friends:', error);
            }
        };

        loadFriends();
    }, [user]);

    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = chatService.subscribeToChats(
            user.uid,
            (chatList) => {
                setChats(chatList);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const filteredChats = chats.filter(chat => {
        // TODO: Filter by other user's name (need to fetch user data)
        return chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalUnread = chats.reduce((acc, chat) => {
        return acc + (chat.unreadCount?.[user?.uid] || 0);
    }, 0);

    if (selectedChat) {
        return (
            <ChatWindow
                chatId={selectedChat.id}
                otherUserId={selectedChat.participants.find(id => id !== user?.uid)}
                onClose={() => setSelectedChat(null)}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#020617' }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'linear-gradient(to right, #0f172a, rgba(88, 28, 135, 0.5))',
                borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
                padding: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MessageCircle style={{ color: '#22d3ee' }} size={24} />
                        <h1 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>Messages</h1>
                        {totalUnread > 0 && (
                            <span style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                background: 'linear-gradient(to right, #06b6d4, #a855f7)',
                                color: 'white',
                                borderRadius: '9999px'
                            }}>
                                {totalUnread}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowNewChat(true)}
                        style={{
                            padding: '8px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.6)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une conversation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            paddingLeft: '40px',
                            paddingRight: '40px',
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            borderRadius: '12px',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid #334155',
                            color: 'white',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
                        onBlur={(e) => e.target.style.borderColor = '#334155'}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid #06b6d4',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '256px', color: '#94a3b8' }}>
                        <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ fontSize: '18px', fontWeight: '600' }}>
                            {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
                        </p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>
                            {searchQuery ? 'Essayez un autre terme' : 'Commencez à discuter avec vos amis'}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredChats.map((chat) => {
                            const unreadCount = chat.unreadCount?.[user?.uid] || 0;
                            const isUnread = unreadCount > 0;
                            const otherUserId = chat.participants.find(id => id !== user?.uid);
                            const otherUserName = friendsData[otherUserId] || 'Utilisateur';

                            return (
                                <motion.button
                                    key={chat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    onClick={() => setSelectedChat(chat)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '16px',
                                        background: isUnread ? 'rgba(88, 28, 135, 0.1)' : 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid #1e293b',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = isUnread ? 'rgba(88, 28, 135, 0.1)' : 'transparent'}
                                >
                                    {/* Avatar */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(to bottom right, #06b6d4, #a855f7)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            {otherUserName.charAt(0).toUpperCase()}
                                        </div>
                                        {isUnread && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-4px',
                                                right: '-4px',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(to right, #06b6d4, #a855f7)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: 'white'
                                            }}>
                                                {unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <h3 style={{
                                                fontWeight: '600',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                color: isUnread ? 'white' : '#cbd5e1'
                                            }}>
                                                {otherUserName}
                                            </h3>
                                            {chat.lastMessageAt && (
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {formatDistanceToNow(chat.lastMessageAt.toDate(), {
                                                        addSuffix: true,
                                                        locale: fr
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        {chat.lastMessage && (
                                            <p style={{
                                                fontSize: '14px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                color: isUnread ? '#cbd5e1' : '#64748b',
                                                fontWeight: isUnread ? '500' : '400'
                                            }}>
                                                {chat.lastMessage}
                                            </p>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
            
            {/* Modal nouvelle conversation */}
            {showNewChat && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '16px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        border: '1px solid rgba(168, 85, 247, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                                Nouvelle conversation
                            </h2>
                            <button onClick={() => setShowNewChat(false)} style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '4px'
                            }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        {friends.length === 0 ? (
                            <>
                                <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                    Vous n'avez pas encore d'amis. Ajoutez des amis dans l'onglet Amis pour pouvoir discuter.
                                </p>
                                <button
                                    onClick={() => setShowNewChat(false)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '16px'
                                    }}
                                >
                                    Compris
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
                                    Sélectionnez un ami pour commencer une conversation
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {friends.map((friendId) => (
                                        <button
                                            key={friendId}
                                            onClick={async () => {
                                                try {
                                                    const result = await chatService.createOrGetChat(user.uid, friendId);
                                                    setSelectedChat({ 
                                                        id: result.chatId, 
                                                        participants: [user.uid, friendId] 
                                                    });
                                                    setShowNewChat(false);
                                                } catch (error) {
                                                    console.error('Error creating chat:', error);
                                                }
                                            }}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: 'rgba(168, 85, 247, 0.1)',
                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                                            }}
                                        >
                                            {friendsData[friendId] || 'Chargement...'}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

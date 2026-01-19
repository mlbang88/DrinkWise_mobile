import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MoreVertical, Image, MapPin, Smile } from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { chatService } from '../../services/chatService';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

export default function ChatWindow({ chatId, otherUserId, onClose }) {
    const { user } = useFirebase();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [otherUserName, setOtherUserName] = useState('Utilisateur');
    const messagesEndRef = useRef(null);

    // Load other user's name
    useEffect(() => {
        if (!otherUserId) return;

        const loadUserName = async () => {
            try {
                const userRef = doc(db, `artifacts/${appId}/public_user_stats`, otherUserId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setOtherUserName(data.displayName || data.username || 'Utilisateur');
                }
            } catch (error) {
                console.error('Error loading user name:', error);
            }
        };

        loadUserName();
    }, [otherUserId]);

    useEffect(() => {
        if (!chatId) return;

        const unsubscribe = chatService.subscribeToMessages(chatId, (messageList) => {
            setMessages(messageList);
            scrollToBottom();
        });

        // Mark as read
        chatService.markAsRead(chatId, user.uid);

        return () => unsubscribe();
    }, [chatId, user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await chatService.sendMessage(chatId, user.uid, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    const renderDateSeparator = (currentMsg, previousMsg) => {
        if (!currentMsg?.createdAt) return null;

        const currentDate = currentMsg.createdAt.toDate();
        const previousDate = previousMsg?.createdAt?.toDate();

        if (!previousDate || !isSameDay(currentDate, previousDate)) {
            return (
                <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                        {format(currentDate, 'EEEE d MMMM', { locale: fr })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#020617' }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'linear-gradient(90deg, #0f172a, rgba(88, 28, 135, 0.5))',
                borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
                padding: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px',
                                marginLeft: '-8px',
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            ?
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 'bold', color: 'white', margin: 0 }}>{otherUserName}</h2>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>En ligne</p>
                        </div>
                    </div>
                    <button style={{
                        padding: '8px',
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>Aucun message pour le moment</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => {
                            const isOwn = msg.senderId === user.uid;
                            const showAvatar = index === messages.length - 1 || 
                                             messages[index + 1]?.senderId !== msg.senderId;

                            return (
                                <div key={msg.id}>
                                    {renderDateSeparator(msg, messages[index - 1])}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        {showAvatar && !isOwn ? (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 
                                                          flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                ?
                                            </div>
                                        ) : (
                                            <div className="w-8" />
                                        )}

                                        {/* Message bubble */}
                                        <div
                                            className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                                                isOwn
                                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-br-sm'
                                                    : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                                            }`}
                                        >
                                            {msg.deleted ? (
                                                <p className="italic text-slate-400 text-sm">Message supprimé</p>
                                            ) : (
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                    {msg.content}
                                                </p>
                                            )}
                                            {msg.createdAt && (
                                                <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-slate-500'}`}>
                                                    {format(msg.createdAt.toDate(), 'HH:mm')}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSend}
                style={{
                    position: 'sticky',
                    bottom: 0,
                    background: '#0f172a',
                    borderTop: '1px solid #1e293b',
                    padding: '12px 16px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    {/* Attachment buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            type="button"
                            style={{
                                padding: '8px',
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Image size={20} />
                        </button>
                        <button
                            type="button"
                            style={{
                                padding: '8px',
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <MapPin size={20} />
                        </button>
                    </div>

                    {/* Input field */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Envoyer un message..."
                            style={{
                                width: '100%',
                                padding: '12px 48px 12px 16px',
                                borderRadius: '9999px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                        />
                        <button
                            type="button"
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '8px',
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Smile size={20} />
                        </button>
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        style={{
                            padding: '12px',
                            borderRadius: '50%',
                            background: newMessage.trim() ? 'linear-gradient(135deg, #06b6d4, #a855f7)' : '#475569',
                            color: 'white',
                            border: 'none',
                            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: newMessage.trim() ? 1 : 0.5,
                            boxShadow: newMessage.trim() ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (newMessage.trim()) {
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.6)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (newMessage.trim()) {
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
                            }
                        }}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

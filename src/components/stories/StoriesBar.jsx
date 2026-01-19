import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { storyService } from '../../services/storyService';
import StoryCreator from './StoryCreator';
import StoryViewer from './StoryViewer';

export default function StoriesBar() {
    const { user } = useFirebase();
    const [showCreator, setShowCreator] = useState(false);
    const [stories, setStories] = useState([]);
    const [userStories, setUserStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStories = async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            
            // Charger les amis de l'utilisateur
            const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            const userDoc = await getDoc(userStatsRef);
            const friendsList = userDoc.exists() ? (userDoc.data().friends || []) : [];

            // Charger les stories de l'utilisateur
            const myStories = await storyService.getUserStories(user.uid);
            setUserStories(myStories);

            // Charger les stories des amis
            if (friendsList.length > 0) {
                const friendStories = await storyService.getStoriesFromFriends(user.uid, friendsList);
                
                // Charger les vrais objets friends depuis Firestore
                console.log('🔍 friendsList IDs:', friendsList);
                const friendsData = [];
                for (const friendId of friendsList) {
                    try {
                        const friendDoc = await getDoc(doc(db, 'publicStats', friendId));
                        if (friendDoc.exists()) {
                            friendsData.push({ id: friendId, ...friendDoc.data() });
                        }
                    } catch (err) {
                        console.warn('Could not load friend data:', friendId);
                    }
                }
                console.log('🔍 friendsData loaded:', friendsData);
                
                // Ajouter les noms d'utilisateurs depuis friendsData
                const storiesWithNames = friendStories.map(storyGroup => {
                    const friend = friendsData.find(f => f.id === storyGroup.userId);
                    const userName = friend?.username || friend?.displayName || 'Ami';
                    console.log('🔍 Story for', storyGroup.userId, '→ name:', userName);
                    return {
                        ...storyGroup,
                        userName
                    };
                });
                
                setStories(storiesWithNames);
            }
        } catch (error) {
            console.error('Error loading stories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStories();
    }, [user]);

    const handleStoryCreated = () => {
        setShowCreator(false);
        loadStories(); // Rafraîchir les stories
    };

    return (
        <>
            <div style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                overflowX: 'auto',
                background: 'rgba(15, 23, 42, 0.5)',
                borderBottom: '1px solid rgba(168, 85, 247, 0.1)'
            }}>
                {/* Add Story Button */}
                <button
                    onClick={() => {
                        console.log('Story button clicked, userStories:', userStories);
                        if (userStories.length > 0) {
                            // Si l'utilisateur a des stories, les afficher
                            const storyData = {
                                userId: user.uid,
                                userName: 'Vous',
                                stories: userStories
                            };
                            console.log('Setting selectedStory:', storyData);
                            setSelectedStory(storyData);
                        } else {
                            // Sinon, ouvrir le créateur
                            console.log('Opening creator');
                            setShowCreator(true);
                        }
                    }}
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: userStories.length > 0 
                            ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' 
                            : 'linear-gradient(135deg, #06b6d4, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: userStories.length > 0 ? '3px solid #ec4899' : 'none',
                        padding: userStories.length > 0 ? '2px' : '0'
                    }}>
                        {userStories.length > 0 ? (
                            <img 
                                src={userStories[0].mediaUrl} 
                                alt="Your story"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <Plus size={32} color="white" strokeWidth={3} />
                        )}
                    </div>
                    <span style={{
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: '600'
                    }}>
                        {userStories.length > 0 ? 'Ma story' : 'Ajouter'}
                    </span>
                </button>

                {/* Stories des amis */}
                {stories.map((storyGroup) => (
                    <button
                        key={storyGroup.userId}
                        onClick={() => setSelectedStory(storyGroup)}
                        style={{
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img 
                                src={storyGroup.stories[0].mediaUrl} 
                                alt={storyGroup.userName || 'Story'}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #0f172a'
                                }}
                            />
                        </div>
                        <span style={{
                            fontSize: '12px',
                            color: 'white',
                            fontWeight: '600',
                            maxWidth: '64px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {storyGroup.userName || 'Ami'}
                        </span>
                    </button>
                ))}

                {/* Message informatif si pas de stories */}
                {!loading && stories.length === 0 && userStories.length === 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '16px',
                        color: '#94a3b8',
                        fontSize: '14px'
                    }}>
                        Les stories de vos amis apparaîtront ici
                    </div>
                )}
            </div>

            {/* Story Creator */}
            {showCreator && (
                <StoryCreator 
                    onClose={() => setShowCreator(false)} 
                    onCreated={handleStoryCreated}
                />
            )}

            {/* Story Viewer */}
            {selectedStory && (
                <StoryViewer
                    stories={selectedStory.stories}
                    userName={selectedStory.userName}
                    onClose={() => setSelectedStory(null)}
                />
            )}
        </>
    );
}

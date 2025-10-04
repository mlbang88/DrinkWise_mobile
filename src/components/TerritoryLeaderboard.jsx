import React, { useState, useRef, useEffect } from 'react';
import { X, Trophy, Crown, Medal, MapPin, Target } from 'lucide-react';

/**
 * TerritoryLeaderboard - Bottom sheet swipeable avec classement territorial
 */
const TerritoryLeaderboard = ({ leaderboard, userVenues = [], controlledZones, currentUserId, onClose }) => {
    const [sheetState, setSheetState] = useState('half'); // 'collapsed', 'half', 'full'
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const sheetRef = useRef(null);

    // Positions de la sheet selon l'état
    const positions = {
        collapsed: 'calc(100% - 80px)',
        half: 'calc(100% - 50vh)',
        full: '80px'
    };

    // Gestion du swipe
    const handleTouchStart = (e) => {
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;
        
        if (Math.abs(deltaY) < 50) return; // Seuil minimum

        if (deltaY > 0) {
            // Swipe down
            if (sheetState === 'full') setSheetState('half');
            else if (sheetState === 'half') setSheetState('collapsed');
        } else {
            // Swipe up
            if (sheetState === 'collapsed') setSheetState('half');
            else if (sheetState === 'half') setSheetState('full');
        }

        setStartY(0);
        setCurrentY(0);
    };

    // Trouver le rang de l'utilisateur actuel
    const currentUserRank = leaderboard.findIndex(user => user.userId === currentUserId) + 1;
    const currentUserData = leaderboard.find(user => user.userId === currentUserId);

    // Icône de médaille selon le rang
    const getRankIcon = (rank) => {
        switch(rank) {
            case 1:
                return <Crown size={20} style={{ color: '#FFD700' }} />;
            case 2:
                return <Medal size={20} style={{ color: '#C0C0C0' }} />;
            case 3:
                return <Medal size={20} style={{ color: '#CD7F32' }} />;
            default:
                return <span className="font-bold" style={{ color: '#9ca3af' }}>#{rank}</span>;
        }
    };

    return (
        <div
            ref={sheetRef}
            className="fixed left-0 right-0 rounded-t-3xl shadow-2xl transition-all duration-300 ease-out z-50"
            style={{
                top: positions[sheetState],
                backgroundColor: '#1f2937',
                borderTop: '2px solid rgba(139, 92, 246, 0.3)',
                maxHeight: '90vh'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
                <div 
                    className="w-12 h-1.5 rounded-full cursor-grab active:cursor-grabbing"
                    style={{ backgroundColor: '#4b5563' }}
                />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: '#374151' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Trophy size={24} style={{ color: '#8b5cf6' }} />
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                                Classement Local
                            </h2>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>
                                Top conquérants de la zone
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                        <X size={20} style={{ color: '#9ca3af' }} />
                    </button>
                </div>
            </div>

            {/* User Stats Summary (only when collapsed/half) */}
            {sheetState !== 'full' && currentUserData && (
                <div className="px-6 py-4 border-b" style={{ borderColor: '#374151', background: 'linear-gradient(to right, rgba(139, 92, 246, 0.1), transparent)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                                {currentUserData.avatar ? (
                                    <img src={currentUserData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold" style={{ color: '#ffffff' }}>
                                        {currentUserData.username?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="font-bold" style={{ color: '#ffffff' }}>
                                    {currentUserData.username || 'Vous'}
                                </p>
                                <p className="text-sm" style={{ color: '#9ca3af' }}>
                                    #{currentUserRank} • {currentUserData.totalPoints || 0} points
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <MapPin size={14} style={{ color: '#22c55e' }} />
                                <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                                    {userVenues.length} lieux
                                </span>
                            </div>
                            <div className="flex items-center gap-2 justify-end mt-1">
                                <Target size={14} style={{ color: '#8b5cf6' }} />
                                <span className="text-xs" style={{ color: '#8b5cf6' }}>
                                    {controlledZones.totalZones} zones
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scrollable Content */}
            <div 
                className="overflow-y-auto"
                style={{ 
                    maxHeight: sheetState === 'full' ? 'calc(90vh - 180px)' : sheetState === 'half' ? '300px' : '0px',
                    transition: 'max-height 0.3s ease-out'
                }}
            >
                {/* Zones Controlées */}
                {controlledZones.totalZones > 0 && sheetState === 'full' && (
                    <div className="px-6 py-4 border-b" style={{ borderColor: '#374151' }}>
                        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#ffffff' }}>
                            <Target size={18} style={{ color: '#8b5cf6' }} />
                            Zones Contrôlées
                        </h3>
                        
                        {controlledZones.streets.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs font-semibold mb-2" style={{ color: '#9ca3af' }}>RUES ({controlledZones.streets.length})</p>
                                <div className="space-y-2">
                                    {controlledZones.streets.map((street, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                                            <span className="text-sm" style={{ color: '#ffffff' }}>{street.name}</span>
                                            <span className="text-xs" style={{ color: '#8b5cf6' }}>
                                                {street.controlled}/{street.total} ({Math.round(street.percentage * 100)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {controlledZones.districts.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: '#9ca3af' }}>QUARTIERS ({controlledZones.districts.length})</p>
                                <div className="space-y-2">
                                    {controlledZones.districts.map((district, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                                            <span className="text-sm" style={{ color: '#ffffff' }}>{district.name}</span>
                                            <span className="text-xs" style={{ color: '#8b5cf6' }}>
                                                {district.controlled}/{district.total} lieux
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard List */}
                <div className="px-6 py-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#ffffff' }}>
                        <Trophy size={18} style={{ color: '#FFD700' }} />
                        Top Conquérants
                    </h3>
                    
                    <div className="space-y-3">
                        {leaderboard.map((user, index) => {
                            const rank = index + 1;
                            const isCurrentUser = user.userId === currentUserId;
                            
                            return (
                                <div
                                    key={user.userId}
                                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                                    style={{
                                        backgroundColor: isCurrentUser ? 'rgba(139, 92, 246, 0.2)' : 'rgba(31, 41, 55, 0.5)',
                                        border: isCurrentUser ? '2px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(75, 85, 99, 0.3)'
                                    }}
                                >
                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                                        {getRankIcon(rank)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: rank <= 3 ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#374151' }}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold" style={{ color: '#ffffff' }}>
                                                {user.username?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate" style={{ color: '#ffffff' }}>
                                            {user.username || 'Anonyme'}
                                            {isCurrentUser && <span style={{ color: '#8b5cf6' }}> (Vous)</span>}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                                                {user.venuesCount || 0} lieux
                                            </span>
                                            <span style={{ color: '#4b5563' }}>•</span>
                                            <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>
                                                {user.totalPoints || 0} pts
                                            </span>
                                        </div>
                                    </div>

                                    {/* Badge Top 3 */}
                                    {rank <= 3 && (
                                        <div className="flex-shrink-0">
                                            <div className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32', color: '#000000' }}>
                                                TOP {rank}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {leaderboard.length === 0 && (
                        <div className="text-center py-8">
                            <Trophy size={48} style={{ color: '#4b5563', margin: '0 auto' }} />
                            <p className="mt-3" style={{ color: '#9ca3af' }}>
                                Aucun conquérant dans cette zone
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TerritoryLeaderboard;

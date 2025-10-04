import { useState, useEffect } from 'react';
import { X, MapPin, Trophy, TrendingUp, Calendar, Users } from 'lucide-react';
import { getControlLevel } from '../services/venueService';

/**
 * VenueInfoWindow - Fenêtre d'information premium pour un lieu
 */
export default function VenueInfoWindow({ venue, onClose, leaderboard = [] }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  if (!venue) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const level = getControlLevel(venue.totalPoints);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center transition-all duration-300"
      onClick={handleClose} 
      style={{ 
        backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
        backdropFilter: isVisible ? 'blur(8px)' : 'none'
      }}
    >
      <div 
        className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#0a0f1e',
          border: '2px solid rgba(139, 92, 246, 0.4)',
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(100%) scale(0.95)',
          opacity: isVisible ? 1 : 0,
          boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 100px rgba(139, 92, 246, 0.15)'
        }}
      >
        {/* Header */}
        <div 
          className="p-6"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #5b21b6 100%)',
            borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div style={{
                  padding: '8px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <MapPin className="w-5 h-5" style={{ color: '#fff' }} />
                </div>
                <h3 style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                }}>
                  {venue.name}
                </h3>
              </div>
              <p style={{ 
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.85)',
                paddingLeft: '56px'
              }}>
                {venue.address}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                padding: '10px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9) rotate(90deg)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <X className="w-5 h-5" style={{ color: '#fff' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
          
          {/* Stats */}
          <div style={{ padding: '24px', borderBottom: '2px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05))',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <Trophy className="w-5 h-5" style={{ color: '#fbbf24' }} />
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Niveau de contrôle</span>
              </div>
              <div style={{
                padding: '8px 20px',
                borderRadius: '20px',
                backgroundColor: level.key === 'gold' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                color: level.key === 'gold' ? '#fbbf24' : '#8b5cf6',
                border: `2px solid ${level.key === 'gold' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                ⚔️ {level.name}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { icon: TrendingUp, value: venue.totalPoints, label: 'Points', color: '#8b5cf6' },
                { icon: Calendar, value: venue.visitCount || 0, label: 'Visites', color: '#3b82f6' },
                { icon: null, value: venue.visitStreak || 0, label: 'Série', color: '#22c55e' }
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}08)`,
                  border: `2px solid ${stat.color}40`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto 8px',
                    borderRadius: '50%',
                    background: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {stat.icon ? <stat.icon className="w-5 h-5" style={{ color: '#fff' }} /> : 
                      <svg className="w-5 h-5" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    }
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                padding: '10px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <Users className="w-5 h-5" style={{ color: '#8b5cf6' }} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Top Conquérants</h4>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{
                padding: '40px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(109, 40, 217, 0.03))',
                border: '2px dashed rgba(139, 92, 246, 0.2)',
                textAlign: 'center'
              }}>
                <Trophy style={{ width: '80px', height: '80px', margin: '0 auto 16px', opacity: 0.3, color: '#8b5cf6' }} />
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '8px' }}>🎉 Premier conquérant !</p>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Défendez votre territoire</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaderboard.slice(0, 5).map((ctrl, i) => {
                  const ctrlLevel = getControlLevel(ctrl.totalPoints);
                  const isYou = ctrl.userId === venue.userId;
                  return (
                    <div key={ctrl.userId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      borderRadius: '16px',
                      background: isYou ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.1))' : 'rgba(30, 41, 59, 0.4)',
                      border: isYou ? '2px solid rgba(139, 92, 246, 0.5)' : '2px solid rgba(148, 163, 184, 0.15)',
                      boxShadow: isYou ? '0 8px 24px rgba(139, 92, 246, 0.3)' : 'none'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: i < 3 ? (i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : '#fb923c') : '#475569',
                        color: i < 3 ? '#000' : '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        position: 'relative'
                      }}>
                        {i === 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px' }}>👑</span>}
                        {i + 1}
                      </div>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: isYou ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        border: '3px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        {ctrl.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: isYou ? '#e9d5ff' : '#fff' }}>{ctrl.username}</span>
                          {isYou && <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>VOUS</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: ctrlLevel.key === 'gold' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                            color: ctrlLevel.key === 'gold' ? '#fbbf24' : '#8b5cf6',
                            marginRight: '8px'
                          }}>{ctrlLevel.name}</span>
                          • {ctrl.visitCount || 0} visites
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>{ctrl.totalPoints}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {venue.controlledSince && (
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(109, 40, 217, 0.05))',
                border: '2px solid rgba(139, 92, 246, 0.2)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: '#a78bfa' }}>
                  ⚔️ Conquis le <span style={{ fontWeight: 'bold', color: '#e9d5ff' }}>
                    {new Date(venue.controlledSince.seconds * 1000).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

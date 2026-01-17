import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MapPin, Users, Trophy, Calendar } from 'lucide-react';
import { useGesture } from '@use-gesture/react';

const InstagramPost = ({ 
  post, 
  user,
  onLike, 
  onComment,
  onAddComment, 
  onDoubleTapLike,
  isLiked,
  likesCount,
  commentsCount,
  timestamp,
  showHeartAnimation,
  isCommentsOpen = false
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Swipe gesture for multiple photos
  const bind = useGesture({
    onDoubleClick: () => {
      if (onDoubleTapLike) {
        onDoubleTapLike();
      }
    },
    onDrag: ({ movement: [mx], direction: [xDir], cancel, last }) => {
      const swipeDistance = Math.abs(mx);
      if (last && swipeDistance > 50 && post.photoURLs && post.photoURLs.length > 1) {
        // xDir > 0 = swipe RIGHT (show previous photo)
        // xDir < 0 = swipe LEFT (show next photo)
        if (mx > 50 && currentPhotoIndex > 0) {
          console.log('⬅️ Swipe RIGHT - Previous photo');
          setCurrentPhotoIndex(prev => prev - 1);
          cancel();
        } else if (mx < -50 && currentPhotoIndex < post.photoURLs.length - 1) {
          console.log('➡️ Swipe LEFT - Next photo');
          setCurrentPhotoIndex(prev => prev + 1);
          cancel();
        }
      }
    }
  });

  const formatTimestamp = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#000',
        marginBottom: 0,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #bf00ff, #ff00ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            border: '2px solid rgba(191, 0, 255, 0.3)',
            overflow: 'hidden'
          }}>
            {user?.profilePhoto ? (
              <img 
                src={user.profilePhoto} 
                alt={user.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              (typeof user?.username === 'string' ? user.username : '?')[0]?.toUpperCase() || '?'
            )}
          </div>

          {/* Username */}
          <div style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {typeof user?.username === 'string' ? user.username : 'Utilisateur'}
          </div>
        </div>
      </div>

      {/* Localisation au-dessus de l'image */}
      {post.locationName && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MapPin size={14} color="#bf00ff" />
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
            {post.locationName}
          </span>
        </div>
      )}

      {/* Media Content */}
      <div 
        {...bind()} 
        style={{ 
          position: 'relative', 
          width: '100%',
          aspectRatio: (post.photoURLs && post.photoURLs.length > 0) || post.photoURL ? '1 / 1' : 'auto',
          touchAction: 'none',
          minHeight: (post.photoURLs && post.photoURLs.length > 0) || post.photoURL ? 'auto' : '200px',
          background: '#000',
          overflow: 'hidden'
        }}
      >
        {post.photoURLs && post.photoURLs.length > 0 ? (
          <motion.img
            key={currentPhotoIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={post.photoURLs[currentPhotoIndex]}
            alt="Post"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : post.photoURL ? (
          <img
            src={post.photoURL}
            alt="Post"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.15), rgba(0, 255, 255, 0.15))'
          }}>
            {/* Stats dans le cadre quand pas de photo */}
            {typeof post.totalDrinks === 'number' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 8px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ fontSize: '32px' }}>🍺</span>
                <span style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>
                  {post.totalDrinks}
                </span>
                <span style={{ color: '#a0a0a0', fontSize: '11px', textAlign: 'center' }}>
                  verres
                </span>
              </div>
            )}
            {typeof post.girlsTalkedTo === 'number' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 8px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ fontSize: '32px' }}>💬</span>
                <span style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>
                  {post.girlsTalkedTo}
                </span>
                <span style={{ color: '#a0a0a0', fontSize: '11px', textAlign: 'center' }}>
                  rencontres
                </span>
              </div>
            )}
            {typeof post.xpGained === 'number' && post.xpGained > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 8px',
                background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.3), rgba(139, 0, 255, 0.3))',
                borderRadius: '16px',
                border: '1px solid rgba(191, 0, 255, 0.5)'
              }}>
                <span style={{ fontSize: '32px' }}>⚡</span>
                <span style={{ 
                  color: '#bf00ff', 
                  fontSize: '24px', 
                  fontWeight: '700',
                  textShadow: '0 0 10px rgba(191, 0, 255, 0.5)'
                }}>
                  +{post.xpGained}
                </span>
                <span style={{ color: '#bf00ff', fontSize: '11px', fontWeight: '600' }}>
                  XP
                </span>
              </div>
            )}
            {/* Stats supplémentaires en colonnes de 2 */}
            {post.summary && (
              <div style={{
                gridColumn: 'span 3',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ color: '#fff', fontSize: '13px', textAlign: 'center', lineHeight: '1.4' }}>
                  {post.summary}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Multiple photos indicator */}
        {post.photoURLs && post.photoURLs.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {currentPhotoIndex + 1}/{post.photoURLs.length}
          </div>
        )}

        {/* Badges */}
        {post.badges && post.badges.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap'
          }}>
            {post.badges.slice(0, 3).map((badge, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  padding: '6px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 215, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trophy size={12} color="#ffd700" />
                <span style={{ color: '#ffd700', fontSize: '11px', fontWeight: '600' }}>
                  {badge}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Heart animation on double tap */}
        {showHeartAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.3, 1], opacity: [1, 1, 0] }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '140px',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 30px rgba(255, 0, 128, 1))',
              zIndex: 10
            }}
          >
            ❤️
          </motion.div>
        )}
      </div>

      {/* Companions juste en dessous de l'image */}
      {(post.companions && post.companions.length > 0) || post.companionsType === 'group' || post.companionsType === 'groups' ? (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <Users size={14} color="#bf00ff" />
          {(post.companionsType === 'group' || post.companionsType === 'groups') ? (
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
              {post.groupName || 'En groupe'}
            </span>
          ) : post.companionsType === 'none' ? (
            <span style={{ color: '#a0a0a0', fontSize: '12px', fontStyle: 'italic' }}>
              Seul(e)
            </span>
          ) : (
            <>
              <span style={{ color: '#a0a0a0', fontSize: '12px' }}>Avec:</span>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                {post.companions.join(', ')}
              </span>
            </>
          )}
        </div>
      ) : null}

      {/* Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onLike}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Heart 
              size={24} 
              fill={isLiked ? '#ff0080' : 'none'}
              color={isLiked ? '#ff0080' : '#fff'}
              style={{
                filter: isLiked ? 'drop-shadow(0 0 8px rgba(255, 0, 128, 0.6))' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
            {typeof likesCount === 'number' && likesCount > 0 && (
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                {likesCount}
              </span>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (onComment) onComment();
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MessageCircle 
              size={24} 
              color={isCommentsOpen ? '#bf00ff' : '#fff'}
              fill={isCommentsOpen ? '#bf00ff' : 'none'}
            />
            {typeof commentsCount === 'number' && commentsCount > 0 && (
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                {commentsCount}
              </span>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <Share2 size={22} color="#fff" />
          </motion.button>
        </div>
      </div>

      {/* Stats Section - Seulement si photo présente */}
      {((post.photoURLs && post.photoURLs.length > 0) || post.photoURL) && (
        <div style={{
          padding: '16px',
          background: 'rgba(191, 0, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '12px',
            marginBottom: post.companions && post.companions.length > 0 ? '16px' : '0'
          }}>
          {typeof post.totalDrinks === 'number' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>🍺</span>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                {post.totalDrinks}
              </span>
              <span style={{ color: '#a0a0a0', fontSize: '11px' }}>
                verres
              </span>
            </div>
          )}
          {typeof post.girlsTalkedTo === 'number' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>💬</span>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                {post.girlsTalkedTo}
              </span>
              <span style={{ color: '#a0a0a0', fontSize: '11px' }}>
                rencontres
              </span>
            </div>
          )}
          {typeof post.xpGained === 'number' && post.xpGained > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              background: 'linear-gradient(135deg, rgba(191, 0, 255, 0.2), rgba(139, 0, 255, 0.2))',
              borderRadius: '12px',
              border: '1px solid rgba(191, 0, 255, 0.3)'
            }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <span style={{ 
                color: '#bf00ff', 
                fontSize: '18px', 
                fontWeight: '700',
                textShadow: '0 0 10px rgba(191, 0, 255, 0.5)'
              }}>
                +{post.xpGained}
              </span>
              <span style={{ color: '#bf00ff', fontSize: '11px', fontWeight: '600' }}>
                XP
              </span>
            </div>
          )}
        </div>

          {/* Badges */}
          {post.badges && post.badges.length > 0 && (
            <div style={{
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              marginTop: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Trophy size={16} color="#ffd700" />
                <span style={{ color: '#a0a0a0', fontSize: '12px', fontWeight: '600' }}>
                  Badges débloqués:
                </span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {post.badges.map((badge, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2))',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 215, 0, 0.3)'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{badge.icon || '🏆'}</span>
                    <span style={{ color: '#ffd700', fontSize: '12px', fontWeight: '600' }}>
                      {badge.name || badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      <div style={{
        padding: '12px 16px',
        borderBottom: isCommentsOpen ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
      }}>
        <div style={{
          color: '#fff',
          fontSize: '14px',
          lineHeight: '20px'
        }}>
          <span style={{ fontWeight: '600', marginRight: '8px', color: '#bf00ff' }}>
            {typeof user?.username === 'string' ? user.username : 'Utilisateur'}
          </span>
          <span>
            {(() => {
              if (typeof post.summary === 'string' && post.summary) {
                return post.summary;
              }
              return '🎉 Soirée mémorable !';
            })()}
          </span>
        </div>
        
        {/* Timestamp */}
        <div style={{
          marginTop: '8px',
          color: '#666',
          fontSize: '10px'
        }}>
          {formatTimestamp(timestamp)}
        </div>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {post.comments && post.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {post.comments.map((comment, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #bf00ff, #ff00ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {(comment.username || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#bf00ff', fontSize: '12px', fontWeight: '600' }}>
                      {comment.username || 'Utilisateur'}
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px', marginTop: '2px' }}>
                      {comment.text || comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              color: '#a0a0a0',
              fontSize: '13px',
              textAlign: 'center',
              padding: '12px 0',
              marginBottom: '16px'
            }}>
              Soyez le premier à commenter
            </div>
          )}
          
          {/* Input pour écrire un commentaire */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <input
              type="text"
              placeholder="Ajouter un commentaire..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '14px',
                padding: '4px 8px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim() && onAddComment) {
                  onAddComment(commentText);
                  setCommentText('');
                }
              }}
            />
            <button
              style={{
                background: commentText.trim() ? 'linear-gradient(135deg, #bf00ff, #8b00ff)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                color: '#fff',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                if (commentText.trim() && onAddComment) {
                  onAddComment(commentText);
                  setCommentText('');
                }
              }}
            >
              ➤
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
};

export default InstagramPost;

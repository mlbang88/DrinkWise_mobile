import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkeletonPost - Placeholder animé pour posts de feed
 * Utilisé pendant le chargement pour améliorer la perception de performance
 */
const SkeletonPost = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="skeleton-post"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header - Avatar + Username */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div 
          className="skeleton-avatar"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            marginRight: '12px'
          }}
        />
        <div style={{ flex: 1 }}>
          <div 
            className="skeleton-line"
            style={{
              width: '120px',
              height: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              marginBottom: '6px'
            }}
          />
          <div 
            className="skeleton-line"
            style={{
              width: '80px',
              height: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Image principale */}
      <div 
        className="skeleton-image"
        style={{
          width: '100%',
          height: '300px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          marginBottom: '12px'
        }}
      />

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <div 
          className="skeleton-button"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
        <div 
          className="skeleton-button"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
        <div 
          className="skeleton-button"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
      </div>

      {/* Likes count */}
      <div 
        className="skeleton-line"
        style={{
          width: '100px',
          height: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          marginBottom: '8px'
        }}
      />

      {/* Caption */}
      <div 
        className="skeleton-line"
        style={{
          width: '90%',
          height: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '4px',
          marginBottom: '4px'
        }}
      />
      <div 
        className="skeleton-line"
        style={{
          width: '60%',
          height: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '4px'
        }}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .skeleton-post .skeleton-avatar,
        .skeleton-post .skeleton-line,
        .skeleton-post .skeleton-image,
        .skeleton-post .skeleton-button {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default SkeletonPost;

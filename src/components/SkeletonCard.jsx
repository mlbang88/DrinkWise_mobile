import React from 'react';
import '../styles/SkeletonCard.css';

export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-avatar shimmer" />
            <div className="skeleton-name-group">
              <div className="skeleton-name shimmer" />
              <div className="skeleton-time shimmer" />
            </div>
          </div>
          <div className="skeleton-content shimmer" />
          <div className="skeleton-image shimmer" />
          <div className="skeleton-footer">
            <div className="skeleton-button shimmer" />
            <div className="skeleton-button shimmer" />
            <div className="skeleton-button shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-icon shimmer" />
          <div className="skeleton-text-group">
            <div className="skeleton-text shimmer" />
            <div className="skeleton-text-small shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonProfile = () => {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-profile-header">
        <div className="skeleton-avatar-large shimmer" />
        <div className="skeleton-stats">
          <div className="skeleton-stat shimmer" />
          <div className="skeleton-stat shimmer" />
          <div className="skeleton-stat shimmer" />
        </div>
      </div>
      <div className="skeleton-bio shimmer" />
      <div className="skeleton-bio-short shimmer" />
    </div>
  );
};

export default SkeletonCard;

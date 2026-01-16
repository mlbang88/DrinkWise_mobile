import React from 'react';
import PropTypes from 'prop-types';

/**
 * Modern Header Component
 * Header moderne avec logo animé et statistiques rapides
 */
const ModernHeader = ({ username, level, streak }) => {
  return (
    <header className="modern-header">
      {/* Gradient Background */}
      <div className="header-gradient" />
      
      {/* Content */}
      <div className="header-content">
        {/* Logo avec animation */}
        <div className="header-logo">
          <div className="logo-icon">🍻</div>
          <span className="logo-text">DrinkWise</span>
        </div>
        
        {/* User Info */}
        <div className="header-user">
          <span className="caption">Bienvenue</span>
          <span className="heading-2">{username}</span>
        </div>
        
        {/* Quick Stats */}
        <div className="header-stats">
          <StatBadge icon="🏆" value={level || 1} label="Niveau" />
          <StatBadge icon="🔥" value={streak || 0} label="Série" />
        </div>
      </div>
    </header>
  );
};

/**
 * Stat Badge Component (sous-composant)
 */
const StatBadge = ({ icon, value, label }) => {
  return (
    <div className="stat-badge">
      <div className="stat-badge-icon">{icon}</div>
      <div className="stat-badge-content">
        <div className="stat-badge-value">{value}</div>
        <div className="stat-badge-label">{label}</div>
      </div>
    </div>
  );
};

StatBadge.propTypes = {
  icon: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired
};

ModernHeader.propTypes = {
  username: PropTypes.string.isRequired,
  level: PropTypes.number,
  streak: PropTypes.number
};

ModernHeader.defaultProps = {
  level: 1,
  streak: 0
};

export default ModernHeader;

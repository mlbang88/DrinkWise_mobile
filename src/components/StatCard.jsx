import React from 'react';
import PropTypes from 'prop-types';

/**
 * StatCard Component
 * Carte de statistique moderne avec icône et accent coloré
 */
const StatCard = ({ icon, label, value, accent = 'primary', onClick, 'aria-label': ariaLabel }) => {
  return (
    <div 
      className={`stat-card stat-card-${accent}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : 'article'}
      aria-label={ariaLabel || `${label}: ${value}`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
    >
      <div className="stat-card-icon" aria-hidden="true">{icon}</div>
      <div className="stat-card-value">{value !== null && value !== undefined ? value : 0}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.element]),
  accent: PropTypes.oneOf(['primary', 'success', 'warning', 'info']),
  onClick: PropTypes.func,
  'aria-label': PropTypes.string
};

StatCard.defaultProps = {
  value: 0,
  accent: 'primary',
  onClick: null
};

export default StatCard;

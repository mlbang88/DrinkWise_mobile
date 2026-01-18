import React from 'react';
import { Home, Users, Trophy, User, Rss } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/BottomNav.css';

const BottomNav = ({ currentPage, onNavigate }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Accueil', navigateTo: 'home' },
    { id: 'feed', icon: Rss, label: 'Feed', badge: null, navigateTo: 'feed' },
    { id: 'battle', icon: Trophy, label: 'Battles', navigateTo: 'battle' },
    { id: 'friends', icon: Users, label: 'Amis', navigateTo: 'friends' },
    { id: 'profile', icon: User, label: 'Profil', navigateTo: 'profile' }
  ];

  const handleTabClick = (tab) => {
    onNavigate(tab.navigateTo);
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navigation principale">
      <div className="bottom-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.navigateTo;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`bottom-nav-tab ${isActive ? 'active' : ''} ${tab.highlight ? 'highlight' : ''}`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="tab-icon-wrapper">
                <Icon 
                  size={24} 
                  className={`tab-icon ${isActive ? 'active' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="tab-badge" aria-label={`${tab.badge} notifications`}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`tab-label ${isActive ? 'active' : ''}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

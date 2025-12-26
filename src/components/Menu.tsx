import React, { useState, useEffect } from 'react';
import './Menu.css';
import { Striker } from './Striker';

interface MenuProps {
  onStartGame: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStartGame }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="menu-container">
      <div className="particles-bg"></div>

      <div className="menu-content">
        <div className="icon-wrapper">
          <Striker />
          <div className="pulse-ring"></div>
          <div className="pulse-ring delayed"></div>
        </div>
        
        <h1 className="menu-title">
          <span className="text-gradient">Carrom</span>
          <span className="text-white"> Master</span>
        </h1>
        
        <p className="menu-subtitle">Play & Enjoy</p>

        <div className="action-area">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-bar"></div>
              <p className="loading-text">Loading Assets...</p>
            </div>
          ) : (
            <div className="button-container fade-in-up">
              <button className="start-btn" onClick={onStartGame}>
                Start Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
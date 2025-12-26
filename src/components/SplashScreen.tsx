import React from 'react';
import './SplashScreen.css';

export const SplashScreen: React.FC = () => {
  return (
    <div className="splash-container">
      <div className="splash-content">
        <h1 className="splash-title">
          <span className="text-gradient">Carrom</span>
          <span className="text-white"> Master</span>
        </h1>
        
        <p className="splash-subtitle">Play & Earn NFTs</p>

        <div className="loading-container">
          <div className="loading-bar"></div>
        </div>
      </div>
    </div>
  );
};
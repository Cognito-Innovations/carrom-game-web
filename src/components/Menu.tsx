import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import './Menu.css';

interface MenuProps {
  onStartGame: () => void;
  isWalletConnected: boolean;
}

export const Menu: React.FC<MenuProps> = ({ onStartGame, isWalletConnected }) => {
  return (
    <div className="menu-container">
      <header className="menu-header">
        <h1 className="menu-title">Play Carrom & Earn NFTs</h1>
        <div className="wallet-section">
          <TonConnectButton className="connect-btn" />
        </div>
      </header>
      
      <main className="menu-main">
        <div className="game-icon">
          <span>🎱</span>
        </div>
        
        <button 
          className={`start-btn ${!isWalletConnected ? 'disabled' : ''}`} 
          onClick={onStartGame} 
          disabled={!isWalletConnected}
        >
          Start Game
        </button>
        
        {!isWalletConnected && (
          <p className="connect-message">
            Connect your TON wallet to play and earn NFTs!
          </p>
        )}
      </main>
    </div>
  );
};
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import ReactGA from "react-ga4";
import './Menu.css';

interface MenuProps {
  onStartGame: () => void;
  isLoggedIn: boolean;
  onLoginSuccess: (user: any) => void;
}

export const Menu: React.FC<MenuProps> = ({ onStartGame, isLoggedIn, onLoginSuccess }) => {
  const handleStartClick = () => {
    ReactGA.event("start_game", {
      method: "menu_button",
    });
    onStartGame();
  };

  return (
    <div className="menu-container">
      <header className="menu-header">
        <h1 className="menu-title">Play Carrom & Earn NFTs</h1>
        <div className="wallet-section">
          <div className="connect-btn">
            <GoogleLogin
              theme="filled_blue"
              size="large"
              shape="pill"
              text="signin_with"
              logo_alignment="left"
              onSuccess={(response) => {
                if (response.credential) {
                  const user = jwtDecode(response.credential);
                  onLoginSuccess(user);
                }
              }}
              onError={() => console.log('Login Failed')}
            />
          </div>
        </div>
      </header>
      
      <main className="menu-main">
        <div className="game-icon">
          <span>🎱</span>
        </div>
        
        <button 
          className={`start-btn ${!isLoggedIn ? 'disabled' : ''}`} 
          onClick={handleStartClick} 
          disabled={!isLoggedIn}
        >
          Start Game
        </button>
        
        {!isLoggedIn && (
          <p className="connect-message">
            Login with Google to play and earn NFTs!
          </p>
        )}
      </main>
    </div>
  );
};
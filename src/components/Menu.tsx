import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { trackStartGame, trackMetaEvent, trackUsers } from '../utils/analytics';
import './Menu.css';

interface MenuProps {
  onStartGame: () => void;
  isLoggedIn: boolean;
  onLoginSuccess: (user: any) => void;
}

export const Menu: React.FC<MenuProps> = ({
  onStartGame,
  isLoggedIn,
  onLoginSuccess,
}) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      trackStartGame('google_login');
      trackMetaEvent('LoginButtonClick', { method: 'google_login' });

      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      })
        .then((res) => res.json())
        .then((user) => {
          onLoginSuccess({
            ...user,
            access_token: tokenResponse.access_token,
          });
          trackUsers(user?.email);
        });
    },
    onError: () => console.log('Login Failed'),
  });

  const handleClick = () => {
    trackStartGame('menu_button');
    trackMetaEvent('LoginButtonClick', { method: 'menu_button' });

    if (isLoggedIn) {
      onStartGame();
    } else {
      login();
    }
  };

  return (
    <div className="menu-container">
      <header className="menu-header">
        <h1 className="menu-title">Play Carrom & Earn NFTs</h1>
      </header>
      
      <main className="menu-main">
        <div className="game-icon">
          <span>🎱</span>
        </div>
        
        <button 
          className="start-btn"
          onClick={handleClick}
        >
          {isLoggedIn ? 'Start Game' : 'Sign in to Play'}
        </button>
      </main>
    </div>
  );
};
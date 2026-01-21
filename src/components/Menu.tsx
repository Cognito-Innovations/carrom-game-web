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
      <main className="menu-main">
        <div className="title-section">
          <h1 className="menu-title">MASTER <span className="title-highlight">THE BOARD</span></h1>
          <p className="menu-subtitle">Think you're good at board games?</p>
        </div>

        <div className="voucher-image-section">
          <img 
            src="/voucher-image.png" 
            alt="Amazon Gift Voucher" 
            className="voucher-image"
          />
          <h2 className="voucher-title">WIN EXCITING PRIZES</h2>
        </div>

        <div className="brand-section">
          <div className="brand-logos">
            <div className="brand-logo amazon-logo">
              <span className="logo-text">Amazon</span>
            </div>
            <div className="brand-logo flipkart-logo">
              <span className="logo-text">Flipkart</span>
            </div>
          </div>
          <p className="brand-tagline">Play • Win • Redeem</p>
          
          <button className="start-btn" onClick={handleClick}>
            {isLoggedIn ? 'Start Game' : 'SIGN IN TO PLAY'}
          </button>
        </div>
      </main>
    </div>
  );
};
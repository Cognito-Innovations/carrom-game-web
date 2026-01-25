import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { trackStartGame, trackMetaEvent, trackUsers } from '../utils/analytics';
import { FIREBASE_DB_API } from '../utils/googleSheets';
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
  const [stats, setStats] = useState({ activePlayers: 0, totalGiftsWon: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Get current IST time
  const getISTTime = () => {
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const istTime = new Date(utcTime + istOffset);
    return istTime;
  };

  // Get time-based multiplier for player count
  const getTimeBasedMultiplier = () => {
    const istTime = getISTTime();
    const hour = istTime.getHours();

    // Morning: 6 AM - 12 PM (lower activity)
    if (hour >= 6 && hour < 12) {
      return 0.5 + Math.random() * 0.2; // 0.5 to 0.7
    }
    // Afternoon: 12 PM - 5 PM (moderate activity)
    else if (hour >= 12 && hour < 17) {
      return 0.7 + Math.random() * 0.2; // 0.7 to 0.9
    }
    // Evening: 5 PM - 10 PM (high activity)
    else if (hour >= 17 && hour < 22) {
      return 1.2 + Math.random() * 0.3; // 1.2 to 1.5
    }
    // Night: 10 PM - 2 AM (very high activity)
    else if (hour >= 22 || hour < 2) {
      return 1.3 + Math.random() * 0.5; // 1.3 to 1.8
    }
    // Late Night/Early Morning: 2 AM - 6 AM (low activity)
    else {
      return 0.3 + Math.random() * 0.2; // 0.3 to 0.5
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      const basePlayerCount = 120; // Base number for calculations
      const multiplier = getTimeBasedMultiplier();
      const timeAdjustedCount = Math.floor(basePlayerCount * multiplier);

      if (!FIREBASE_DB_API) {
        // Use time-based fallback values if API is not configured
        setStats({ activePlayers: timeAdjustedCount, totalGiftsWon: 23 });
        setStatsLoaded(true);
        return;
      }

      try {
        // Fetch all players data
        const playersResponse = await fetch(`${FIREBASE_DB_API}/carrom.json`);
        const playersData = await playersResponse.json();
        
        if (!playersData) {
          setStats({ activePlayers: timeAdjustedCount, totalGiftsWon: 23 });
          setStatsLoaded(true);
          return;
        }

        // Count active players (users who played in last 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const activePlayers = Object.keys(playersData).filter(key => {
          const timestamp = parseInt(key);
          return timestamp >= oneDayAgo;
        }).length;

        // Apply time-based multiplier to actual data
        const adjustedPlayers = activePlayers > 0 
          ? Math.floor(activePlayers * multiplier)
          : timeAdjustedCount;

        // Count unique emails for total players estimate
        const uniqueEmails = new Set(
          Object.values(playersData)
            .map((p: any) => p.email)
            .filter(Boolean)
        ).size;

        // Estimate total gifts won (assuming ~15% win rate)
        const totalGiftsWon = Math.max(23, Math.floor(uniqueEmails * 0.15));

        setStats({
          activePlayers: adjustedPlayers,
          totalGiftsWon: totalGiftsWon || 23,
        });
        setStatsLoaded(true);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Use time-based fallback values on error
        setStats({ activePlayers: timeAdjustedCount, totalGiftsWon: 23 });
        setStatsLoaded(true);
      }
    };

    fetchStats();

    // Update stats every 5 minutes to reflect time changes
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
        {statsLoaded && (
          <div className="stats-section">
            <div className="stat-item stat-item-playing">
              <div className="stat-value-wrapper">
                <span className="live-dot"></span>
                <span className="stat-value">{stats.activePlayers}</span>
              </div>
              <span className="stat-label">Playing Now</span>
            </div>
          </div>
        )}
        <div className="title-section">
          <h1 className="menu-title text-center">MASTER THE BOARD</h1>
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
          <p className="brand-tagline">Play • Enjoy • Redeem</p>
          
          <button className="start-btn" onClick={handleClick}>
            {isLoggedIn ? 'Start Game' : 'PLAY NOW'}
          </button>
        </div>
      </main>
    </div>
  );
};
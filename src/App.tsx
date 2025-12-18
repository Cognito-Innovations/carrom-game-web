import React, { useEffect } from 'react';
import telegramAnalytics from '@telegram-apps/analytics';
import { Game } from './components/Game';
import './App.css';

function App() {
  useEffect(() => {
    const analyticsToken = import.meta.env.VITE_ANALYTICS_TOKEN;
    const analyticsAppName = import.meta.env.VITE_ANALYTICS_APP_NAME;

    if (!analyticsToken || !analyticsAppName) {
      console.warn('Analytics SDK: Missing token or appName—check env vars.');
      return;
    }

    telegramAnalytics.init({
      token: analyticsToken,
      appName: analyticsAppName,
    });

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
      tg.onEvent('themeChanged', () => {
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
      });
      console.log('User:', tg.initDataUnsafe?.user);
    }
  }, []);

  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;


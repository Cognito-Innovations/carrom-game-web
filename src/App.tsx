import React, { useEffect, useState } from 'react';
import telegramAnalytics from '@telegram-apps/analytics';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Game } from './components/Game';
import './App.css';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}

function App() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user as TelegramUser);
      } else {
        console.warn('No Telegram user found');
      }

      const analyticsToken = import.meta.env.VITE_ANALYTICS_TOKEN;
      const analyticsAppName = import.meta.env.VITE_ANALYTICS_APP_NAME;

      if (analyticsToken && analyticsAppName) {
        try {
          telegramAnalytics.init({
            token: analyticsToken,
            appName: analyticsAppName,
          });
          console.log("Analytics initialized successfully");
        } catch (error) {
          console.error("Analytics failed to init (Non-fatal):", error);
        }
      }

      document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
      tg.onEvent('themeChanged', () => {
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
      });

    } else {
      console.warn("Window.Telegram.WebApp is undefined");
    }
  }, []);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const manifestUrl = `${BASE_URL}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <div className="App">
        <Game telegramUser={telegramUser}/>
      </div>
    </TonConnectUIProvider>
  );
}

export default App;

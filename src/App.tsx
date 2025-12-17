import React, { useEffect } from 'react';
import { Game } from './components/Game';
import './App.css';

function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, []);

  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;


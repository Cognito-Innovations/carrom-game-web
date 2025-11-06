import React, { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { Game } from './components/Game';
import './App.css';

function App() {
  useEffect(() => {
    (async () => {
      await sdk.actions.ready();
    })();
  }, []);
  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;


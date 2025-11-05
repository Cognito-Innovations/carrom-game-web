import React, { useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { Game } from './components/Game';
import './App.css';

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;


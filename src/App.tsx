import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Game } from './components/Game';
import './App.css';

function App() {
  const [googleUser, setGoogleUser] = useState<any | null>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="App">
        <Game googleUser={googleUser} setGoogleUser={setGoogleUser}/>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;

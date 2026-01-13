import React, { useEffect, useState } from 'react';
import { Board } from '../game/Board';
import { Menu } from './Menu';
import { CarromBoard } from './CarromBoard';
import { GameOver } from './GameOver';
import './Game.css';
import './GameOver.css';

interface GameProps {
  googleUser: any;
  setGoogleUser: (user: any) => void;
}

export const Game: React.FC<GameProps> = ({ googleUser, setGoogleUser }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentTurn, setCurrentTurn] = useState('bottom');
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState({ p1: 0, p2: 0, p1Pieces: 0, p2Pieces: 0 });

  const isLoggedIn = !!googleUser;

  useEffect(() => {
    // Initialize board with temporary canvas for initial setup
    const canvas = document.createElement('canvas');
    canvas.width = 550;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 550;
    backCanvas.height = 550;
    const backCtx = backCanvas.getContext('2d');

    if (ctx && backCtx) {
      const gameBoard = new Board(ctx, canvas);
      gameBoard.init();
      gameBoard.draw(backCtx);
      gameBoard.arrangeGattis();
      setBoard(gameBoard);
    }
  }, []);

  const handleStartGame = () => {
    if (!isLoggedIn) {
      window.alert('Please login with Google first!');
      return;
    }

    if (board) {
      // Reset the board for new game
      const canvas = document.createElement('canvas');
      canvas.width = 550;
      canvas.height = 550;
      const ctx = canvas.getContext('2d');

      const backCanvas = document.createElement('canvas');
      backCanvas.width = 550;
      backCanvas.height = 550;
      const backCtx = backCanvas.getContext('2d');

      if (ctx && backCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        backCtx.clearRect(0, 0, canvas.width, canvas.height);

        board.init();
        board.draw(backCtx);
        board.arrangeGattis();
        setGameStarted(true);
      }
    }  
  };

  const handleScoreUpdate = (p1Score: number, p2Score: number) => {
    setPlayer1Score(p1Score);
    setPlayer2Score(p2Score);
  };

  const handleTurnChange = (turn: string) => {
    setCurrentTurn(turn);
  };

  const handleGameOver = (p1Score: number, p2Score: number, p1Pieces: number, p2Pieces: number) => {
    setFinalScores({ p1: p1Score, p2: p2Score, p1Pieces, p2Pieces });
    setGameOver(true);
  };

  const handleRestart = () => {
    if (board) {
      const canvas = document.createElement('canvas');
      canvas.width = 550;
      canvas.height = 550;
      const ctx = canvas.getContext('2d');
      const backCanvas = document.createElement('canvas');
      backCanvas.width = 550;
      backCanvas.height = 550;
      const backCtx = backCanvas.getContext('2d');

      if (ctx && backCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        backCtx.clearRect(0, 0, canvas.width, canvas.height);

        board.init();
        board.draw(backCtx);
        board.arrangeGattis();
        setGameOver(false);
        setGameStarted(true);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 32 && !gameStarted) {
        handleStartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted]);

  if (!board) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="game-container">
      {/* TODO: Uncomment to go directly to win for debugging */}
      {/* {gameStarted && !gameOver && (
        <button 
          onClick={() => handleGameOver(100, 0, 9, 0)} 
          style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          DEBUG: Win Now 🏆
        </button>
      )} */}

      {!gameStarted && (
        <Menu
          onStartGame={handleStartGame}
          isLoggedIn={isLoggedIn}
          onLoginSuccess={setGoogleUser}
        />
      )}
      {gameStarted && (
        <CarromBoard
          board={board}
          gameStarted={gameStarted}
          onScoreUpdate={handleScoreUpdate}
          onTurnChange={handleTurnChange}
          onGameOver={handleGameOver}
        />
      )}
      {gameOver && (
        <GameOver
          player1Score={finalScores.p1}
          player2Score={finalScores.p2}
          player1Pieces={finalScores.p1Pieces}
          player2Pieces={finalScores.p2Pieces}
          onRestart={handleRestart}
          googleUser={googleUser}
        />
      )}
    </div>
  );
};


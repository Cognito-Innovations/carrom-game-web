import React, { useEffect, useState } from 'react';
import { Board } from '../game/Board';
import { CarromBoard } from './CarromBoard';
import { Menu } from './Menu';
import './Game.css';
import './GameOver.css';

interface GameOverProps {
  player1Score: number;
  player2Score: number;
  player1Pieces: number;
  player2Pieces: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ player1Score, player2Score, player1Pieces, player2Pieces, onRestart }) => {
  const winner = player1Score > player2Score ? 'Player 1' : player2Score > player1Score ? 'Player 2 (Computer)' : 'Tie';
  
  return (
    <div className="game-over-overlay">
      <div className="game-over-box">
        <h2>Game Over!</h2>
        <div className="final-scores">
          <div className="score-item">
            <h3>Player 1</h3>
            <p>Score: {player1Score}</p>
            <p>Pieces Hit: {player1Pieces}</p>
          </div>
          <div className="score-item">
            <h3>Player 2 (Computer)</h3>
            <p>Score: {player2Score}</p>
            <p>Pieces Hit: {player2Pieces}</p>
          </div>
        </div>
        <div className="winner">
          <h2>{winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}</h2>
        </div>
        <button className="restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export const Game: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentTurn, setCurrentTurn] = useState('bottom');
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState({ p1: 0, p2: 0, p1Pieces: 0, p2Pieces: 0 });

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
      {!gameStarted && <Menu onStartGame={handleStartGame} />}
      <CarromBoard
        board={board}
        gameStarted={gameStarted}
        onScoreUpdate={handleScoreUpdate}
        onTurnChange={handleTurnChange}
        onGameOver={handleGameOver}
      />
      {gameOver && (
        <GameOver
          player1Score={finalScores.p1}
          player2Score={finalScores.p2}
          player1Pieces={finalScores.p1Pieces}
          player2Pieces={finalScores.p2Pieces}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};


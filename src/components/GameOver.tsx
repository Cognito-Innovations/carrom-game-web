import React from 'react';
import './GameOver.css';

interface GameOverProps {
  player1Score: number;
  player2Score: number;
  player1Pieces: number;
  player2Pieces: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  player1Score,
  player2Score,
  player1Pieces,
  player2Pieces,
  onRestart
}) => {
  let winner = '';
  let title = '';

  if (player1Score > player2Score) {
    winner = 'Player 1';
    title = 'You Win!';
  } else if (player2Score > player1Score) {
    winner = 'Player AI';
    title = 'Game Over';
  } else if (player1Pieces > player2Pieces) {
    winner = 'Player 1';
    title = 'You Win!';
  } else if (player2Pieces > player1Pieces) {
    winner = 'Player AI';
    title = 'Game Over';
  } else {
    winner = 'Tie';
    title = "It's a Tie!";
  }

  return (
    <div className="game-over-overlay">
      <div className="game-over-box">
        <h2>{title}</h2>
        <div className="final-scores">
          <div className="score-item">
            <h3>Player 1</h3>
            <p>Score: {player1Score}</p>
            <p>Pieces Collected: {player1Pieces}</p>
          </div>
          <div className="score-item">
            <h3>Player AI</h3>
            <p>Score: {player2Score}</p>
            <p>Pieces Collected: {player2Pieces}</p>
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
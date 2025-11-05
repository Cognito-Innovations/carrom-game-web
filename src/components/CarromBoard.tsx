import React, { useEffect, useRef, useState } from 'react';
import { Board } from '../game/Board';
import { Point } from '../types/Point';
import { Util } from '../utils/Util';
import { AI } from '../game/AI';
import './CarromBoard.css';

interface CarromBoardProps {
  board: Board;
  gameStarted: boolean;
  onScoreUpdate: (player1Score: number, player2Score: number) => void;
  onTurnChange: (turn: string) => void;
  onGameOver: (player1Score: number, player2Score: number, player1Pieces: number, player2Pieces: number) => void;
}

export const CarromBoard: React.FC<CarromBoardProps> = ({ board, gameStarted, onScoreUpdate, onTurnChange, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const aiRef = useRef<AI>(new AI());
  const aiMoveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!canvasRef.current || !backCanvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const backCanvas = backCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const backCtx = backCanvas.getContext('2d');

    if (!ctx || !backCtx) return;

    // Update board's canvas references
    board.canvas = canvas;
    board.ctx = ctx;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = board.gattis.length - 1; i >= 0; i--) {
        const g = board.gattis[i];
        if (board.state !== 'first') {
          g.checkCollission(board.gattis, canvas);
          g.checkBoundary(canvas);
          g.checkInHoles(
            board.holes,
            board.gattis,
            board,
            (gatti, holeIndex) => {
              // Handle gatti pocketed
            }
          );
        }
        g.draw(ctx, board);
      }

      if (board.target.flag && board.state === 'second') {
        board.target.draw(ctx, board.striker, board.cursor);
      }

      if (board.state === 'first') {
        const unit = 60;
        const start = unit;
        const end = canvas.width - unit;
        
        if (board.isPlayer1Turn()) {
          // Player 1 (manual) - follow cursor
          const x = board.cursor.final.x;
          const y = board.cursor.final.y;
          if (x > start && x < end) {
            board.striker.pos.x = x;
            board.striker.pos.y = canvas.height - unit; // Bottom position
          }
        } else {
          // Player 2 (AI) - position striker automatically
          const aiMove = aiRef.current.makeMove(board);
          board.striker.pos.x = aiMove.strikerX;
          board.striker.pos.y = aiMove.strikerY;
          board.cursor.final = new Point(aiMove.aimX, aiMove.aimY);
        }
      } else if (board.state === 'third') {
        let flag = true;
        for (let i = 0; i < board.gattis.length; i++) {
          if (board.gattis[i].state === 'motion') {
            flag = false;
            break;
          }
        }
        if (flag) {
          // Check if game is over
          if (board.checkGameOver()) {
            onGameOver(
              board.player1.score,
              board.player2.score,
              board.player1PiecesHit,
              board.player2PiecesHit
            );
            return;
          }
          
          board.state = 'first';
          setTimeout(() => {
            board.nextTurn();
            onTurnChange(board.turn);
            
            // If it's Player 2's turn (AI), automatically make the move
            if (board.isPlayer2Turn()) {
              setTimeout(() => {
                // Position striker
                const aiMove = aiRef.current.makeMove(board);
                board.striker.pos.x = aiMove.strikerX;
                board.striker.pos.y = aiMove.strikerY;
                
                // Wait a bit then aim
                setTimeout(() => {
                  board.state = 'second';
                  board.target.flag = true;
                  // Set cursor final position for aiming
                  board.cursor.final = new Point(aiMove.aimX, aiMove.aimY);
                  board.cursor.initial = new Point(aiMove.strikerX, aiMove.strikerY);
                  
                  // Wait a bit more then strike
                  setTimeout(() => {
                    // Calculate power using the Target's determinePower method
                    // This ensures proper angle calculation
                    const aimPoint = new Point(aiMove.aimX, aiMove.aimY);
                    const strikerPoint = new Point(aiMove.strikerX, aiMove.strikerY);
                    const power = board.target.determinePower(strikerPoint, aimPoint);
                    
                    // Apply the calculated power
                    board.striker.strike(power.x * 0.1, power.y * 0.1);
                    board.state = 'third';
                    board.target.flag = false;
                  }, 500);
                }, 300);
              }, 200);
            }
          }, 500);
        }
      }

      onScoreUpdate(board.player1.score, board.player2.score);
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
      }
    };
  }, [board, gameStarted, onScoreUpdate, onTurnChange, onGameOver]);

  useEffect(() => {
    if (!backCanvasRef.current || !gameStarted) return;

    const backCanvas = backCanvasRef.current;
    const backCtx = backCanvas.getContext('2d');

    if (!backCtx) return;

    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);
    board.draw(backCtx);
  }, [board, gameStarted]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || !canvasRef.current || !board.isPlayer1Turn()) return;
    const ut = new Util();
    board.cursor.final = ut.getMousePos(canvasRef.current, e.nativeEvent, board);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || !canvasRef.current || !board.isPlayer1Turn()) return;
    const ut = new Util();
    board.cursor.initial = ut.getMousePos(canvasRef.current, e.nativeEvent, board);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || !canvasRef.current || !board.isPlayer1Turn()) return;
    const canvas = canvasRef.current;
    const ut = new Util();

    if (board.target.flag && board.state === 'second') {
      const power = board.target.determinePower(board.cursor.final, board.striker.pos);
      board.striker.strike(power.x, power.y);
      board.state = 'third';
    }
    board.target.flag = false;

    if (board.state === 'first') {
      let flag = true;
      for (let i = 1; i < board.gattis.length; i++) {
        if (ut.checkCirCollission(board.striker, board.gattis[i])) {
          flag = false;
          break;
        }
      }
      if (flag) {
        board.state = 'second';
        board.target.flag = true;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameStarted || !canvasRef.current || !board.isPlayer1Turn()) return;
    e.preventDefault();
    const ut = new Util();
    board.cursor.final = ut.getMousePos(canvasRef.current, e.nativeEvent, board);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameStarted || !canvasRef.current || !board.isPlayer1Turn()) return;
    e.preventDefault();
    const ut = new Util();
    board.cursor.initial = ut.getMousePos(canvasRef.current, e.nativeEvent, board);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameStarted || !canvasRef.current || !board.isPlayer1Turn()) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ut = new Util();

    if (board.target.flag && board.state === 'second') {
      const power = board.target.determinePower(board.cursor.final, board.striker.pos);
      board.striker.strike(power.x, power.y);
      board.state = 'third';
    }
    board.target.flag = false;

    if (board.state === 'first') {
      let flag = true;
      for (let i = 1; i < board.gattis.length; i++) {
        if (ut.checkCirCollission(board.striker, board.gattis[i])) {
          flag = false;
          break;
        }
      }
      if (flag) {
        board.state = 'second';
        board.target.flag = true;
      }
    }
  };

  return (
    <div className="board-container">
      <div className="label label-top">
        {board.player2.name}: {board.player2.score} {board.isPlayer2Turn() && '(Playing...)'}
      </div>
      <div className="label label-bottom">
        {board.player1.name}: {board.player1.score} {board.isPlayer1Turn() && '(Your Turn)'}
      </div>
      <canvas
        ref={backCanvasRef}
        className="cnv back-canvas"
        width={550}
        height={550}
      />
      <canvas
        ref={canvasRef}
        className="cnv front-canvas"
        width={550}
        height={550}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {showToast && (
        <div className="toast">{toastMessage}</div>
      )}
    </div>
  );
};


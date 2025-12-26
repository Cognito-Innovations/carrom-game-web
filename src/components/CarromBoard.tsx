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
  const isAiProcessing = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

  const showGameMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

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

    const executeAIMove = async () => {
      try {
        // Double check it's still AI turn
        if (!board.isPlayer2Turn()) {
           isAiProcessing.current = false;
           return;
        }

        // Small delay to make it feel natural
        await new Promise(r => setTimeout(r, 600));

        let aiMove;
        try {
          aiMove = aiRef.current.makeMove(board);
          
          if (!aiMove || typeof aiMove.strikerX !== 'number' || isNaN(aiMove.strikerX)) {
            throw new Error("Invalid AI coordinates calculated");
          }
        } catch (err) {
          console.warn("AI Calculation Error, using fallback:", err);
          // Safe Fallback
          aiMove = {
            strikerX: canvas.width / 2,
            strikerY: 60,
            aimX: canvas.width / 2,
            aimY: 200
          };
        }

        // 1. Animate Striker Positioning
        board.strikerAnimStartPos = new Point(board.striker.pos.x, board.striker.pos.y);
        board.strikerTargetPos = new Point(aiMove.strikerX, aiMove.strikerY);
        board.isAnimatingStriker = true;
        board.startAnimTime = performance.now();

        // Wait for positioning to finish (approx 300ms + buffer)
        setTimeout(() => {
           // 2. Setup Aiming
           board.state = 'second';
           board.target.flag = true;
           board.cursor.initial = new Point(board.striker.pos.x, board.striker.pos.y);
           
           const pullBackPoint = new Point(aiMove.aimX, aiMove.aimY);
           board.aimAnimStartPos = new Point(board.striker.pos.x, board.striker.pos.y);
           board.aimTargetPos = pullBackPoint;
           board.isAnimatingAim = true;
           board.aimStartTime = performance.now();
           
           // Reset processing flag so next turn can run
           isAiProcessing.current = false;
        }, 400);

      } catch (e) {
        console.error("Critical AI Failure:", e);
        isAiProcessing.current = false;
        // Force next turn if AI fails hard to prevent freeze
        board.nextTurn(); 
      }
    };

    const update = () => {
      const now = performance.now();

      //Handle Animations
      if (board.isAnimatingStriker && board.strikerAnimStartPos && board.strikerTargetPos) {
        const elapsed = now - board.startAnimTime;
        const t = Math.min(1, elapsed / board.animationDuration);
        const easeT = t * t * (3 - 2 * t);
        board.striker.pos.x = board.strikerAnimStartPos.x + (board.strikerTargetPos.x - board.strikerAnimStartPos.x) * easeT;
        board.striker.pos.y = board.strikerAnimStartPos.y + (board.strikerTargetPos.y - board.strikerAnimStartPos.y) * easeT;
        if (t >= 1) {
          board.striker.pos.x = board.strikerTargetPos.x;
          board.striker.pos.y = board.strikerTargetPos.y;
          board.isAnimatingStriker = false;
        }
      }

      // Handle aim line animation (smooth pull)
      if (board.isAnimatingAim && board.aimAnimStartPos && board.aimTargetPos) {
        const elapsed = now - board.aimStartTime;
        const t = Math.min(1, elapsed / board.aimDuration);
        const easeT = t * t * (3 - 2 * t);
        board.cursor.final.x = board.aimAnimStartPos.x + (board.aimTargetPos.x - board.aimAnimStartPos.x) * easeT;
        board.cursor.final.y = board.aimAnimStartPos.y + (board.aimTargetPos.y - board.aimAnimStartPos.y) * easeT;
        if (t >= 1) {
          board.cursor.final.x = board.aimTargetPos.x;
          board.cursor.final.y = board.aimTargetPos.y;
          // Perform strike
          const power = board.target.determinePower(board.cursor.final, board.striker.pos);
          const magnitude = Math.sqrt(power.x * power.x + power.y * power.y) || 1;
          const minStrength = 16;
          const maxStrength = 34;
          const strength = Math.min(maxStrength, Math.max(minStrength, power.d * 0.3));
          const normX = (power.x / magnitude) * strength;
          const normY = (power.y / magnitude) * strength;
          board.striker.strike(normX, normY);
          board.didPocketOwnThisTurn = false;
          board.state = 'third';
          board.target.flag = false;
          board.isAnimatingAim = false;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (board.state !== 'first' && board.striker) {
        board.striker.checkBoundary(canvas);
        board.striker.checkInHoles(
          board.holes, 
          board.gattis,
          board,
          () => {
            showGameMessage("⚠️ FOUL! Striker Pocketed");
          }
        );
        board.striker.draw(ctx, board);
      }

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
              const isPlayer1 = board.isPlayer1Turn();

              if (gatti.type === 'queen') {
                showGameMessage("Queen Pocketed! 👑");
                return;
              }

              if ((isPlayer1 && gatti.type === 'white') || (!isPlayer1 && gatti.type === 'black')) {
                showGameMessage(`Nice Shot! Second Chance 🎯`);
              }
            }
          );
        }
        g.draw(ctx, board);
      }

      if (board.target.flag && board.state === 'second') {
        board.target.draw(ctx, board.striker, board.cursor);
      }

      if (board.state === 'first') {
        // A. Manual Player Logic
        if (board.isPlayer1Turn()) {
           isAiProcessing.current = false; // Ensure AI flag is reset
           
           const unit = 60;
           const start = unit;
           const end = canvas.width - unit;
           const baseY = canvas.height - unit;
           
           const x = board.cursor.final.x;
           if (x > start && x < end) {
             board.striker.pos.x = x;
           }
           if (!board.isAnimatingStriker) {
             board.striker.pos.y = baseY;
           }
        } 
        // B. AI Trigger Logic (The Fix)
        else if (board.isPlayer2Turn() && !board.isAnimatingStriker && !isAiProcessing.current) {
           isAiProcessing.current = true;
           executeAIMove();
        }

      } else if (board.state === 'third') {
        // Check if everything stopped
        let allStopped = true;
        if(board.striker.state === 'motion') allStopped = false;
        for (const g of board.gattis) {
          if (g.state === 'motion') { allStopped = false; break; }
        }
        if (allStopped) {
          if (board.checkGameOver()) {
            onGameOver(board.player1.score, board.player2.score, board.player1.pocketed.length, board.player2.pocketed.length);
            return;
          }
          
          // Animate striker to base line Y if needed (for repeat turns)
          const baseY = board.turn === 'bottom' ? canvas.height - 60 : 60;
          if (Math.abs(board.striker.pos.y - baseY) > 1 && !board.isAnimatingStriker) {
             // Return striker to base
             board.strikerAnimStartPos = new Point(board.striker.pos.x, board.striker.pos.y);
             board.strikerTargetPos = new Point(board.striker.pos.x, baseY);
             board.isAnimatingStriker = true;
             board.startAnimTime = performance.now();
          }
          
          // Decide next turn based on whether own gatti was pocketed this shot
          const opposite = board.turn === 'bottom' ? 'top' : 'bottom';
          if (board.didPocketOwnThisTurn) {
            board.next = board.turn;
          } else {
            board.next = opposite;
          }
          
          const needsSwitch = board.next !== board.turn;
          if (needsSwitch) {
            // Animate to center then to other side
            const newBaseY = board.next === 'bottom' ? canvas.height - 60 : 60;
            const newBaseX = canvas.width / 2;
            board.strikerAnimStartPos = new Point(board.striker.pos.x, board.striker.pos.y);
            board.strikerTargetPos = new Point(newBaseX, newBaseY);
            board.isAnimatingStriker = true;
            board.startAnimTime = performance.now();     
            board.nextTurn();
            onTurnChange(board.turn);
            isAiProcessing.current = false; // Reset AI flag on turn switch
          }
          
          board.didPocketOwnThisTurn = false;
          
          board.state = 'first';
        }
      }

      onScoreUpdate(board.player1.score, board.player2.score);
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [board, gameStarted, onScoreUpdate, onTurnChange, onGameOver]);

  useEffect(() => {
    if (!backCanvasRef.current || !gameStarted) return;
    const backCtx = backCanvasRef.current.getContext('2d');
    if (backCtx) {
        backCtx.clearRect(0, 0, backCanvasRef.current.width, backCanvasRef.current.height);
        board.draw(backCtx);
    }
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
    const ut = new Util();

    if (board.target.flag && board.state === 'second') {
      const power = board.target.determinePower(board.cursor.final, board.striker.pos);
      board.striker.strike(power.x, power.y);
      board.didPocketOwnThisTurn = false;
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
    const ut = new Util();

    if (board.target.flag && board.state === 'second') {
      const power = board.target.determinePower(board.cursor.final, board.striker.pos);
      board.striker.strike(power.x, power.y);
      board.didPocketOwnThisTurn = false;
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

  const renderPieces = (player: typeof board.player1) => (
    <div className="pieces-row">
      {player.pocketed.map((type, idx) => (
        <div key={`${type}-${idx}`} className={`mini-gatti mini-${type}`} title={type} />
      ))}
      {player.pocketed.length === 0 && <span className="empty-pieces">No pieces yet</span>}
    </div>
  );

  return (
    <div className="carrom-wrapper">
      {gameStarted && (
        <div className={`player-panel top-panel ${board.isPlayer2Turn() ? 'active-turn' : ''}`}>
          <div className="player-info">
            <span className="player-name">{board.player2.name}</span>
            <span className="player-score">Score: {board.player2.score}</span>
          </div>
          <div className="collected-container">
             {renderPieces(board.player2)}
          </div>
        </div>
      )}

      <div className="board-container">
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

      {gameStarted && (
        <div className={`player-panel bottom-panel ${board.isPlayer1Turn() ? 'active-turn' : ''}`}>
          <div className="collected-container">
              {renderPieces(board.player1)}
          </div>
          <div className="player-info">
            <span className="player-name">{board.player1.name}</span>
            <span className="player-score">Score: {board.player1.score}</span>
          </div>
        </div>
      )}
    </div>
  );
};


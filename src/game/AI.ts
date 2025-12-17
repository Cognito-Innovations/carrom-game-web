import { Point } from '../types/Point';
import { Gatti } from './Gatti';
import { Util } from '../utils/Util';
import { Board } from './Board';

export class AI {
  private util: Util;

  constructor() {
    this.util = new Util();
  }

  // Checks if the path from p1 to p2 is blocked by any other gatti
  private isPathClear(board: Board, p1: Point, p2: Point, excludeGattis: Gatti[]): boolean {
    for (const gatti of board.gattis) {
      if (gatti.type === 'striker' || excludeGattis.includes(gatti)) continue;
      const lineLenSq = (p2.x - p1.x)**2 + (p2.y - p1.y)**2;
      if (lineLenSq === 0) continue;
      const t = Math.max(0, Math.min(1,
        ((gatti.pos.x - p1.x)*(p2.x - p1.x) + (gatti.pos.y - p1.y)*(p2.y - p1.y)) / lineLenSq
      ));
      const closestX = p1.x + t * (p2.x - p1.x);
      const closestY = p1.y + t * (p2.y - p1.y); 
      const dist = this.util.getDistance(gatti.pos, new Point(closestX, closestY));
      if (dist < gatti.radius * 2 + 2) return false;
    }
    return true;
  }

  // Find the best target to aim for
  findBestTarget(board: Board): { target: Gatti | null; power: { x: number; y: number } } {
    const striker = board.striker;
    let bestTarget: Gatti | null = null;
    let bestScore = -1;
    let bestPower = { x: 0, y: 0 };
    const aiColor = board.player2.color;

    // Try to hit pieces that can be pocketed
    for (const gatti of board.gattis) {
      if (gatti.type === 'striker') continue;

      // 1. If Queen is pending cover, MUST hit own color
      if (board.queenMode && board.queenAwaitingCover === 'top' && gatti.type !== aiColor) {
          continue;
      }
      // 2. Don't hit opponent pieces unless clearing path
      if (!board.queenMode && gatti.type !== aiColor && gatti.type !== 'queen') {
          continue; 
      }

      if (!this.isPathClear(board, striker.pos, gatti.pos, [gatti])) continue;

      // Calculate angle from striker to gatti
      const dx = gatti.pos.x - striker.pos.x;
      const dy = gatti.pos.y - striker.pos.y;
      const distToPiece = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      
      let bestHoleScore = -1;
      let selectedHole = null;

      for (const hole of board.holes) {
        const holePos = new Point(hole.x, hole.y);
        if (!this.isPathClear(board, gatti.pos, holePos, [gatti])) continue;

        const holeDx = hole.x - gatti.pos.x;
        const holeDy = hole.y - gatti.pos.y;
        const distToHole = Math.sqrt(holeDx*holeDx + holeDy*holeDy);
        const angleToHole = Math.atan2(holeDy, holeDx);
        
        // Check Cut Angle
        let angleDiff = Math.abs(angle - angleToHole);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        if (angleDiff > Math.PI / 2.5) continue;

        const score = (1000 / distToHole) + (100 / (angleDiff + 0.1));

        if (score > bestHoleScore) {
          bestHoleScore = score;
          selectedHole = hole;
        }
      }

      if (selectedHole && bestHoleScore > -1) {
         let typeBonus = gatti.type === 'queen' ? 20 : (gatti.type === aiColor ? 10 : 1);
         if(board.queenMode && board.queenAwaitingCover === 'top') typeBonus = 50;

         const finalScore = bestHoleScore * typeBonus;

         if (finalScore > bestScore) {
           bestScore = finalScore;
           bestTarget = gatti;

           // Calculate total distance needed to travel
           const distToHole = Math.sqrt(
               (selectedHole.x - gatti.pos.x)**2 + (selectedHole.y - gatti.pos.y)**2
           );
           
           // Base power needed to reach the hole + friction compensation
           let rawPower = (distToPiece + distToHole) * 0.16; 
           
           // Add a "smash" factor if angle is straight, less power if it's a cut shot
           const angleDiff = Math.abs(angle - Math.atan2(selectedHole.y - gatti.pos.y, selectedHole.x - gatti.pos.x));
           if (angleDiff < 0.2) rawPower += 5; // Hit harder on straights

           // Clamp Power
           const powerFactor = Math.min(Math.max(rawPower, 18), 50);

           bestPower = {
             x: Math.cos(angle) * powerFactor,
             y: Math.sin(angle) * powerFactor,
           };
         }
      }
    }

    // If no good target found, aim at center of board or nearest piece
    if (!bestTarget) {
      // Try to find any piece to aim at
      let nearestPiece: Gatti | null = null;
      let minDist = Infinity;
      
      for (const gatti of board.gattis) {
        if (gatti.type === 'striker') continue;
        if (board.queenMode && gatti.type !== aiColor) continue;

        const dist = this.util.getDistance(striker.pos, gatti.pos);
        if (dist < minDist && dist > 30) {
          minDist = dist;
          nearestPiece = gatti;
        }
      }
      
      if (nearestPiece) {
        const dx = nearestPiece.pos.x - striker.pos.x;
        const dy = nearestPiece.pos.y - striker.pos.y;
        const angle = Math.atan2(dy, dx);
        const powerDistance = 25; 
        bestPower = {
          x: Math.cos(angle) * powerDistance,
          y: Math.sin(angle) * powerDistance,
        };
      } else {
        // Fallback: aim at center
        const centerX = board.canvas.width / 2;
        const centerY = board.canvas.height / 2;
        const angle = Math.atan2(centerY - striker.pos.y, centerX - striker.pos.x);
        bestPower = { x: Math.cos(angle) * 30, y: Math.sin(angle) * 30 };
      }
    }

    return { target: bestTarget, power: bestPower };
  }

  // Make AI move - position striker and aim
  makeMove(board: Board): { strikerX: number; strikerY: number; aimX: number; aimY: number } {
    const canvas = board.canvas;
    const unit = 60;
    const start = unit + 20;
    const end = canvas.width - unit - 20;

    const strikerY = board.turn === 'bottom' ? canvas.height - unit : unit;
    
    let strikerX = this.util.random(start, end);
    let bestMove = { target: null as Gatti | null, power: {x:0, y:0}, score: -1, sX: strikerX };
    
    // Testing more positions for better AI accuracy
    const testPositions = [strikerX, start, end, canvas.width/2, start + (end-start)/3, end - (end-start)/3]; 
    
    const originalStrikerPos = { x: board.striker.pos.x, y: board.striker.pos.y };
    board.striker.pos.y = strikerY;

    for (const testX of testPositions) {
        board.striker.pos.x = testX;
        const res = this.findBestTarget(board);
        // Better scoring: targets exist > high score
        const score = res.target ? (res.target.type === 'queen' ? 10 : 1) : 0; 
        if (score >= bestMove.score) {
            bestMove = { ...res, score, sX: testX };
        }
    }
    
    strikerX = bestMove.sX;
    const { power, target } = bestMove;

    board.striker.pos.x = originalStrikerPos.x;
    board.striker.pos.y = originalStrikerPos.y;

    let aimX: number;
    let aimY: number;

    if (target) {
      // Aim directly at the target piece
      const dx = target.pos.x - strikerX;
      const dy = target.pos.y - strikerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const aimDistance = Math.min(distance * 0.8, 150); 
      
      aimX = strikerX - (dx / distance) * aimDistance;
      aimY = strikerY - (dy / distance) * aimDistance;
    } else {
      aimX = strikerX - power.x * 3;
      aimY = strikerY - power.y * 3;
    }

    aimX = Math.max(-200, Math.min(canvas.width + 200, aimX));
    aimY = Math.max(-200, Math.min(canvas.height + 200, aimY));

    if (board.turn === 'top') {
        aimX = canvas.width - aimX;
        aimY = canvas.height - aimY;
    }

    return {
      strikerX: Math.max(start, Math.min(end, strikerX)),
      strikerY,
      aimX,
      aimY,
    };
  }
}


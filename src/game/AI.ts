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

      // 1. If Queen is pending cover, MUST hit own color or queen
      if (board.queenMode && board.queenAwaitingCover === 'top' && gatti.type !== aiColor && gatti.type !== 'queen') {
          continue;
      }
      // 2. Don't hit opponent pieces unless clearing path
      if (!board.queenMode && gatti.type !== aiColor && gatti.type !== 'queen') {
          continue; 
      }

      // Safety check: if striker is somehow overlapping, skip this calc to prevent NaN
      const dx = gatti.pos.x - striker.pos.x;
      const dy = gatti.pos.y - striker.pos.y;
      const distToPiece = Math.sqrt(dx*dx + dy*dy);
      
      if (distToPiece < 1) continue;

      if (!this.isPathClear(board, striker.pos, gatti.pos, [gatti])) continue;

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
           if (angleDiff < 0.2) rawPower += 5;

           // Clamp Power
           const powerFactor = Math.min(Math.max(rawPower, 18), 50);

           bestPower = {
             x: Math.cos(angle) * powerFactor,
             y: Math.sin(angle) * powerFactor,
           };
         }
      }
    }

    // If no good target found for pocketing, find best for just hitting own pieces or queen
    if (!bestTarget) {
      let bestHitScore = -1;
      let bestHitTarget: Gatti | null = null;
      let bestHitPower = { x: 0, y: 0 };

      for (const gatti of board.gattis) {
        if (gatti.type === 'striker') continue;

        // Prioritize own color and queen
        if (board.queenMode && gatti.type !== aiColor && gatti.type !== 'queen') continue;
        if (!board.queenMode && gatti.type !== aiColor && gatti.type !== 'queen') continue;

        if (!this.isPathClear(board, striker.pos, gatti.pos, [gatti])) continue;

        const dx = gatti.pos.x - striker.pos.x;
        const dy = gatti.pos.y - striker.pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 30) continue; 

        // Score based on distance (closer better) and type bonus
        let hitScore = (1 / dist) * 1000;
        if (gatti.type === aiColor) hitScore *= 2;
        if (gatti.type === 'queen') hitScore *= 3;

        if (hitScore > bestHitScore) {
          bestHitScore = hitScore;
          bestHitTarget = gatti;

          // Power to hit the piece: based on distance, slightly more for safety
          const powerDistance = Math.min(45, dist * 0.7 + 15);
          const hitAngle = Math.atan2(dy, dx);
          bestHitPower = {
            x: Math.cos(hitAngle) * powerDistance,
            y: Math.sin(hitAngle) * powerDistance,
          };
        }
      }

      if (bestHitTarget) {
        bestTarget = bestHitTarget;
        bestPower = bestHitPower;
        bestScore = bestHitScore;
      } else {
        // Ultimate fallback: aim at center mass of own pieces
        const ownPiecesCenter = { x: board.canvas.width / 2, y: board.canvas.height / 2 };
        let ownCount = 0;
        for (const gatti of board.gattis) {
          if (gatti.type === aiColor) {
            ownPiecesCenter.x += gatti.pos.x;
            ownPiecesCenter.y += gatti.pos.y;
            ownCount++;
          }
        }
        if (ownCount > 0) {
          ownPiecesCenter.x /= ownCount;
          ownPiecesCenter.y /= ownCount;
        }

        const dx = ownPiecesCenter.x - striker.pos.x;
        const dy = ownPiecesCenter.y - striker.pos.y;
        const angle = Math.atan2(dy, dx);
        const fallbackPower = 30 + Math.random() * 10;
        bestPower = { x: Math.cos(angle) * fallbackPower, y: Math.sin(angle) * fallbackPower };
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
    
    // Helper to check if a specific position overlaps with ANY gatti
    const isPositionValid = (x: number, y: number): boolean => {
      const strikerR = board.striker.radius || 22; 
      
      for (const gatti of board.gattis) {
        if (gatti.type === 'striker') continue;
        const dist = Math.sqrt((x - gatti.pos.x)**2 + (y - gatti.pos.y)**2);
        // If distance is less than sum of radii + buffer, it's an overlap
        if (dist < strikerR + gatti.radius + 2) {
          return false;
        }
      }
      return true;
    };

    let strikerX = this.util.random(start, end);
    if (!isPositionValid(strikerX, strikerY)) {
        let found = false;
        for (let i = start; i < end; i += 5) {
            if (isPositionValid(i, strikerY)) {
                strikerX = i;
                found = true;
                break;
            }
        }
        if (!found) strikerX = canvas.width / 2;
    }

    let bestMove = { target: null as Gatti | null, power: {x:0, y:0}, score: -1, sX: strikerX };
    
    // More test positions for better accuracy
    const testPositions = [
      strikerX, 
      start, 
      end, 
      canvas.width/2, 
      start + (end-start)/4, 
      start + (end-start)/2, 
      end - (end-start)/4,
      this.util.random(start, end)
    ]; 

    const validTestPositions = testPositions.filter(pos => isPositionValid(pos, strikerY));

    if (validTestPositions.length === 0) {
       for (let i = start; i <= end; i+=15) {
           if (isPositionValid(i, strikerY)) {
               validTestPositions.push(i);
               if (validTestPositions.length >= 3) break;
           }
       }
    }

    if (validTestPositions.length === 0) validTestPositions.push(strikerX);
    
    const originalStrikerPos = { x: board.striker.pos.x, y: board.striker.pos.y };
    board.striker.pos.y = strikerY;

    for (const testX of validTestPositions) {
        board.striker.pos.x = testX;
        const res = this.findBestTarget(board);
        // Scoring: pocketable high, then hittable
        const score = res.target ? (res.target.type === 'queen' ? 100 : 10) : 0; 

        if (score > bestMove.score || (score === bestMove.score && Math.random() > 0.8)) {
            bestMove = { ...res, score, sX: testX };
        }
    }
    
    strikerX = bestMove.sX;
    const { power, target } = bestMove;

    board.striker.pos.x = originalStrikerPos.x;
    board.striker.pos.y = originalStrikerPos.y;

    let aimX: number;
    let aimY: number;

    const currentStrikerX = strikerX;
    const currentStrikerY = strikerY;

    if (target) {
      // Pull back opposite to target direction
      const dx = target.pos.x - currentStrikerX;
      const dy = target.pos.y - currentStrikerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const safeDistance = distance === 0 ? 1 : distance;
      
      const pullDistance = Math.min(safeDistance * 0.6, 120); 
      
      aimX = currentStrikerX + (dx / safeDistance) * pullDistance;
      aimY = currentStrikerY + (dy / safeDistance) * pullDistance;
    } else {
      // For power-based, pull back opposite to power direction
      const powerDist = Math.sqrt(power.x * power.x + power.y * power.y);
      if (powerDist > 0) {
        aimX = currentStrikerX + (power.x / powerDist) * 30;
        aimY = currentStrikerY + (power.y / powerDist) * 30;
      } else {
        aimX = currentStrikerX;
        aimY = currentStrikerY + 40;  // Default pull down if no direction
      }
    }

    // Add slight randomness
    aimX += (Math.random() - 0.5) * 4;
    aimY += (Math.random() - 0.5) * 4;

    // Clamp
    aimX = Math.max(-100, Math.min(canvas.width + 100, aimX));
    aimY = Math.max(-100, Math.min(canvas.height + 100, aimY));

    return {
      strikerX: Math.max(start, Math.min(end, strikerX)),
      strikerY,
      aimX,
      aimY,
    };
  }
}


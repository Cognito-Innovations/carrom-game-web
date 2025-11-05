import { Point } from '../types/Point';
import { Gatti } from './Gatti';
import { Util } from '../utils/Util';
import { Board } from './Board';

export class AI {
  private util: Util;

  constructor() {
    this.util = new Util();
  }

  // Find the best target to aim for
  findBestTarget(board: Board): { target: Gatti | null; power: { x: number; y: number } } {
    const striker = board.striker;
    let bestTarget: Gatti | null = null;
    let bestScore = -1;
    let bestPower = { x: 0, y: 0 };

    // Try to hit pieces that can be pocketed
    for (const gatti of board.gattis) {
      if (gatti.type === 'striker') continue;

      // Check if this gatti can be aimed at a hole
      const distanceToStriker = this.util.getDistance(striker.pos, gatti.pos);
      if (distanceToStriker < 30 || distanceToStriker > 400) continue; // Skip if too close or too far

      // Calculate angle from striker to gatti
      const dx = gatti.pos.x - striker.pos.x;
      const dy = gatti.pos.y - striker.pos.y;
      const angle = Math.atan2(dy, dx);
      
      // Find nearest hole to this gatti
      let nearestHole = board.holes[0];
      let minHoleDist = this.util.getDistance(gatti.pos, new Point(nearestHole.x, nearestHole.y));
      
      for (const hole of board.holes) {
        const dist = this.util.getDistance(gatti.pos, new Point(hole.x, hole.y));
        if (dist < minHoleDist) {
          minHoleDist = dist;
          nearestHole = hole;
        }
      }

      // Calculate angle from gatti to nearest hole
      const holeDx = nearestHole.x - gatti.pos.x;
      const holeDy = nearestHole.y - gatti.pos.y;
      const angleToHole = Math.atan2(holeDy, holeDx);
      
      // Calculate angle difference (normalized to 0-PI)
      let angleDiff = Math.abs(angle - angleToHole);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // Score based on:
      // 1. How close the gatti is to a hole
      // 2. How well we can aim this gatti at the hole
      // 3. Bonus for queen
      const distanceScore = 1 / (minHoleDist + 1);
      const angleScore = 1 / (angleDiff + 0.1);
      const typeBonus = gatti.type === 'queen' ? 10 : 1;
      const score = distanceScore * angleScore * typeBonus * (1 / (distanceToStriker / 100));
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = gatti;
        
        // Calculate power vector (direction from striker to gatti)
        const powerDistance = Math.min(distanceToStriker * 0.12, 40);
        bestPower = {
          x: Math.cos(angle) * powerDistance,
          y: Math.sin(angle) * powerDistance,
        };
      }
    }

    // If no good target found, aim at center of board or nearest piece
    if (!bestTarget) {
      // Try to find any piece to aim at
      let nearestPiece: Gatti | null = null;
      let minDist = Infinity;
      
      for (const gatti of board.gattis) {
        if (gatti.type === 'striker') continue;
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
        const powerDistance = Math.min(minDist * 0.12, 35);
        bestPower = {
          x: Math.cos(angle) * powerDistance,
          y: Math.sin(angle) * powerDistance,
        };
      } else {
        // Fallback: aim at center
        const centerX = board.canvas.width / 2;
        const centerY = board.canvas.height / 2;
        const dx = centerX - striker.pos.x;
        const dy = centerY - striker.pos.y;
        const angle = Math.atan2(dy, dx);
        const powerDistance = 30;
        bestPower = {
          x: Math.cos(angle) * powerDistance,
          y: Math.sin(angle) * powerDistance,
        };
      }
    }

    return { target: bestTarget, power: bestPower };
  }

  // Make AI move - position striker and aim
  makeMove(board: Board): { strikerX: number; strikerY: number; aimX: number; aimY: number } {
    const canvas = board.canvas;
    const unit = 60;
    const start = unit;
    const end = canvas.width - unit;

    // Position striker (Player 2 is at top, so striker at top)
    const strikerY = unit;
    const strikerX = canvas.width / 2; // Center position
    
    // Update striker position temporarily for calculations
    const originalStrikerPos = { x: board.striker.pos.x, y: board.striker.pos.y };
    board.striker.pos.x = strikerX;
    board.striker.pos.y = strikerY;

    // Find best target
    const { power, target } = this.findBestTarget(board);

    // Calculate aim point - for Player 2 at top, we need to aim downward
    // The aim point should be calculated from striker position toward the target
    let aimX: number;
    let aimY: number;

    if (target) {
      // Aim directly at the target piece
      const dx = target.pos.x - strikerX;
      const dy = target.pos.y - strikerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const aimDistance = Math.min(distance * 0.8, 200); // Extend aim line
      
      aimX = strikerX + (dx / distance) * aimDistance;
      aimY = strikerY + (dy / distance) * aimDistance;
    } else {
      // Fallback: use power calculation but extend it
      aimX = strikerX + power.x * 3;
      aimY = strikerY + power.y * 3;
    }

    // Restore original position
    board.striker.pos.x = originalStrikerPos.x;
    board.striker.pos.y = originalStrikerPos.y;

    // Ensure aim point is within bounds
    aimX = Math.max(0, Math.min(canvas.width, aimX));
    aimY = Math.max(0, Math.min(canvas.height, aimY));

    return {
      strikerX: Math.max(start, Math.min(end, strikerX)),
      strikerY,
      aimX,
      aimY,
    };
  }
}


import { Point } from '../types/Point';
import { Gatti } from './Gatti';
import { Util } from '../utils/Util';

export class Target {
  flag: boolean;

  constructor() {
    this.flag = false;
  }

  draw(ctx: CanvasRenderingContext2D, striker: Gatti, cursor: { initial: Point; final: Point }): void {
    // Enable anti-aliasing for smooth lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = '';

    const x1 = striker.pos.x;
    const y1 = striker.pos.y;
    // Calculate reversed (pull-back) vector for slingshot behavior
    const x2 = 2 * x1 - cursor.final.x;
    const y2 = 2 * y1 - cursor.final.y;
    
    // Power line - thick line from striker to the pulled (reversed) point
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Calculate extended point for guide line
    const m = 4;
    const n = 3;
    const x3 = (m * x1 - n * x2) / (m - n);
    const y3 = (m * y1 - n * y2) / (m - n);
    
    // Guide line - dashed line extending from striker (in aiming direction)
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x3, y3);
    ctx.strokeStyle = '#373737';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([5, 5]);
    ctx.stroke();

    // Arrow head at the end of guide line
    ctx.setLineDash([]);
    const tox = x3;
    const toy = y3;
    const fromx = x1;
    const fromy = y1;
    const headlen = 12;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    
    // Draw arrow head with smooth lines
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#373737';
    ctx.fill();
    
    // Reset context
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
  }

  determinePower(p1: Point, p2: Point): { x: number; y: number; d: number } {
    // Reverse the direction: shoot opposite to the pull direction
    const ut = new Util();
    // p2 is the pull point, p1 is striker. Shot direction should be from striker to opposite of pull vector
    const reversedX = 2 * p1.x - p2.x;
    const reversedY = 2 * p1.y - p2.y;
    const angle = Math.atan2(reversedY - p1.y, reversedX - p1.x);
    const d = ut.getDistance(p1, { x: reversedX, y: reversedY });
    const fx = d * Math.cos(angle);
    const fy = d * Math.sin(angle);
    return {
      x: fx,
      y: fy,
      d: d,
    };
  }
}


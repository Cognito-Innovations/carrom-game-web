import { Point } from '../types/Point';
import { GattiType, typeColor, typeSize } from '../types/Gatti';
import { Util } from '../utils/Util';
import { Board } from './Board';
import { Hole } from './Hole';

export class Gatti {
  type: GattiType;
  color: string;
  radius: number;
  boundary: number;
  pos: Point;
  velocity: Point;
  friction: number;
  state: 'rest' | 'motion';
  status: string;

  constructor(type: GattiType, pos: Point) {
    this.type = type;
    this.color = typeColor[type];
    this.radius = typeSize[type];
    this.boundary = this.radius + 3;
    this.pos = pos;
    this.velocity = new Point(0, 0);
    this.friction = 0.92;
    this.state = 'rest';
    this.status = 'ok';
  }

  draw(ctx: CanvasRenderingContext2D, board: Board): void {
    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    if (
      (Math.floor(this.velocity.x.toFixed(1)) === 0 || Math.floor(this.velocity.y.toFixed(1)) === 0) &&
      board.state === 'third'
    ) {
      this.state = 'rest';
    } else {
      this.state = 'motion';
    }

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'black';
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  strike(fx: number, fy: number): void {
    this.velocity.x = fx;
    this.velocity.y = fy;
  }

  checkPoint(p: Point): boolean {
    const ut = new Util();
    const pDist = ut.getDistance(p, this.pos);
    return pDist < this.radius;
  }

  checkBoundary(canvas: HTMLCanvasElement): void {
    if (this.pos.y - this.radius < 0) {
      this.velocity.y *= -1;
      while (this.pos.y - this.radius < 0) this.pos.y++;
    } else if (this.pos.y + this.radius > canvas.height) {
      this.velocity.y *= -1;
      while (this.pos.y + this.radius > canvas.height) this.pos.y--;
    } else if (this.pos.x + this.radius > canvas.width) {
      this.velocity.x *= -1;
      while (this.pos.x + this.radius > canvas.width) this.pos.x--;
    } else if (this.pos.x - this.radius < 0) {
      this.velocity.x *= -1;
      while (this.pos.x - this.radius < 0) this.pos.x++;
    }
  }

  checkCollission(gattis: Gatti[], canvas: HTMLCanvasElement): void {
    const ut = new Util();
    const g1 = this;
    let g2: Gatti;
    for (let i = 0; i < gattis.length; i++) {
      g2 = gattis[i];
      if (g1 !== g2) {
        if (ut.checkCirCollission(g1, g2)) {
          const dx = g1.pos.x - g2.pos.x;
          const dy = g1.pos.y - g2.pos.y;

          const phi = Math.atan2(dy, dx);

          const mag1 = Math.sqrt(g1.velocity.x * g1.velocity.x + g1.velocity.y * g1.velocity.y);
          const mag2 = Math.sqrt(g2.velocity.x * g2.velocity.x + g2.velocity.y * g2.velocity.y);

          const dir1 = Math.atan2(g1.velocity.y, g1.velocity.x);
          const dir2 = Math.atan2(g2.velocity.y, g2.velocity.x);

          const xspeed1 = mag1 * Math.cos(dir1 - phi);
          const yspeed1 = mag1 * Math.sin(dir1 - phi);

          const xspeed2 = mag2 * Math.cos(dir2 - phi);
          const yspeed2 = mag2 * Math.sin(dir2 - phi);

          const finalXspeed1 = xspeed2;
          const finalXspeed2 = xspeed1;

          const finalYspeed1 = yspeed1;
          const finalYspeed2 = yspeed2;

          const tempvxi = Math.cos(phi) * finalXspeed1 + Math.cos(phi + Math.PI / 2) * finalYspeed1;
          const tempvyi = Math.sin(phi) * finalXspeed1 + Math.sin(phi + Math.PI / 2) * finalYspeed1;
          const tempvxj = Math.cos(phi) * finalXspeed2 + Math.cos(phi + Math.PI / 2) * finalYspeed2;
          const tempvyj = Math.sin(phi) * finalXspeed2 + Math.sin(phi + Math.PI / 2) * finalYspeed2;

          g1.velocity.x = tempvxi;
          g1.velocity.y = tempvyi;
          g2.velocity.x = tempvxj;
          g2.velocity.y = tempvyj;

          while (ut.checkCirCollission(g1, g2)) {
            g1.pos.x += g1.velocity.x;
            g1.pos.y += g1.velocity.y;
            g2.pos.x += g2.velocity.x;
            g2.pos.y += g2.velocity.y;
          }
        }
      }
    }
  }

  checkInHoles(holes: Hole[], gattis: Gatti[], board: Board, onGattiPocketed: (gatti: Gatti, holeIndex: number) => void): void {
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      if (h.check(this)) {
        let g: Gatti | undefined;
        let next = false;
        if (this.type === 'striker') {
          board.toast('Foul', () => {
            board.getCurrentPlayer()?.applyFine('striker');
            next = false;
          });
        } else if (this.type === 'queen') {
          board.queenMode = true;
          const index = gattis.indexOf(this);
          if (index > -1) {
            g = gattis.splice(index, 1)[0];
            h.addToPocket(g);
            onGattiPocketed(g, i);
          }
          next = true;
        }

        if (this.type === 'black' || this.type === 'white') {
          const currentPlayer = board.getCurrentPlayer();
          if (board.queenMode && currentPlayer) {
            currentPlayer.incScore('queen');
          }
          const index = gattis.indexOf(this);
          if (index > -1) {
            g = gattis.splice(index, 1)[0];
            h.addToPocket(g);
            onGattiPocketed(g, i);
          }
          if (currentPlayer) {
            currentPlayer.incScore();
            // Track which player hit which pieces
            if (board.isPlayer1Turn()) {
              board.player1PiecesHit++;
            } else {
              board.player2PiecesHit++;
            }
          }
          next = true;
        }

        if (next) {
          board.next = board.turn;
        } else {
          if (board.turn === 'top') {
            board.next = 'bottom';
          } else if (board.turn === 'bottom') {
            board.next = 'top';
          }
        }
      }
    }
  }
}


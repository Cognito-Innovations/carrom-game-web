import { Point } from '../types/Point';
import { Gatti } from './Gatti';
import { Hole } from './Hole';
import { Target } from './Target';
import { Player } from './Player';

export type GameState = 'first' | 'second' | 'third';
export type Turn = 'top' | 'bottom';

export class Board {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  gattis: Gatti[];
  holes: Hole[];
  target: Target;
  striker: Gatti;
  cursor: { initial: Point; final: Point };
  state: GameState;
  turn: Turn;
  next: Turn;
  player1: Player;
  player2: Player;
  queenMode: boolean;
  isGameOver: boolean;
  player1PiecesHit: number;
  player2PiecesHit: number;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.gattis = [];
    this.holes = [];
    this.target = new Target();
    this.striker = new Gatti('striker', new Point(250, canvas.height - 60));
    this.cursor = { initial: new Point(0, 0), final: new Point(0, 0) };
    this.state = 'first';
    this.turn = 'bottom';
    this.next = 'top';
    this.player1 = new Player('Player 1', 0);
    this.player2 = new Player('Player 2 (Computer)', 1);
    this.queenMode = false;
    this.isGameOver = false;
    this.player1PiecesHit = 0;
    this.player2PiecesHit = 0;
  }

  init(): void {
    this.gattis = [];
    this.striker = new Gatti('striker', new Point(this.canvas.width / 2, this.canvas.height - 60));
    this.gattis.push(this.striker);
    this.holes = [];
    for (let i = 0; i < 4; i++) {
      this.holes.push(new Hole(i, this.canvas.width, this.canvas.height));
    }
    this.player1 = new Player('Player 1', 0);
    this.player2 = new Player('Player 2 (Computer)', 1);
    this.state = 'first';
    this.turn = 'bottom'; // Player 1 starts at bottom
    this.next = 'top';
    this.queenMode = false;
    this.isGameOver = false;
    this.player1PiecesHit = 0;
    this.player2PiecesHit = 0;
  }

  draw(backCtx: CanvasRenderingContext2D): void {
    const canvas = this.canvas;

    // Enable anti-aliasing for smoother lines
    backCtx.imageSmoothingEnabled = true;
    backCtx.imageSmoothingQuality = 'high';

    for (let i = 0; i < this.holes.length; i++) {
      this.holes[i].draw(backCtx);
    }

    // Center circles
    backCtx.beginPath();
    backCtx.arc(canvas.width / 2, canvas.height / 2, 50, 0, 2 * Math.PI);
    backCtx.strokeStyle = '#000000';
    backCtx.lineWidth = 2;
    backCtx.stroke();
    
    backCtx.beginPath();
    backCtx.arc(canvas.width / 2, canvas.height / 2, 55, 0, 2 * Math.PI);
    backCtx.strokeStyle = '#000000';
    backCtx.lineWidth = 2;
    backCtx.stroke();
    
    backCtx.beginPath();
    backCtx.arc(canvas.width / 2, canvas.height / 2, 20, 0, 2 * Math.PI);
    backCtx.strokeStyle = '#000000';
    backCtx.lineWidth = 2;
    backCtx.stroke();

    // Boundary rectangles
    backCtx.strokeStyle = '#000000';
    backCtx.lineWidth = 2;
    backCtx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);
    backCtx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);

    const unit = 65;
    const arrPos = [
      { x: unit, y: unit },
      { x: canvas.width - unit, y: unit },
      { x: canvas.width - unit, y: canvas.width - unit },
      { x: unit, y: canvas.height - unit },
    ];

    // Corner circles
    for (let i = 0; i < arrPos.length; i++) {
      const p = arrPos[i];

      backCtx.beginPath();
      backCtx.arc(p.x, p.y, 15, 0, 2 * Math.PI);
      backCtx.fillStyle = 'maroon';
      backCtx.fill();

      backCtx.beginPath();
      backCtx.arc(p.x, p.y, 13, 0, 2 * Math.PI);
      backCtx.fillStyle = '#FFFFE0';
      backCtx.fill();

      backCtx.beginPath();
      backCtx.arc(p.x, p.y, 12, 0, 2 * Math.PI);
      backCtx.fillStyle = '#373737';
      backCtx.fill();

      backCtx.beginPath();
      backCtx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
      backCtx.fillStyle = '#FFFFE0';
      backCtx.fill();
    }

    // Danger circles
    let x, y;
    const dangerUnit = 67;
    for (let i = 0; i < arrPos.length; i++) {
      if (i === 0) {
        x = dangerUnit;
        y = dangerUnit;
      } else if (i === 1) {
        x = -dangerUnit;
        y = dangerUnit;
      } else if (i === 2) {
        x = -dangerUnit;
        y = -dangerUnit;
      } else if (i === 3) {
        x = dangerUnit;
        y = -dangerUnit;
      }

      const p = arrPos[i];
      backCtx.beginPath();
      backCtx.arc(p.x + x, p.y + y, 20, 0, 2 * Math.PI);
      backCtx.fillStyle = 'lightsalmon';
      backCtx.fill();

      backCtx.beginPath();
      backCtx.arc(p.x + x, p.y + y, 20, 0, 2 * Math.PI);
      backCtx.strokeStyle = '#000000';
      backCtx.lineWidth = 1;
      backCtx.stroke();
    }

    // Corner arrow lines
    const lineUnit = 70;
    for (let i = 0; i < arrPos.length; i++) {
      let unitX, unitY;
      if (i === 0) {
        unitX = lineUnit;
        unitY = lineUnit;
      } else if (i === 1) {
        unitX = -lineUnit;
        unitY = lineUnit;
      } else if (i === 2) {
        unitX = -lineUnit;
        unitY = -lineUnit;
      } else if (i === 3) {
        unitX = lineUnit;
        unitY = -lineUnit;
      }

      const p = arrPos[i];
      const tox = p.x + unitX;
      const toy = p.y + unitY;
      const fromx = p.x;
      const fromy = p.y;
      const headlen = 8;
      const angle = Math.atan2(toy - fromy, tox - fromx);
      
      backCtx.beginPath();
      backCtx.moveTo(fromx, fromy);
      backCtx.lineTo(tox, toy);
      backCtx.strokeStyle = '#000000';
      backCtx.lineWidth = 2;
      backCtx.lineCap = 'round';
      backCtx.stroke();
      
      // Arrow head
      backCtx.beginPath();
      backCtx.moveTo(tox, toy);
      backCtx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      backCtx.moveTo(tox, toy);
      backCtx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      backCtx.strokeStyle = '#000000';
      backCtx.lineWidth = 2;
      backCtx.lineCap = 'round';
      backCtx.stroke();
    }
  }

  arrangeGattis(): void {
    this.gattis.push(new Gatti('queen', new Point(this.canvas.width / 2, this.canvas.height / 2)));

    this.gattis[0].velocity.x = 0.00005;
    this.gattis[0].state = 'motion';

    const s = this.gattis[0].radius * 2;

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2 + s, this.canvas.height / 2)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2 + 2 * s, this.canvas.height / 2)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2 - s, this.canvas.height / 2)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2 - 2 * s, this.canvas.height / 2)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2, this.canvas.height / 2 - s)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2, this.canvas.height / 2 - 2 * s)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2, this.canvas.height / 2 + s)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2, this.canvas.height / 2 + 2 * s)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2 + s, this.canvas.height / 2 + s)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2 + 2 * s, this.canvas.height / 2 + 2 * s)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2 - s, this.canvas.height / 2 - s)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2 - 2 * s, this.canvas.height / 2 - 2 * s)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2 + s, this.canvas.height / 2 - s)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2 + 2 * s, this.canvas.height / 2 - 2 * s)));

    this.gattis.push(new Gatti('black', new Point(this.canvas.width / 2 - s, this.canvas.height / 2 + s)));
    this.gattis.push(new Gatti('white', new Point(this.canvas.width / 2 - 2 * s, this.canvas.height / 2 + 2 * s)));
  }

  nextTurn(): void {
    if (this.turn === 'bottom') {
      this.turn = 'top'; // Switch to Player 2 (Computer)
      this.next = 'bottom';
    } else {
      this.turn = 'bottom'; // Switch to Player 1 (Manual)
      this.next = 'top';
    }
    
    // Move striker to appropriate position
    const unit = 60;
    if (this.turn === 'bottom') {
      this.striker.pos.y = this.canvas.height - unit;
    } else {
      this.striker.pos.y = unit;
    }
    this.striker.pos.x = this.canvas.width / 2;
  }

  checkGameOver(): boolean {
    // Game ends when all pieces (except striker) are pocketed
    const remainingPieces = this.gattis.filter(g => g.type !== 'striker').length;
    if (remainingPieces === 0) {
      this.isGameOver = true;
      return true;
    }
    return false;
  }

  getCurrentPlayer(): Player | undefined {
    if (this.turn === 'bottom') return this.player1; // Player 1 is at bottom
    if (this.turn === 'top') return this.player2; // Player 2 (Computer) is at top
    return undefined;
  }

  isPlayer1Turn(): boolean {
    return this.turn === 'bottom';
  }

  isPlayer2Turn(): boolean {
    return this.turn === 'top';
  }

  toast(msg: string, callback: () => void): void {
    setTimeout(() => {
      callback();
    }, 500);
  }
}


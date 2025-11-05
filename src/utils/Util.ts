import { Point } from '../types/Point';

export class Util {
  getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent, board: { turn: string }): Point {
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;
    
    if (evt instanceof MouseEvent) {
      clientX = evt.clientX;
      clientY = evt.clientY;
    } else {
      const touch = evt.touches[0] || evt.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    }
    
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    if (board.turn === 'top') {
      x = canvas.width - x;
      y = canvas.height - y;
    }

    return new Point(x, y);
  }

  random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getDistance(i: Point, f: Point): number {
    return Math.abs(Math.sqrt(Math.pow(f.x - i.x, 2) + Math.pow(f.y - i.y, 2)));
  }

  checkCirCollission(c1: { pos: Point; radius: number }, c2: { pos: Point; radius: number }): boolean {
    const d = this.getDistance(c1.pos, c2.pos);
    const rad = c1.radius + c2.radius;
    return d < rad;
  }

  rotate(p: Point, deg: number): Point {
    if (deg === 90) {
      return new Point(p.y, -p.x);
    }
    return p;
  }
}


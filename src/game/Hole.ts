import { Point } from '../types/Point';
import { Gatti } from './Gatti';
import { Util } from '../utils/Util';

export class Hole {
  radius: number;
  num: number;
  pocket: Gatti[];
  x: number;
  y: number;

  constructor(index: number, canvasWidth: number, canvasHeight: number) {
    this.radius = 15;
    this.num = index;
    this.pocket = [];

    const unit = 25;
    if (index === 0) {
      this.x = unit;
      this.y = unit;
    } else if (index === 1) {
      this.x = canvasWidth - unit;
      this.y = unit;
    } else if (index === 2) {
      this.x = canvasWidth - unit;
      this.y = canvasHeight - unit;
    } else if (index === 3) {
      this.x = unit;
      this.y = canvasHeight - unit;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'gray';
    ctx.shadowBlur = 0;
    ctx.shadowColor = '';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#373737';
    ctx.fill();
  }

  check(gatti: Gatti): boolean {
    const ut = new Util();
    const d = ut.getDistance(new Point(this.x, this.y), new Point(gatti.pos.x, gatti.pos.y));
    return d < this.radius;
  }

  addToPocket(gatti: Gatti): void {
    this.pocket.push(gatti);
  }
}


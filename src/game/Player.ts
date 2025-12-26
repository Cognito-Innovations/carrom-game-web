import { GattiType } from '../types/Gatti';

export class Player {
  name: string;
  score: number;
  id: string;
  pocketed: GattiType[];
  hasQueen: boolean;
  color: GattiType;

  constructor(name: string, order: number, color: GattiType) {
    this.name = name;
    this.score = 0;
    this.id = order === 0 ? 'bottom' : 'top';
    this.pocketed = [];
    this.hasQueen = false;
    this.color = color;
  }

  incScore(type?: GattiType): void {
    if (type === 'queen') {
      this.score += 10; 
      this.hasQueen = true;
    } else {
      this.score += 1;
    }
  }

  decScore(): void {
    if (this.score > 0) this.score -= 1;
  }

  pocketGatti(type: GattiType): void {
    this.pocketed.push(type);
    if (type === 'queen') {
      this.hasQueen = true;
    }
  }

  applyFine(type: string): void {
      this.decScore();
  }

  reset(): void {
    this.pocketed = [];
    this.hasQueen = false;
    this.score = 0;
  }
}


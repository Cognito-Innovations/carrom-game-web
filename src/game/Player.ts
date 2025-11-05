export class Player {
  name: string;
  score: number;
  id: string;

  constructor(name: string, order: number) {
    this.name = name;
    this.score = 0;
    this.id = order === 0 ? 'top' : 'bottom';
  }

  incScore(q?: string): void {
    if (q === 'queen') {
      this.score += 10;
    } else {
      this.score++;
    }
  }

  decScore(): void {
    if (this.score >= 1) this.score--;
  }

  applyFine(type: string): void {
    if (type === 'striker') {
      if (this.score >= 2) this.score -= 2;
    } else if (type === 'invalid-gatti') {
      if (this.score >= 5) this.score -= 5;
    }
  }
}


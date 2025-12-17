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
    this.friction = 0.982; 
    this.state = 'rest';
    this.status = 'ok';
  }

  draw(ctx: CanvasRenderingContext2D, board: Board): void {
    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    if (
      (Math.abs(this.velocity.x) < 0.08 && Math.abs(this.velocity.y) < 0.08) &&
      board.state === 'third'
    ) {
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.state = 'rest';
    } else {
      this.state = 'motion';
    }

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(this.pos.x - 3, this.pos.y - 3, this.radius / 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
  }

  strike(fx: number, fy: number): void {
    this.velocity.x = fx;
    this.velocity.y = fy;
  }

  checkBoundary(canvas: HTMLCanvasElement): void {
    const restitution = 0.7;
    if (this.pos.y - this.radius < 0) {
      this.velocity.y *= -1 * restitution;
      this.pos.y = this.radius; 
    } else if (this.pos.y + this.radius > canvas.height) {
      this.velocity.y *= -1 * restitution;
      this.pos.y = canvas.height - this.radius;
    } 
    
    if (this.pos.x + this.radius > canvas.width) {
      this.velocity.x *= -1 * restitution;
      this.pos.x = canvas.width - this.radius;
    } else if (this.pos.x - this.radius < 0) {
      this.velocity.x *= -1 * restitution;
      this.pos.x = this.radius;
    }
  }

  checkCollission(gattis: Gatti[], canvas: HTMLCanvasElement): void {
    const ut = new Util();
    const g1 = this;
    
    for (let i = 0; i < gattis.length; i++) {
      const g2 = gattis[i];
      if (g1 === g2) continue;

      if (ut.checkCirCollission(g1, g2)) {
        const dx = g1.pos.x - g2.pos.x;
        const dy = g1.pos.y - g2.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        const vx1 = g1.velocity.x * cos + g1.velocity.y * sin;
        const vy1 = g1.velocity.y * cos - g1.velocity.x * sin;
        const vx2 = g2.velocity.x * cos + g2.velocity.y * sin;
        const vy2 = g2.velocity.y * cos - g2.velocity.x * sin;

        const vx1Final = vx2;
        const vx2Final = vx1;

        g1.velocity.x = vx1Final * cos - vy1 * sin;
        g1.velocity.y = vy1 * cos + vx1Final * sin;
        g2.velocity.x = vx2Final * cos - vy2 * sin;
        g2.velocity.y = vy2 * cos + vx2Final * sin;

        const overlap = (g1.radius + g2.radius) - dist;
        if (overlap > 0) {
           const moveX = (overlap / 2) * Math.cos(angle);
           const moveY = (overlap / 2) * Math.sin(angle);
           g1.pos.x += moveX;
           g1.pos.y += moveY;
           g2.pos.x -= moveX;
           g2.pos.y -= moveY;
        }
      }
    }
  }

  checkInHoles(holes: Hole[], gattis: Gatti[], board: Board, onGattiPocketed: (gatti: Gatti, holeIndex: number) => void): void {

    const isStrikerInHole = holes.some(h => h.check(board.striker));

    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];

      if (h.check(this)) {
        const currentPlayer = board.getCurrentPlayer();
        if (!currentPlayer) return;

        let repeatTurn = false;
        let isPocketed = false;

        if (this.type === 'striker') {
           board.toast('Foul: Striker Pocketed', () => {
              board.returnPenaltyGatti(currentPlayer);
           });
           this.velocity.x = 0;
           this.velocity.y = 0;
           repeatTurn = false;
           isPocketed = false; 
        }

        else {
            // Check if Striker also fell in (Foul)
            if (isStrikerInHole) {
                board.toast('Foul: Striker + Coin!', () => {
                   // Return coin to center
                   this.velocity.x = 0;
                   this.velocity.y = 0;
                   this.pos = board.getFreeCenterPos(this.radius);
                   board.returnPenaltyGatti(currentPlayer); 
                });
                repeatTurn = false; 
                isPocketed = false; 
                return;
            }

            if (this.type === 'queen') {
               board.queenMode = true;
               board.queenAwaitingCover = currentPlayer.id;
               isPocketed = true;
               repeatTurn = true; 
            }
            else if (this.type === 'black' || this.type === 'white') {
                // Check "Last Coin Before Queen" Foul
                const remainingOwnCoins = board.gattis.filter(g => g.type === currentPlayer.color).length;
                const isQueenOnBoard = board.gattis.some(g => g.type === 'queen');

                if (this.type === currentPlayer.color && remainingOwnCoins === 1 && isQueenOnBoard) {
                    board.toast('Foul: Queen must be covered first!', () => {
                        board.returnPenaltyGatti(currentPlayer);
                    });
                    this.velocity.x = 0; 
                    this.velocity.y = 0;
                    this.pos = board.getFreeCenterPos(this.radius);
                    repeatTurn = false; 
                    isPocketed = false; 
                } 
                else {
                    // Valid Pocket
                    isPocketed = true;

                    if (this.type === currentPlayer.color) {
                        // HIT OWN
                        currentPlayer.pocketGatti(this.type);
                        currentPlayer.incScore();
                        
                        // LIMIT TO 1 EXTRA TURN
                        if (board.consecutiveTurns >= 1) {
                            repeatTurn = false; // Limit reached
                        } else {
                            board.consecutiveTurns++;
                            repeatTurn = true;  // Bonus turn
                        }

                        // Queen Cover Success
                        if (board.queenMode && board.queenAwaitingCover === currentPlayer.id) {
                            currentPlayer.pocketGatti('queen');
                            currentPlayer.incScore('queen');
                            board.queenMode = false;
                            board.queenAwaitingCover = '';
                            board.toast('Queen Covered!', () => {});
                        }
                    } else {
                        // HIT OPPONENT
                        const opponent = board.isPlayer1Turn() ? board.player2 : board.player1;
                        opponent.pocketGatti(this.type);
                        opponent.incScore();
                        repeatTurn = false; 
                    }
                }
            }
        }

        if (isPocketed) {
             const index = gattis.indexOf(this);
             if (index > -1) {
                 const removedGatti = gattis.splice(index, 1)[0];
                 h.addToPocket(removedGatti);
                 onGattiPocketed(removedGatti, i);
                 
                 if (board.isPlayer1Turn()) board.player1PiecesHit++;
                 else board.player2PiecesHit++;
             }
        }

        // If we found a hole, we decide here if we repeat or switch
        if (repeatTurn) {
             board.next = board.turn;
        } else {
             board.next = board.turn === 'bottom' ? 'top' : 'bottom';
        }
        return; 
      }
    }
  }
}


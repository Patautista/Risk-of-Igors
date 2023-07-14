class Enemy {
    constructor(intialPosition, intialState, intialDifficulty) {
      this.position = intialPosition;
      this.state = intialState;
      this.difficulty = intialDifficulty
      this.facingDirection = [0,0,0]
    }
}

let enemyPosition = [0,0,0];
let enemyFacingDirection = [0,0,1];
let enemyIsIt = true;
let enemySpeed = 1.025;
let eAngle = 0
const TOUCH_TOLERANCE = 2.5;
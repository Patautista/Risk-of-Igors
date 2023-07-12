class Enemy {
    constructor(intialPosition, intialState, intialDifficulty) {
      this.position = intialPosition;
      this.state = intialState;
      this.difficulty = intialDifficulty
    }
}

let enemyPosition = [0,0,0];
let enemyIsIt = true;
let enemySpeed = 1.025;
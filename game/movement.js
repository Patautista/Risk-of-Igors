// Movement globals (updated every frame)
var angle = 0;
var movement = {backForth: 0, sideways: 0}

// Movement constants
const STEP_AMOUNT = 0.008;
const ROT_AMOUNT = 0.5;

function handleKeyDown(event) {
    switch (event.key) {
        case "w":
        case "ArrowUp":
            movement.backForth = 1; // Move up
            break;
        case "s":
        case "ArrowDown": 
            movement.backForth = -1; // Move down
            break;
        case "ArrowRight":
            angle = -ROT_AMOUNT; // Turn right
            break;
        case "ArrowLeft":
            angle = ROT_AMOUNT; // Turn left
            break;
        case "d":
            movement.sideways = -1 // Move right
            break;
        case "a":
            movement.sideways = 1 // Move left
            break;
        default:
            // Ignore other keys
            break;
    }
}

function handleKeyUp(event) {
    switch (event.key) {
        case "w":
        case "ArrowUp":
            movement.backForth = 0.0; // Stop Moving
            break;
        case "s":
        case "ArrowDown":
            movement.backForth = 0.0; // Stop Moving
            break;
        case "ArrowLeft":
            angle = 0.00; // Stop Turning
            break;
        case "ArrowRight":
            angle = 0.00; // Stop Turning
            break;
        case "d":
            movement.sideways = 0 // Stop Moving
            break;
        case "a":
            movement.sideways = 0 // Stop Moving
            break;
        default:
            // Ignore other keys
            break;
    }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

const WALKING_SOUND = new Audio('./sound/walking.mp3');
var angle = 0;
var moving_back_forth = 0;
var moving_sideways = 0;
const STEP_AMOUNT = 0.008
const ROT_AMOUNT = 0.5

function handleKeyDown(event) {
    switch (event.key) {
        case "w":
        case "ArrowUp":
            moving_back_forth = 1; // Move up
            break;
        case "s":
        case "ArrowDown": 
            moving_back_forth = -1; // Move down
            break;
        case "ArrowRight":
            angle = -ROT_AMOUNT; // Move right
            break;
        case "ArrowLeft":
            angle = ROT_AMOUNT; // Move left
            break;
        case "d":
            moving_sideways = -1
            break;
        case "a":
            moving_sideways = 1
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
            moving_back_forth = 0.0; // Stop Moving
            break;
        case "s":
        case "ArrowDown":
            moving_back_forth = 0.0; // Stop Moving
            break;
        case "ArrowLeft":
            angle = 0.00; // Move left
            break;
        case "ArrowRight":
            angle = 0.00; // Move right
            break;
        case "d":
            moving_sideways = 0
        case "a":
            moving_sideways = 0
        default:
            // Ignore other keys
            break;
    }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
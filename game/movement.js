var lastMouseMoveTimestamp = Date.now();
var mouseStopTimeout = 100; // Adjust this value as needed, in milliseconds

var canvas = document.getElementById("glcanvas1");
const movement = {forwardBackward: 0, leftRight: 0, jump: false};

const rotation = {yaw: 0, pitch: 0,};

const CAMERA_SPEED = 0.1; // Adjust the camera movement speed here
const ROT_SPEED = 0.005; // Adjust the camera rotation speed here
const WALKING_SOUND = new Audio("./sound/walking.mp3");


function handleKeyDown(event) {
    switch (event.key) {
        case "w":
        case "ArrowUp":
            movement.forwardBackward = 1; // Move up
            break;
        case "s":
        case "ArrowDown": 
            movement.forwardBackward = -1; // Move down
            break;
        case "ArrowRight":
            angle = -ROT_AMOUNT; // Turn right
            break;
        case "ArrowLeft":
            angle = ROT_AMOUNT; // Turn left
            break;
        case "d":
            movement.leftRight = 1 // Move right
            break;
        case "a":
            movement.leftRight = -1 // Move left
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
            movement.forwardBackward = 0.0; // Stop Moving
            break;
        case "s":
        case "ArrowDown":
            movement.forwardBackward = 0.0; // Stop Moving
            break;
        case "ArrowLeft":
            angle = 0.00; // Stop Turning
            break;
        case "ArrowRight":
            angle = 0.00; // Stop Turning
            break;
        case "d":
            movement.leftRight = 0 // Stop Moving
            break;
        case "a":
            movement.leftRight = 0 // Stop Moving
            break;
        default:
            // Ignore other keys
            break;
    }
}

// Listen for keyboard and mouse events
document.addEventListener("keydown", handleKeyDown);

document.addEventListener("keyup", handleKeyUp);

canvas.addEventListener("mousemove", function (event) {
    // Handle mouse movement to update rotation variables
    rotation.yaw = event.movementX * 0.002; // Horizontal rotation (yaw)
    rotation.pitch = event.movementY * 0.002; // Vertical rotation (pitch)

    // Update the timestamp for the last mouse movement
    lastMouseMoveTimestamp = Date.now();
});
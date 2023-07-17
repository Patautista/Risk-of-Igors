var lastMouseMoveTimestamp = Date.now();
var mouseStopTimeout = 100; // Adjust this value as needed, in milliseconds

var canvas = document.getElementById("glcanvas1");
const movement = {
forwardBackward: 0,
leftRight: 0,
jump: false,
};

const rotation = {
yaw: 0,
pitch: 0,
};

const cameraSpeed = 0.1; // Adjust the camera movement speed here
const rotationSpeed = 0.005; // Adjust the camera rotation speed here


// Listen for keyboard and mouse events
document.addEventListener("keydown", function (event) {
    // Handle keydown events to update movement variables
    if (event.key === "w") movement.forwardBackward = 1;
    else if (event.key === "s") movement.forwardBackward = -1;
    else if (event.key === "a") movement.leftRight = -1;
    else if (event.key === "d") movement.leftRight = 1;
    else if (event.key === " ") movement.jump = true;
});

document.addEventListener("keyup", function (event) {
    // Handle keyup events to stop movement
    if (event.key === "w") movement.forwardBackward = 0;
    else if (event.key === "s") movement.forwardBackward = 0;
    else if (event.key === "a") movement.leftRight = 0;
    else if (event.key === "d") movement.leftRight = 0;
    else if (event.key === " ") movement.jump = false;
});

canvas.addEventListener("mousemove", function (event) {
    // Handle mouse movement to update rotation variables
    rotation.yaw = event.movementX * 0.002; // Horizontal rotation (yaw)
    rotation.pitch = event.movementY * 0.002; // Vertical rotation (pitch)

    // Update the timestamp for the last mouse movement
    lastMouseMoveTimestamp = Date.now();
});

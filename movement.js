var movement = { x: 0, y: 0 , z: 0};

var amount = 0.025
var rot_amount = 0.25

function handleKeyDown(event) {
    switch (event.key) {
        case "ArrowUp":
            movement.z = -amount; // Move up
            break;
        case "ArrowDown":
            movement.z = amount; // Move down
            break;
        case "ArrowRight":
            movement.y = -rot_amount; // Move right
            break;
        case "ArrowLeft":
            movement.y = rot_amount; // Move left
            break;
      
      default:
        // Ignore other keys
        break;
    }
}

function handleKeyUp(event) {
    switch (event.key) {
      case "ArrowUp":
        movement.z = 0.0; // Stop Moving
        break;
      case "ArrowDown":
        movement.z = 0.0; // Stop Moving
        break;
      case "ArrowLeft":
        movement.y = 0.00; // Move left
        break;
      case "ArrowRight":
        movement.y = 0.00; // Move right
        break;
      default:
        // Ignore other keys
        break;
    }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);